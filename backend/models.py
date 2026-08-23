from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Compliance Analyst")
    created_at = Column(Integer)

class Account(Base):
    __tablename__ = 'accounts'
    account_id = Column(Integer, primary_key=True, autoincrement=False)
    customer_id = Column(String)
    init_balance = Column(Float)
    country = Column(String)
    account_type = Column(String)
    is_fraud = Column(Boolean)
    tx_behavior_id = Column(Integer)
    user_id = Column(Integer, nullable=True, index=True)

class Transaction(Base):
    __tablename__ = 'transactions'
    tx_id = Column(Integer, primary_key=True, autoincrement=False)
    sender_account_id = Column(Integer, ForeignKey('accounts.account_id'))
    receiver_account_id = Column(Integer, ForeignKey('accounts.account_id'))
    tx_type = Column(String)
    tx_amount = Column(Float)
    timestamp = Column(Integer)
    is_fraud = Column(Boolean)
    alert_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True, index=True)

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(Integer)
    alert_type = Column(String)
    is_fraud = Column(Boolean)
    tx_id = Column(Integer, ForeignKey('transactions.tx_id'))
    sender_account_id = Column(Integer, ForeignKey('accounts.account_id'))
    receiver_account_id = Column(Integer, ForeignKey('accounts.account_id'))
    tx_type = Column(String)
    tx_amount = Column(Float)
    timestamp = Column(Integer)
    user_id = Column(Integer, nullable=True, index=True)

class MLPrediction(Base):
    __tablename__ = 'ml_predictions'
    tx_id = Column(Integer, ForeignKey('transactions.tx_id'), primary_key=True)
    log_amount = Column(Float)
    is_large_txn = Column(Integer)
    payment_format_enc = Column(Integer)
    rolling_mean_amt_send = Column(Float)
    rolling_std_amt_send = Column(Float)
    rolling_txn_count_send = Column(Float)
    acct_total_txns_send = Column(Integer)
    acct_avg_amount_send = Column(Float)
    acct_max_amount_send = Column(Float)
    acct_max_mean_ratio_send = Column(Float)
    rolling_mean_amt_recv = Column(Float)
    rolling_std_amt_recv = Column(Float)
    acct_total_txns_recv = Column(Integer)
    sender_out_degree = Column(Integer)
    sender_in_degree = Column(Integer)
    receiver_in_degree = Column(Integer)
    receiver_out_degree = Column(Integer)
    sender_total_degree = Column(Integer)
    receiver_total_degree = Column(Integer)
    sender_pagerank = Column(Float)
    receiver_pagerank = Column(Float)
    drift_score = Column(Float)
    ml_score = Column(Float)
    composite_score = Column(Float)
    risk_band = Column(String)
    user_id = Column(Integer, nullable=True, index=True)

class Explanation(Base):
    __tablename__ = 'explanations'
    tx_id = Column(Integer, ForeignKey('transactions.tx_id'), primary_key=True)
    shap_json = Column(JSON)
    user_id = Column(Integer, nullable=True, index=True)

class Investigation(Base):
    __tablename__ = 'investigations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    target_id = Column(String)  # account_id or tx_id
    target_type = Column(String) # 'account' or 'transaction'
    status = Column(String, default="OPEN")
    notes = Column(String, nullable=True)
    decision = Column(String, nullable=True)
    created_at = Column(Integer)
    updated_at = Column(Integer)
    user_id = Column(Integer, nullable=True, index=True)

class AuditEvent(Base):
    __tablename__ = 'audit_events'
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(Integer)
    user_id = Column(String)
    role = Column(String)
    action = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    previous_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    owner_id = Column(Integer, nullable=True, index=True)

class Watchlist(Base):
    __tablename__ = 'watchlist'
    account_id = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)
    added_at = Column(Integer)
    added_by = Column(String)
    reason = Column(String)
    user_id = Column(Integer, nullable=True, index=True)
