from pydantic import BaseModel
from typing import Optional

class InvestigationCreate(BaseModel):
    target_id: str
    target_type: str

class InvestigationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    decision: Optional[str] = None

class WatchlistAdd(BaseModel):
    account_id: int
    reason: str
