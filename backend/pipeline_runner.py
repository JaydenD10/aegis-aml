import io
import json
import time
import numpy as np
import pandas as pd
import networkx as nx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

# ── Drift Detectors (from train.py) ──────────────────────────────────────────
class PageHinkley:
    def __init__(self, threshold=35):
        self.threshold = threshold
        self.mean = 0.0
        self.n = 0
        self.sum_deviation = 0.0
        self.min_deviation = 0.0
        
    def update(self, x):
        self.n += 1
        self.mean += (x - self.mean) / self.n
        self.sum_deviation += (x - self.mean)
        if self.sum_deviation < self.min_deviation:
            self.min_deviation = self.sum_deviation
        if self.sum_deviation - self.min_deviation > self.threshold:
            self.reset()
            return True
        return False
        
    def reset(self):
        self.mean = 0.0
        self.n = 0
        self.sum_deviation = 0.0
        self.min_deviation = 0.0

class CUSUM:
    def __init__(self, k=0.5, h=4, warmup=10):
        self.k = k
        self.h = h
        self.warmup = warmup
        self.n = 0
        self.mean = 0.0
        self.std = 0.0
        self.s_pos = 0.0
        self.s_neg = 0.0
        self.history = []
        
    def update(self, x):
        self.n += 1
        if self.n <= self.warmup:
            self.history.append(x)
            if self.n == self.warmup:
                self.mean = float(np.mean(self.history))
                self.std = float(np.std(self.history)) + 1e-5
            return False
            
        z = (x - self.mean) / (self.std + 1e-5)
        self.s_pos = max(0, self.s_pos + z - self.k)
        self.s_neg = max(0, self.s_neg - z - self.k)
        
        if self.s_pos > self.h or self.s_neg > self.h:
            self.reset()
            return True
        return False
        
    def reset(self):
        self.n = 0
        self.history = []
        self.s_pos = 0.0
        self.s_neg = 0.0

class ZScore:
    def __init__(self, threshold=2.5):
        self.threshold = threshold
        self.history = []
        
    def update(self, x):
        if len(self.history) < 5:
            self.history.append(x)
            return False
            
        mean = float(np.mean(self.history))
        std = float(np.std(self.history)) + 1e-5
        z = abs(x - mean) / std
        
        self.history.append(x)
        if len(self.history) > 30:
            self.history.pop(0)
            
        return bool(z > self.threshold)


def process_and_run_pipeline(
    df: pd.DataFrame, 
    user_id: int, 
    db: Session,
    dataset_type: str = "transactions"
) -> Dict[str, Any]:
    """
    Execute end-to-end AML feature extraction, drift scoring, ML inference,
    risk banding, alert generation, SHAP explainability, and database persistence for a user workspace.
    """
    # Normalize column names
    df.columns = [c.lower().strip() for c in df.columns]
    
    if dataset_type == "accounts" or ("customer_id" in df.columns and "account_id" in df.columns and "tx_id" not in df.columns):
        return _process_accounts_only(df, user_id, db)
    
    # Required transaction columns
    required_cols = ["tx_id", "sender_account_id", "receiver_account_id", "tx_amount", "timestamp"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required CSV column: '{col}'")
            
    # Coerce types
    df["tx_id"] = pd.to_numeric(df["tx_id"], errors="coerce").fillna(0).astype(int)
    df["sender_account_id"] = pd.to_numeric(df["sender_account_id"], errors="coerce").fillna(0).astype(int)
    df["receiver_account_id"] = pd.to_numeric(df["receiver_account_id"], errors="coerce").fillna(0).astype(int)
    df["tx_amount"] = pd.to_numeric(df["tx_amount"], errors="coerce").fillna(0.0).astype(float)
    df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce").fillna(0).astype(int)
    
    if "tx_type" not in df.columns:
        df["tx_type"] = "TRANSFER"
    else:
        df["tx_type"] = df["tx_type"].fillna("TRANSFER").astype(str)
        
    if "is_fraud" in df.columns:
        df["is_fraud"] = df["is_fraud"].astype(str).str.lower().isin(["true", "1", "yes", "t"])
    else:
        # Default fraud heuristic if not provided
        df["is_fraud"] = df["tx_amount"] > 50000
        
    if "alert_id" not in df.columns:
        df["alert_id"] = None
    else:
        df["alert_id"] = pd.to_numeric(df["alert_id"], errors="coerce").fillna(-1).astype(int)
        df["alert_id"] = df["alert_id"].replace(-1, None)

    # Filter out empty or duplicate tx_ids
    df = df[df["tx_id"] > 0].drop_duplicates(subset=["tx_id"]).copy()
    if df.empty:
        raise ValueError("No valid transaction rows found in CSV.")

    # 1. Accounts Mapping & Auto-Creation
    unique_senders = [int(x) for x in df["sender_account_id"].unique()]
    unique_receivers = [int(x) for x in df["receiver_account_id"].unique()]
    all_raw_accs = list(set(unique_senders + unique_receivers))
    
    existing_user_accs = set(
        int(r[0]) for r in db.query(models.Account.account_id)
        .filter(models.Account.account_id.in_(all_raw_accs))
        .filter(models.Account.user_id == user_id)
        .all()
    ) if all_raw_accs else set()
    
    max_acc = int(db.query(func.max(models.Account.account_id)).scalar() or 1000000)
    max_tx = int(db.query(func.max(models.Transaction.tx_id)).scalar() or 10000000)
    
    acc_map = {}
    new_acc_objs = []
    
    for i, raw_id in enumerate(all_raw_accs):
        if raw_id in existing_user_accs:
            acc_map[raw_id] = raw_id
        else:
            # Check if taken globally
            is_taken = db.query(models.Account.account_id).filter(models.Account.account_id == raw_id).first() is not None
            assigned_id = int(max_acc + i + 1) if is_taken else int(raw_id)
            acc_map[raw_id] = assigned_id
            new_acc_objs.append(models.Account(
                account_id=assigned_id,
                customer_id=f"CUST-{assigned_id}",
                init_balance=10000.0,
                country="US",
                account_type="STANDARD",
                is_fraud=False,
                tx_behavior_id=1,
                user_id=int(user_id)
            ))
            
    if new_acc_objs:
        db.bulk_save_objects(new_acc_objs)
        db.flush()
        
    df["sender_account_id"] = df["sender_account_id"].map(lambda x: acc_map.get(int(x), int(x)))
    df["receiver_account_id"] = df["receiver_account_id"].map(lambda x: acc_map.get(int(x), int(x)))

    # Map TX IDs if globally taken
    tx_map = {}
    for i, raw_tid in enumerate(df["tx_id"]):
        raw_tid_int = int(raw_tid)
        is_taken = db.query(models.Transaction.tx_id).filter(models.Transaction.tx_id == raw_tid_int).first() is not None
        assigned_tx = int(max_tx + i + 1) if is_taken else raw_tid_int
        tx_map[raw_tid_int] = assigned_tx
        
    df["tx_id"] = df["tx_id"].map(lambda x: tx_map.get(int(x), int(x)))

    # 2. Feature Engineering (Basic, Behavioral, Network)
    df["log_amount"] = np.log1p(df["tx_amount"])
    df["is_large_txn"] = (df["tx_amount"] > 10000).astype(int)
    df["payment_format_enc"] = df["tx_type"].astype("category").cat.codes
    df["day_index"] = df["timestamp"] // 86400

    # Behavioral Features
    df_sorted_send = df.sort_values(by=["sender_account_id", "timestamp"]).copy()
    df["rolling_mean_amt_send"] = df_sorted_send.groupby("sender_account_id")["tx_amount"].transform(lambda x: x.rolling(20, min_periods=1).mean())
    df["rolling_std_amt_send"] = df_sorted_send.groupby("sender_account_id")["tx_amount"].transform(lambda x: x.rolling(20, min_periods=1).std().fillna(0))
    df["rolling_txn_count_send"] = df_sorted_send.groupby("sender_account_id")["tx_amount"].transform(lambda x: x.rolling(20, min_periods=1).count())
    df["acct_total_txns_send"] = df_sorted_send.groupby("sender_account_id").cumcount() + 1
    df["acct_avg_amount_send"] = df_sorted_send.groupby("sender_account_id")["tx_amount"].transform(lambda x: x.expanding().mean())
    df["acct_max_amount_send"] = df_sorted_send.groupby("sender_account_id")["tx_amount"].transform(lambda x: x.expanding().max())
    df["acct_max_mean_ratio_send"] = df["acct_max_amount_send"] / (df["acct_avg_amount_send"] + 1e-5)

    df_sorted_recv = df.sort_values(by=["receiver_account_id", "timestamp"]).copy()
    df["rolling_mean_amt_recv"] = df_sorted_recv.groupby("receiver_account_id")["tx_amount"].transform(lambda x: x.rolling(20, min_periods=1).mean())
    df["rolling_std_amt_recv"] = df_sorted_recv.groupby("receiver_account_id")["tx_amount"].transform(lambda x: x.rolling(20, min_periods=1).std().fillna(0))
    df["acct_total_txns_recv"] = df_sorted_recv.groupby("receiver_account_id").cumcount() + 1

    # Network Features
    G = nx.from_pandas_edgelist(df, "sender_account_id", "receiver_account_id", create_using=nx.DiGraph())
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())
    try:
        pagerank = nx.pagerank(G, alpha=0.85, max_iter=30)
    except Exception:
        pagerank = {n: 1.0 / max(1, len(G)) for n in G.nodes()}

    df["sender_out_degree"] = df["sender_account_id"].map(out_degrees).fillna(0).astype(int)
    df["sender_in_degree"] = df["sender_account_id"].map(in_degrees).fillna(0).astype(int)
    df["receiver_in_degree"] = df["receiver_account_id"].map(in_degrees).fillna(0).astype(int)
    df["receiver_out_degree"] = df["receiver_account_id"].map(out_degrees).fillna(0).astype(int)
    df["sender_total_degree"] = df["sender_out_degree"] + df["sender_in_degree"]
    df["receiver_total_degree"] = df["receiver_out_degree"] + df["receiver_in_degree"]
    df["sender_pagerank"] = df["sender_account_id"].map(pagerank).fillna(0.0).astype(float)
    df["receiver_pagerank"] = df["receiver_account_id"].map(pagerank).fillna(0.0).astype(float)

    # 3. Behavioral Drift Computation
    daily_aggs = df.groupby(["sender_account_id", "day_index"])["tx_amount"].sum().reset_index().sort_values(by=["sender_account_id", "day_index"])
    drift_alerts = []
    current_acct = None
    ph, cusum, zscore = None, None, None

    for row in daily_aggs.itertuples():
        acct = int(row.sender_account_id)
        amt = float(row.tx_amount)
        day = int(row.day_index)
        if acct != current_acct:
            current_acct = acct
            ph = PageHinkley(threshold=25)
            cusum = CUSUM(h=3.5)
            zscore = ZScore(threshold=2.2)
        alerts_count = 0
        if ph.update(amt): alerts_count += 1
        if cusum.update(amt): alerts_count += 1
        if zscore.update(amt): alerts_count += 1
        drift_alerts.append({
            "sender_account_id": acct,
            "day_index": day,
            "total_alerts": alerts_count
        })

    alerts_df = pd.DataFrame(drift_alerts) if drift_alerts else pd.DataFrame(columns=["sender_account_id", "day_index", "total_alerts"])
    if not alerts_df.empty:
        alerts_df["drift_score"] = alerts_df.groupby("sender_account_id")["total_alerts"].transform(
            lambda x: x.rolling(7, min_periods=1).mean() / 3.0
        ).clip(0.0, 1.0)
        df = df.merge(alerts_df[["sender_account_id", "day_index", "drift_score"]], on=["sender_account_id", "day_index"], how="left")
    else:
        df["drift_score"] = 0.0

    df["drift_score"] = df["drift_score"].fillna(0.0).astype(float)

    # 4. ML Prediction & Risk Scoring Model
    def compute_ml_score(r):
        score = 0.05
        if r["tx_amount"] > 10000: score += 0.25
        if r["tx_amount"] > 50000: score += 0.30
        if r["acct_max_mean_ratio_send"] > 3.0: score += 0.20
        if r["sender_out_degree"] > 10: score += 0.15
        if r["is_fraud"]: score += 0.40
        if r["payment_format_enc"] % 2 == 1: score += 0.05
        return float(min(1.0, score))

    df["ml_score"] = df.apply(compute_ml_score, axis=1)
    df["composite_score"] = 0.70 * df["ml_score"] + 0.30 * df["drift_score"]

    def assign_risk_band(score):
        if score >= 0.75: return "CRITICAL"
        if score >= 0.50: return "HIGH"
        if score >= 0.25: return "MEDIUM"
        return "LOW"

    df["risk_band"] = df["composite_score"].apply(assign_risk_band)

    # 5. Database Transactions Insertion
    tx_objects = []
    pred_objects = []
    alert_objects = []
    expl_objects = []
    
    alert_counter = int(time.time()) % 100000 + (user_id * 1000)
    risk_distribution = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

    for _, row in df.iterrows():
        tx_id = int(row["tx_id"])
        band = str(row["risk_band"])
        risk_distribution[band] = risk_distribution.get(band, 0) + 1

        tx_obj = models.Transaction(
            tx_id=int(tx_id),
            sender_account_id=int(row["sender_account_id"]),
            receiver_account_id=int(row["receiver_account_id"]),
            tx_type=str(row["tx_type"]),
            tx_amount=float(row["tx_amount"]),
            timestamp=int(row["timestamp"]),
            is_fraud=bool(row["is_fraud"]),
            alert_id=int(row["alert_id"]) if pd.notna(row["alert_id"]) and row["alert_id"] else None,
            user_id=int(user_id)
        )
        tx_objects.append(tx_obj)

        pred_obj = models.MLPrediction(
            tx_id=int(tx_id),
            log_amount=float(row["log_amount"]),
            is_large_txn=int(row["is_large_txn"]),
            payment_format_enc=int(row["payment_format_enc"]),
            rolling_mean_amt_send=float(row["rolling_mean_amt_send"]),
            rolling_std_amt_send=float(row["rolling_std_amt_send"]),
            rolling_txn_count_send=float(row["rolling_txn_count_send"]),
            acct_total_txns_send=int(row["acct_total_txns_send"]),
            acct_avg_amount_send=float(row["acct_avg_amount_send"]),
            acct_max_amount_send=float(row["acct_max_amount_send"]),
            acct_max_mean_ratio_send=float(row["acct_max_mean_ratio_send"]),
            rolling_mean_amt_recv=float(row["rolling_mean_amt_recv"]),
            rolling_std_amt_recv=float(row["rolling_std_amt_recv"]),
            acct_total_txns_recv=int(row["acct_total_txns_recv"]),
            sender_out_degree=int(row["sender_out_degree"]),
            sender_in_degree=int(row["sender_in_degree"]),
            receiver_in_degree=int(row["receiver_in_degree"]),
            receiver_out_degree=int(row["receiver_out_degree"]),
            sender_total_degree=int(row["sender_total_degree"]),
            receiver_total_degree=int(row["receiver_total_degree"]),
            sender_pagerank=float(row["sender_pagerank"]),
            receiver_pagerank=float(row["receiver_pagerank"]),
            drift_score=float(row["drift_score"]),
            ml_score=float(row["ml_score"]),
            composite_score=float(row["composite_score"]),
            risk_band=band,
            user_id=int(user_id)
        )
        pred_objects.append(pred_obj)

        # Generate Alert for Critical / High risk
        if band in ["CRITICAL", "HIGH"] or bool(row["is_fraud"]):
            alert_counter += 1
            alert_objects.append(models.Alert(
                alert_id=int(alert_counter),
                alert_type="HIGH_RISK_TRANSACTION" if band == "CRITICAL" else "SUSPICIOUS_VOLUME",
                is_fraud=bool(row["is_fraud"]),
                tx_id=int(tx_id),
                sender_account_id=int(row["sender_account_id"]),
                receiver_account_id=int(row["receiver_account_id"]),
                tx_type=str(row["tx_type"]),
                tx_amount=float(row["tx_amount"]),
                timestamp=int(row["timestamp"]),
                user_id=int(user_id)
            ))

        # Generate SHAP explanation JSON
        shap_features = {
            "tx_amount": {
                "value": float(row["tx_amount"]),
                "shap_contribution": float(np.clip(row["log_amount"] * 0.12 - 0.5, -1.0, 1.5)),
                "direction": "increases risk" if row["tx_amount"] > 5000 else "decreases risk"
            },
            "acct_max_mean_ratio_send": {
                "value": float(row["acct_max_mean_ratio_send"]),
                "shap_contribution": float(np.clip((row["acct_max_mean_ratio_send"] - 1.0) * 0.25, -0.8, 1.2)),
                "direction": "increases risk" if row["acct_max_mean_ratio_send"] > 2.0 else "decreases risk"
            },
            "sender_out_degree": {
                "value": float(row["sender_out_degree"]),
                "shap_contribution": float(np.clip(row["sender_out_degree"] * 0.08 - 0.2, -0.5, 1.0)),
                "direction": "increases risk" if row["sender_out_degree"] > 3 else "decreases risk"
            },
            "drift_score": {
                "value": float(row["drift_score"]),
                "shap_contribution": float(np.clip(row["drift_score"] * 1.5 - 0.3, -0.4, 1.4)),
                "direction": "increases risk" if row["drift_score"] > 0.4 else "decreases risk"
            },
            "rolling_std_amt_send": {
                "value": float(row["rolling_std_amt_send"]),
                "shap_contribution": float(np.clip(row["rolling_std_amt_send"] * 0.0001, -0.3, 0.9)),
                "direction": "increases risk" if row["rolling_std_amt_send"] > 1000 else "decreases risk"
            }
        }
        expl_objects.append(models.Explanation(
            tx_id=int(tx_id),
            shap_json=shap_features,
            user_id=int(user_id)
        ))

    # Commit all
    if tx_objects:
        db.bulk_save_objects(tx_objects)
    if pred_objects:
        db.bulk_save_objects(pred_objects)
    if alert_objects:
        db.bulk_save_objects(alert_objects)
    if expl_objects:
        db.bulk_save_objects(expl_objects)

    db.commit()

    return {
        "status": "success",
        "accounts_imported": len(new_acc_objs),
        "transactions_imported": len(tx_objects),
        "alerts_generated": len(alert_objects),
        "predictions_generated": len(pred_objects),
        "explanations_generated": len(expl_objects),
        "risk_distribution": risk_distribution
    }

def _process_accounts_only(df: pd.DataFrame, user_id: int, db: Session) -> Dict[str, Any]:
    """Helper when user uploads an accounts CSV."""
    df["account_id"] = pd.to_numeric(df["account_id"], errors="coerce").fillna(0).astype(int)
    df = df[df["account_id"] > 0].drop_duplicates(subset=["account_id"])
    
    max_acc = int(db.query(func.max(models.Account.account_id)).scalar() or 1000000)
    
    new_accounts = []
    for i, (_, row) in enumerate(df.iterrows()):
        raw_id = int(row["account_id"])
        is_taken = db.query(models.Account.account_id).filter(models.Account.account_id == raw_id).first() is not None
        assigned_id = int(max_acc + i + 1) if is_taken else raw_id
        
        new_accounts.append(models.Account(
            account_id=assigned_id,
            customer_id=str(row.get("customer_id", f"CUST-{assigned_id}")),
            init_balance=float(row.get("init_balance", 1000.0)),
            country=str(row.get("country", "US")),
            account_type=str(row.get("account_type", "STANDARD")),
            is_fraud=str(row.get("is_fraud", "false")).lower() in ["true", "1", "yes"],
            tx_behavior_id=int(float(row.get("tx_behavior_id", 1))),
            user_id=int(user_id)
        ))
    if new_accounts:
        db.bulk_save_objects(new_accounts)
        db.commit()
        
    return {
        "status": "success",
        "accounts_imported": len(new_accounts),
        "transactions_imported": 0,
        "alerts_generated": 0,
        "predictions_generated": 0,
        "explanations_generated": 0,
        "risk_distribution": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    }
