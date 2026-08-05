from fastapi import APIRouter, Depends
from app.schemas.wallet import WalletSummaryResponse, FundRequest, FundActionResponse, LinkBankRequest
from app.core.security import get_current_user
from app.models.user import User
from app.services.wallet_service import wallet_service

router = APIRouter(prefix="/wallet", tags=["Wallet"])

@router.get("", response_model=WalletSummaryResponse)
async def get_wallet(current_user: User = Depends(get_current_user)):
    """
    Returns virtual cash balance summary.
    """
    return await wallet_service.get_wallet_summary(current_user.id)

@router.post("/deposit", response_model=FundActionResponse)
async def deposit_funds(
    payload: FundRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Simulates depositing virtual fiat cash into the portfolio wallet.
    """
    return await wallet_service.deposit_funds(current_user.id, payload.amount)

@router.post("/withdraw", response_model=FundActionResponse)
async def withdraw_funds(
    payload: FundRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Simulates withdrawing virtual fiat cash out of the portfolio wallet.
    """
    return await wallet_service.withdraw_funds(current_user.id, payload.amount)

@router.post("/link-bank")
async def link_bank(
    payload: LinkBankRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Connects/links a simulated bank account.
    """
    return await wallet_service.link_bank(
        user_id=current_user.id, 
        bank_name=payload.bank_name, 
        account_holder_name=payload.account_holder_name,
        account_number=payload.account_number,
        routing_code=payload.routing_code
    )

@router.post("/unlink-bank")
async def unlink_bank(
    current_user: User = Depends(get_current_user)
):
    """
    Disconnects/unlinks the bank account.
    """
    return await wallet_service.unlink_bank(current_user.id)

