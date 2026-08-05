from beanie import PydanticObjectId
from app.repositories.portfolio_repository import portfolio_repo
from app.repositories.transaction_repository import transaction_repo
from app.utils.exceptions import BadRequestException
from typing import Dict, Any

class WalletService:
    async def get_wallet_summary(self, user_id: PydanticObjectId) -> Dict[str, Any]:
        """
        Returns cash balance and linked bank statistics.
        """
        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)
        
        return {
            "user_id": str(user_id),
            "cash_balance": portfolio.cash_balance,
            "linked_bank": portfolio.linked_bank
        }

    async def deposit_funds(self, user_id: PydanticObjectId, amount: float) -> Dict[str, Any]:
        """
        Deposits simulated cash funds to user's wallet.
        """
        if amount <= 0:
            raise BadRequestException("Deposit amount must be greater than zero.")

        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        portfolio.cash_balance += amount
        await portfolio_repo.save(portfolio)

        # Log cash transaction
        transaction = await transaction_repo.create_transaction(
            user_id=user_id,
            coin_id=None,
            type="DEPOSIT",
            quantity=0.0,
            price=0.0,
            total=amount
        )

        return {
            "status": "success",
            "message": f"Successfully deposited ${amount:,.2f} virtual funds.",
            "transaction_id": str(transaction.id),
            "cash_balance": portfolio.cash_balance
        }

    async def withdraw_funds(self, user_id: PydanticObjectId, amount: float) -> Dict[str, Any]:
        """
        Withdraws simulated cash funds from user's wallet.
        """
        if amount <= 0:
            raise BadRequestException("Withdrawal amount must be greater than zero.")

        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        if portfolio.cash_balance < amount:
            raise BadRequestException(
                f"Insufficient virtual cash balance for withdrawal. Requires ${amount:,.2f}, "
                f"but has ${portfolio.cash_balance:,.2f}."
            )

        portfolio.cash_balance -= amount
        await portfolio_repo.save(portfolio)

        # Log cash transaction
        transaction = await transaction_repo.create_transaction(
            user_id=user_id,
            coin_id=None,
            type="WITHDRAW",
            quantity=0.0,
            price=0.0,
            total=amount
        )

        return {
            "status": "success",
            "message": f"Successfully withdrew ${amount:,.2f} virtual funds.",
            "transaction_id": str(transaction.id),
            "cash_balance": portfolio.cash_balance
        }

    async def link_bank(
        self, user_id: PydanticObjectId, bank_name: str, account_holder_name: str, account_number: str, routing_code: str
    ) -> Dict[str, Any]:
        """
        Links a simulated bank account to the user's virtual portfolio.
        """
        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        if not bank_name or not account_holder_name or not account_number or not routing_code:
            raise BadRequestException("All bank fields (Bank Name, Holder Name, Account Number, Routing Code) are required.")

        if len(account_number) < 8:
            raise BadRequestException("Account number must be at least 8 digits.")
        if len(routing_code) < 6:
            raise BadRequestException("Routing Code (SWIFT/IFSC) must be at least 6 characters.")

        from app.models.portfolio import LinkedBank
        account_last4 = account_number[-4:]

        portfolio.linked_bank = LinkedBank(
            bank_name=bank_name,
            account_holder_name=account_holder_name,
            account_number=account_number,
            routing_code=routing_code.upper(),
            account_last4=account_last4
        )
        await portfolio_repo.save(portfolio)

        return {
            "status": "success",
            "message": f"Successfully linked your {bank_name} account.",
            "linked_bank": portfolio.linked_bank
        }

    async def unlink_bank(self, user_id: PydanticObjectId) -> Dict[str, Any]:
        """
        Unlinks the bank account.
        """
        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        portfolio.linked_bank = None
        await portfolio_repo.save(portfolio)

        return {
            "status": "success",
            "message": "Successfully unlinked bank account."
        }

wallet_service = WalletService()
