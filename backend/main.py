from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, text, String
from fastapi.middleware.cors import CORSMiddleware
import os
import io
import csv
import json
import time
import pandas as pd
from typing import Optional, List

import models
import schemas
import schemas_ext
import auth
from database import engine, get_db
import pipeline_runner

# Ensure schema migrations run without dropping any existing table/data
def ensure_schema():
    models.Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for tbl in ["accounts", "transactions", "alerts", "ml_predictions", "explanations", "investigations", "watchlist"]:
            try:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS user_id INTEGER;"))
            except Exception:
                pass
        try:
            conn.execute(text("ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS owner_id INTEGER;"))
        except Exception:
            pass

ensure_schema()

app = FastAPI(title="AegisAML API", version="2.0.0")

allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
frontend_url_env = os.environ.get("FRONTEND_URL", "")
cors_origins = ["*"]
if allowed_origins_env:
    cors_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
elif frontend_url_env:
    cors_origins = [frontend_url_env.strip(), "http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX", None),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed demo user on startup if not present
def seed_demo_user():
    db = next(get_db())
    try:
        demo = db.query(models.User).filter(models.User.email == "analyst@aegisaml.corp").first()
        if not demo:
            demo_user = models.User(
                name="Compliance Analyst",
                email="analyst@aegisaml.corp",
                password_hash=auth.hash_password("password123"),
                role="Senior AML Compliance Officer",
                created_at=int(time.time())
            )
            db.add(demo_user)
            db.commit()
    except Exception as e:
        print("Demo user seed note:", e)
    finally:
        db.close()

seed_demo_user()

# Helper for workspace filtering
def get_user_filter(model_class, user: Optional[models.User]):
    """
    If user is authenticated and not the global demo analyst, filter by their user_id.
    If user is demo analyst or anonymous, return global dataset filter (user_id is None or user_id == user.id).
    """
    if user is None:
        return or_(model_class.user_id == None, True)
    if user.email == "analyst@aegisaml.corp":
        return or_(model_class.user_id == None, model_class.user_id == user.id)
    return model_class.user_id == user.id


def log_audit(db: Session, user_str: str, action: str, entity_type: str, entity_id: str, prev: str = None, new: str = None, owner_id: int = None):
    try:
        audit = models.AuditEvent(
            timestamp=int(time.time()),
            user_id=user_str,
            role="COMPLIANCE_ANALYST",
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            previous_value=prev,
            new_value=new,
            owner_id=owner_id
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print("Audit log exception:", e)

# ══════════════════════════════════════════════════════════════════════════════
# AUTHENTICATION ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/signup", response_model=schemas.AuthResponse)
def signup(req: schemas.UserSignup, db: Session = Depends(get_db)):
    # Validate
    email_clean = req.email.strip().lower()
    name_clean = req.name.strip()
    if not email_clean or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    
    existing = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    user = models.User(
        name=name_clean if name_clean else "Analyst",
        email=email_clean,
        password_hash=auth.hash_password(req.password),
        role="Compliance Analyst",
        created_at=int(time.time())
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, user.email, "USER_SIGNUP", "user", str(user.id), None, user.name, owner_id=user.id)
    token = auth.create_access_token({"sub": user.id, "email": user.email, "name": user.name})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(req: schemas.UserLogin, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    # Auto-allow demo analyst if matching demo password
    if email_clean == "analyst@aegisaml.corp" and (not user or not auth.verify_password(req.password, user.password_hash)):
        if not user:
            user = models.User(
                name="Compliance Analyst",
                email="analyst@aegisaml.corp",
                password_hash=auth.hash_password("password123"),
                role="Senior AML Compliance Officer",
                created_at=int(time.time())
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not req.password or req.password in ["", "password123", "••••••••••••"]:
            pass # allow demo access
        elif not auth.verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
    else:
        if not user or not auth.verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = auth.create_access_token({"sub": user.id, "email": user.email, "name": user.name})
    log_audit(db, user.email, "USER_LOGIN", "session", str(user.id), None, "success", owner_id=user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(auth.get_current_user)):
    return user

# ══════════════════════════════════════════════════════════════════════════════
# DATA UPLOAD & PIPELINE PROCESSING
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/upload/stats")
def get_upload_stats(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    """Return record counts filtered for the current user workspace."""
    if user and user.email != "analyst@aegisaml.corp":
        return {
            "accounts": db.query(models.Account).filter(models.Account.user_id == user.id).count(),
            "transactions": db.query(models.Transaction).filter(models.Transaction.user_id == user.id).count(),
            "alerts": db.query(models.Alert).filter(models.Alert.user_id == user.id).count(),
            "ml_predictions": db.query(models.MLPrediction).filter(models.MLPrediction.user_id == user.id).count(),
        }
    return {
        "accounts": db.query(models.Account).count(),
        "transactions": db.query(models.Transaction).count(),
        "alerts": db.query(models.Alert).count(),
        "ml_predictions": db.query(models.MLPrediction).count(),
    }

@app.post("/api/upload/pipeline")
async def upload_and_run_pipeline(
    file: UploadFile = File(...),
    dataset_type: str = Form("transactions"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    """
    Accept CSV file, run full preprocessing, drift detection, ML predictions,
    risk scoring, SHAP explainability, and persist to user's isolated workspace.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    
    target_user_id = user.id if user else 1
    user_name = user.name if user else "Analyst"

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8-sig")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    try:
        summary = pipeline_runner.process_and_run_pipeline(
            df=df,
            user_id=target_user_id,
            db=db,
            dataset_type=dataset_type
        )
        log_audit(
            db, 
            user_name, 
            "RUN_PIPELINE", 
            "dataset", 
            file.filename, 
            None, 
            f"{summary['transactions_imported']} txs, {summary['alerts_generated']} alerts",
            owner_id=target_user_id
        )
        return summary
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")

# Legacy direct upload endpoints maintained for backward compatibility
@app.post("/api/upload/transactions")
async def upload_transactions(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    target_user_id = user.id if user else 1
    return await upload_and_run_pipeline(file=file, dataset_type="transactions", db=db, user=user)

@app.post("/api/upload/accounts")
async def upload_accounts(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    target_user_id = user.id if user else 1
    return await upload_and_run_pipeline(file=file, dataset_type="accounts", db=db, user=user)

# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD & CORE ENTITY APIS (Multi-Tenant Workspace Aware)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "ok", "app": "AegisAML Vigilance System"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    acc_count = db.query(models.Account).count()
    return {"status": "healthy", "database": "connected", "total_accounts": acc_count}

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    if user and user.email != "analyst@aegisaml.corp":
        # Check if user has uploaded data
        user_tx_count = db.query(models.Transaction).filter(models.Transaction.user_id == user.id).count()
        if user_tx_count > 0:
            total_accounts = db.query(models.Account).filter(models.Account.user_id == user.id).count()
            fraud_tx = db.query(models.Transaction).filter(
                models.Transaction.user_id == user.id, 
                models.Transaction.is_fraud == True
            ).count()
            total_alerts = db.query(models.Alert).filter(models.Alert.user_id == user.id).count()
            
            risk_dist = db.query(
                models.MLPrediction.risk_band, 
                func.count(models.MLPrediction.tx_id)
            ).filter(models.MLPrediction.user_id == user.id).group_by(models.MLPrediction.risk_band).all()
            
            return {
                "total_accounts": total_accounts,
                "total_transactions": user_tx_count,
                "fraud_transactions": fraud_tx,
                "active_alerts": total_alerts,
                "risk_distribution": [{"name": r[0] if r[0] else 'UNKNOWN', "value": r[1]} for r in risk_dist]
            }
        else:
            # Brand new user with no data uploaded yet
            return {
                "total_accounts": 0,
                "total_transactions": 0,
                "fraud_transactions": 0,
                "active_alerts": 0,
                "risk_distribution": []
            }

    # Demo Analyst / Default Global Workspace
    total_accounts = db.query(models.Account).count()
    total_tx = db.query(models.Transaction).count()
    fraud_tx = db.query(models.Transaction).filter(models.Transaction.is_fraud == True).count()
    total_alerts = db.query(models.Alert).count()
    
    risk_dist = db.query(
        models.MLPrediction.risk_band, 
        func.count(models.MLPrediction.tx_id)
    ).group_by(models.MLPrediction.risk_band).all()
    
    return {
        "total_accounts": total_accounts,
        "total_transactions": total_tx,
        "fraud_transactions": fraud_tx,
        "active_alerts": total_alerts,
        "risk_distribution": [{"name": r[0] if r[0] else 'UNKNOWN', "value": r[1]} for r in risk_dist]
    }

@app.get("/api/transactions")
def get_transactions(
    skip: int = 0, 
    limit: int = 50, 
    is_fraud: bool = Query(None),
    risk_band: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(
        models.Transaction,
        models.MLPrediction
    ).outerjoin(
        models.MLPrediction, models.Transaction.tx_id == models.MLPrediction.tx_id
    )

    if user and user.email != "analyst@aegisaml.corp":
        user_has_txs = db.query(models.Transaction).filter(models.Transaction.user_id == user.id).first()
        if user_has_txs:
            query = query.filter(models.Transaction.user_id == user.id)
        else:
            return {"total": 0, "items": []}

    if is_fraud is not None:
        query = query.filter(models.Transaction.is_fraud == is_fraud)
    
    if risk_band and risk_band.upper() != 'ALL':
        query = query.filter(models.MLPrediction.risk_band == risk_band.upper())

    if search:
        search_term = search.strip()
        if search_term.isdigit():
            val = int(search_term)
            query = query.filter(
                (models.Transaction.tx_id == val) |
                (models.Transaction.sender_account_id == val) |
                (models.Transaction.receiver_account_id == val)
            )
        else:
            query = query.filter(
                models.Transaction.tx_type.ilike(f"%{search_term}%")
            )
        
    total = query.count()
    results = query.order_by(desc(models.Transaction.timestamp)).offset(skip).limit(limit).all()
    
    items = []
    for tx, ml in results:
        item = {
            "tx_id": tx.tx_id,
            "sender_account_id": tx.sender_account_id,
            "receiver_account_id": tx.receiver_account_id,
            "tx_type": tx.tx_type,
            "tx_amount": tx.tx_amount,
            "timestamp": tx.timestamp,
            "is_fraud": tx.is_fraud,
            "alert_id": tx.alert_id,
            "ml_score": ml.ml_score if ml else None,
            "drift_score": ml.drift_score if ml else None,
            "composite_score": ml.composite_score if ml else None,
            "risk_band": ml.risk_band if ml else None
        }
        items.append(item)
        
    return {"total": total, "items": items}

@app.get("/api/transactions/{tx_id}")
def get_transaction_detail(
    tx_id: int, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    tx = db.query(models.Transaction).filter(models.Transaction.tx_id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    ml = db.query(models.MLPrediction).filter(models.MLPrediction.tx_id == tx_id).first()
    expl = db.query(models.Explanation).filter(models.Explanation.tx_id == tx_id).first()
    
    return {
        "transaction": tx,
        "ml_prediction": ml,
        "explanation": expl.shap_json if expl else None
    }

@app.get("/api/accounts")
def get_accounts(
    skip: int = 0,
    limit: int = 50,
    search: str = Query(None),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(models.Account)
    
    if user and user.email != "analyst@aegisaml.corp":
        user_has_accs = db.query(models.Account).filter(models.Account.user_id == user.id).first()
        if user_has_accs:
            query = query.filter(models.Account.user_id == user.id)
        else:
            return {"total": 0, "items": []}

    if search:
        search_term = search.strip()
        if search_term.isdigit():
            val = int(search_term)
            query = query.filter(
                (models.Account.account_id == val) |
                (models.Account.customer_id.ilike(f"%{search_term}%"))
            )
        else:
            query = query.filter(
                (models.Account.customer_id.ilike(f"%{search_term}%")) |
                (models.Account.country.ilike(f"%{search_term}%")) |
                (models.Account.account_type.ilike(f"%{search_term}%"))
            )
    total = query.count()
    accounts = query.offset(skip).limit(limit).all()
    return {"total": total, "items": accounts}

@app.get("/api/accounts/{account_id}")
def get_account_detail(
    account_id: int, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    account = db.query(models.Account).filter(models.Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    recent_txs = db.query(models.Transaction).filter(
        (models.Transaction.sender_account_id == account_id) | 
        (models.Transaction.receiver_account_id == account_id)
    ).order_by(desc(models.Transaction.timestamp)).limit(15).all()
    
    tx_ids = [tx.tx_id for tx in recent_txs]
    ml_preds = db.query(models.MLPrediction).filter(models.MLPrediction.tx_id.in_(tx_ids)).all()
    ml_map = {m.tx_id: m for m in ml_preds}
    
    tx_history = []
    for tx in recent_txs:
        ml = ml_map.get(tx.tx_id)
        tx_history.append({
            "tx_id": tx.tx_id,
            "type": tx.tx_type,
            "amount": tx.tx_amount,
            "timestamp": tx.timestamp,
            "is_fraud": tx.is_fraud,
            "risk_band": ml.risk_band if ml else None,
            "composite_score": ml.composite_score if ml else None
        })
        
    return {
        "account": account,
        "recent_transactions": tx_history
    }

@app.get("/api/alerts")
def get_alerts(
    skip: int = 0,
    limit: int = 50,
    search: str = Query(None),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(models.Alert, models.Transaction).outerjoin(
        models.Transaction, models.Alert.tx_id == models.Transaction.tx_id
    )

    if user and user.email != "analyst@aegisaml.corp":
        user_has_alerts = db.query(models.Alert).filter(models.Alert.user_id == user.id).first()
        if user_has_alerts:
            query = query.filter(models.Alert.user_id == user.id)
        else:
            return {"total": 0, "items": []}

    if search:
        search_term = search.strip()
        if search_term.isdigit():
            val = int(search_term)
            query = query.filter(
                (models.Alert.alert_id == val) |
                (models.Alert.tx_id == val) |
                (models.Alert.sender_account_id == val) |
                (models.Alert.receiver_account_id == val)
            )
        else:
            query = query.filter(
                models.Alert.alert_type.ilike(f"%{search_term}%")
            )
            
    total = query.count()
    results = query.order_by(desc(models.Alert.id)).offset(skip).limit(limit).all()
    
    items = []
    for alert, tx in results:
        items.append({
            "alert_id": alert.alert_id,
            "alert_type": alert.alert_type,
            "tx_id": alert.tx_id,
            "sender_account_id": alert.sender_account_id,
            "receiver_account_id": alert.receiver_account_id,
            "tx_type": alert.tx_type or (tx.tx_type if tx else "TRANSFER"),
            "amount": alert.tx_amount or (tx.tx_amount if tx else 0),
            "timestamp": alert.timestamp,
            "is_fraud": alert.is_fraud
        })
        
    return {"total": total, "items": items}

@app.get("/api/watchlist")
def get_watchlist(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(
        models.MLPrediction.tx_id, 
        models.MLPrediction.risk_band,
        models.MLPrediction.composite_score,
        models.Transaction.sender_account_id,
    ).join(
        models.Transaction, models.MLPrediction.tx_id == models.Transaction.tx_id
    ).filter(
        models.MLPrediction.risk_band == 'CRITICAL'
    )
    
    if user and user.email != "analyst@aegisaml.corp":
        user_has_preds = db.query(models.MLPrediction).filter(models.MLPrediction.user_id == user.id).first()
        if user_has_preds:
            query = query.filter(models.MLPrediction.user_id == user.id)
        else:
            return {"items": []}

    results = query.limit(50).all()
    
    items = []
    seen = set()
    for r in results:
        if r.sender_account_id not in seen:
            seen.add(r.sender_account_id)
            items.append({
                "account_id": r.sender_account_id,
                "risk_band": r.risk_band,
                "composite_score": r.composite_score,
                "reason": "Critical risk velocity and ML anomaly detected"
            })
        
    return {"items": items}

@app.post("/api/watchlist")
def add_to_watchlist(
    item: schemas_ext.WatchlistAdd, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    target_user_id = user.id if user else None
    existing = db.query(models.Watchlist).filter(models.Watchlist.account_id == item.account_id).first()
    if existing:
        return existing
    
    new_wl = models.Watchlist(
        account_id=item.account_id,
        reason=item.reason,
        added_at=int(time.time()),
        added_by=user.name if user else "Compliance Analyst",
        user_id=target_user_id
    )
    db.add(new_wl)
    db.commit()
    log_audit(db, user.name if user else "Analyst", "ADD_WATCHLIST", "account", str(item.account_id), owner_id=target_user_id)
    return {"status": "added", "account_id": item.account_id}

@app.get("/api/network/{account_id}")
def get_network(
    account_id: int, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    tx_query1 = db.query(models.Transaction).filter(
        (models.Transaction.sender_account_id == account_id) |
        (models.Transaction.receiver_account_id == account_id)
    ).order_by(desc(models.Transaction.timestamp)).limit(50).all()
    
    nodes = set()
    edges = []
    
    for tx in tx_query1:
        nodes.add(tx.sender_account_id)
        nodes.add(tx.receiver_account_id)
        edges.append({
            "id": f"tx-{tx.tx_id}",
            "source": str(tx.sender_account_id),
            "target": str(tx.receiver_account_id),
            "amount": tx.tx_amount,
            "type": tx.tx_type,
            "fraud": tx.is_fraud
        })
        
    if not nodes and account_id:
        # Check if account exists
        acc = db.query(models.Account).filter(models.Account.account_id == account_id).first()
        if acc:
            nodes.add(account_id)

    rf_nodes = [
        {
            "id": str(n), 
            "position": {"x": 0, "y": 0}, 
            "data": {"label": f"ACC-{n}", "isCentral": n == account_id}
        } 
        for n in nodes
    ]
    
    return {
        "nodes": rf_nodes,
        "edges": edges
    }

@app.get("/api/drift/{account_id}")
def get_drift(
    account_id: int, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    account = db.query(models.Account).filter(models.Account.account_id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found")

    txs = db.query(models.Transaction, models.MLPrediction).outerjoin(
        models.MLPrediction, models.Transaction.tx_id == models.MLPrediction.tx_id
    ).filter(models.Transaction.sender_account_id == account_id).order_by(models.Transaction.timestamp).all()
    
    history = []
    for tx, ml in txs:
        if ml and ml.drift_score is not None:
            history.append({
                "timestamp": tx.timestamp,
                "score": ml.drift_score
            })
            
    latest_score = history[-1]['score'] if history else 0.0
    return {
        "account_id": account_id,
        "current_drift": latest_score,
        "history": history,
        "detectors": {
            "page_hinkley": latest_score > 0.4,
            "cusum": latest_score > 0.5,
            "ks_test": latest_score > 0.65,
            "z_score": latest_score > 0.75
        }
    }

@app.get("/api/explainability")
def get_explainability_list(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(models.Explanation, models.Transaction, models.MLPrediction).join(
        models.Transaction, models.Explanation.tx_id == models.Transaction.tx_id
    ).outerjoin(
        models.MLPrediction, models.Transaction.tx_id == models.MLPrediction.tx_id
    )

    if user and user.email != "analyst@aegisaml.corp":
        user_has_expl = db.query(models.Explanation).filter(models.Explanation.user_id == user.id).first()
        if user_has_expl:
            query = query.filter(models.Explanation.user_id == user.id)
        else:
            return {"items": []}

    results = query.limit(50).all()
    
    items = []
    for expl, tx, ml in results:
        items.append({
            "tx_id": tx.tx_id,
            "sender_account_id": tx.sender_account_id,
            "receiver_account_id": tx.receiver_account_id,
            "tx_amount": tx.tx_amount,
            "timestamp": tx.timestamp,
            "is_fraud": tx.is_fraud,
            "ml_score": ml.ml_score if ml else None,
            "drift_score": ml.drift_score if ml else None,
            "composite_score": ml.composite_score if ml else None,
            "risk_band": ml.risk_band if ml else None,
            "has_shap": True
        })
    return {"items": items}

@app.get("/api/explainability/{tx_id}")
def get_explainability_detail(
    tx_id: int, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    tx = db.query(models.Transaction).filter(models.Transaction.tx_id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {tx_id} not found")
    ml = db.query(models.MLPrediction).filter(models.MLPrediction.tx_id == tx_id).first()
    expl = db.query(models.Explanation).filter(models.Explanation.tx_id == tx_id).first()
    
    # If no explanation exists yet, synthesize SHAP from ML prediction/transaction parameters
    shap_data = expl.shap_json if expl else None
    if not shap_data:
        amt = tx.tx_amount or 0.0
        shap_data = {
            "tx_amount": {
                "value": amt,
                "shap_contribution": 0.85 if amt > 10000 else -0.32,
                "direction": "increases risk" if amt > 10000 else "decreases risk"
            },
            "acct_max_mean_ratio_send": {
                "value": 4.2 if amt > 10000 else 1.1,
                "shap_contribution": 0.45 if amt > 10000 else -0.15,
                "direction": "increases risk" if amt > 10000 else "decreases risk"
            },
            "drift_score": {
                "value": ml.drift_score if ml else 0.0,
                "shap_contribution": (ml.drift_score * 0.8) if ml and ml.drift_score else -0.1,
                "direction": "increases risk" if ml and ml.drift_score and ml.drift_score > 0.4 else "decreases risk"
            }
        }
        
    return {
        "transaction": tx,
        "ml_prediction": ml,
        "explanation": shap_data
    }

@app.get("/api/investigations")
def get_investigations(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(models.Investigation)
    if user and user.email != "analyst@aegisaml.corp":
        query = query.filter(models.Investigation.user_id == user.id)
    investigations = query.order_by(desc(models.Investigation.id)).all()
    return {"items": investigations}

@app.post("/api/investigations")
def create_investigation(
    inv: schemas_ext.InvestigationCreate, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    target_user_id = user.id if user else None
    new_inv = models.Investigation(
        target_id=str(inv.target_id),
        target_type=str(inv.target_type),
        status="OPEN",
        created_at=int(time.time()),
        updated_at=int(time.time()),
        user_id=target_user_id
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    log_audit(db, user.name if user else "Analyst", "CREATE_INVESTIGATION", "investigation", str(new_inv.id), owner_id=target_user_id)
    return {
        "id": new_inv.id,
        "target_id": new_inv.target_id,
        "target_type": new_inv.target_type,
        "status": new_inv.status,
        "created_at": new_inv.created_at,
        "notes": new_inv.notes,
        "decision": new_inv.decision
    }

@app.get("/api/investigations/{id}")
def get_investigation(id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Investigation).filter(models.Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    return inv

@app.patch("/api/investigations/{id}")
def update_investigation(
    id: int, 
    update: schemas_ext.InvestigationUpdate, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    inv = db.query(models.Investigation).filter(models.Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation case not found")
    
    user_name = user.name if user else "Compliance Analyst"
    if update.status:
        log_audit(db, user_name, "UPDATE_STATUS", "investigation", str(id), inv.status, update.status, owner_id=user.id if user else None)
        inv.status = update.status
    if update.notes is not None:
        log_audit(db, user_name, "ADD_NOTE", "investigation", str(id), owner_id=user.id if user else None)
        inv.notes = update.notes
    if update.decision is not None:
        log_audit(db, user_name, "MAKE_DECISION", "investigation", str(id), inv.decision, update.decision, owner_id=user.id if user else None)
        inv.decision = update.decision
        
    inv.updated_at = int(time.time())
    db.commit()
    db.refresh(inv)
    return inv

@app.get("/api/audit")
def get_audit_log(
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    query = db.query(models.AuditEvent)
    if user and user.email != "analyst@aegisaml.corp":
        query = query.filter(models.AuditEvent.owner_id == user.id)
    logs = query.order_by(desc(models.AuditEvent.timestamp)).limit(100).all()
    return {"items": logs}

@app.get("/api/search")
def global_search(
    q: str, 
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    results = {
        "accounts": [],
        "transactions": [],
        "alerts": []
    }
    
    if not q or len(q.strip()) < 1:
        return results
        
    q_str = q.strip()
    
    # Search accounts
    acc_q = db.query(models.Account)
    if user and user.email != "analyst@aegisaml.corp":
        acc_q = acc_q.filter(models.Account.user_id == user.id)
    accs = acc_q.filter(
        (models.Account.account_id.cast(String).like(f"%{q_str}%")) |
        (models.Account.customer_id.ilike(f"%{q_str}%"))
    ).limit(5).all()
    
    for a in accs:
        results["accounts"].append({"id": str(a.account_id), "title": f"Account {a.account_id}", "subtitle": a.customer_id, "url": f"/accounts/{a.account_id}"})
        
    # Search transactions
    tx_q = db.query(models.Transaction)
    if user and user.email != "analyst@aegisaml.corp":
        tx_q = tx_q.filter(models.Transaction.user_id == user.id)
    txs = tx_q.filter(
        (models.Transaction.tx_id.cast(String).like(f"%{q_str}%"))
    ).limit(5).all()
    
    for tx in txs:
        results["transactions"].append({"id": str(tx.tx_id), "title": f"TX {tx.tx_id}", "subtitle": f"${tx.tx_amount:,.2f}", "url": f"/transactions/{tx.tx_id}"})
        
    # Search alerts
    al_q = db.query(models.Alert)
    if user and user.email != "analyst@aegisaml.corp":
        al_q = al_q.filter(models.Alert.user_id == user.id)
    alerts = al_q.filter(
        (models.Alert.alert_id.cast(String).like(f"%{q_str}%")) |
        (models.Alert.alert_type.ilike(f"%{q_str}%"))
    ).limit(5).all()
    
    for al in alerts:
        results["alerts"].append({"id": str(al.alert_id), "title": f"Alert {al.alert_id}", "subtitle": al.alert_type, "url": f"/alerts"})
        
    return results
