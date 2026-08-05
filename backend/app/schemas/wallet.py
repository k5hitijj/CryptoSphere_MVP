from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from typing import Optional
from datetime import datetime

class FundRequest(BaseModel):
    amount: float = Field(..., description="Amount of virtual cash to deposit or withdraw")

class LinkedBankSchema(BaseModel):
    bank_name: str
    account_holder_name: str
    routing_code: str
    account_last4: str
    is_linked: bool
    linked_at: datetime

class WalletSummaryResponse(BaseModel):
    user_id: PydanticObjectId
    cash_balance: float
    linked_bank: Optional[LinkedBankSchema] = None

class FundActionResponse(BaseModel):
    status: str
    message: str
    transaction_id: str
    cash_balance: float

class LinkBankRequest(BaseModel):
    bank_name: str
    account_holder_name: str
    account_number: str
    routing_code: str
