from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: Optional[int] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class AccountBase(BaseModel):
    account_id: int
    customer_id: str
    init_balance: float
    country: str
    account_type: str
    is_fraud: bool
    tx_behavior_id: int

class AccountResponse(AccountBase):
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    tx_id: int
    sender_account_id: int
    receiver_account_id: int
    tx_type: str
    tx_amount: float
    timestamp: int
    is_fraud: bool
    alert_id: Optional[int] = None

class TransactionResponse(TransactionBase):
    class Config:
        from_attributes = True

class MLPredictionResponse(BaseModel):
    tx_id: int
    ml_score: float
    drift_score: float
    composite_score: float
    risk_band: str

    class Config:
        from_attributes = True

class ExplanationResponse(BaseModel):
    tx_id: int
    shap_json: Dict[str, Any]

    class Config:
        from_attributes = True

class PipelineUploadSummary(BaseModel):
    status: str
    accounts_imported: int
    transactions_imported: int
    alerts_generated: int
    predictions_generated: int
    explanations_generated: int
    risk_distribution: Dict[str, int]
