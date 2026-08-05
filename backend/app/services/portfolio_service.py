from datetime import datetime, timezone
from typing import Dict, Any, List
from beanie import PydanticObjectId
from app.repositories.portfolio_repository import portfolio_repo
from app.repositories.transaction_repository import transaction_repo
from app.services.market_service import market_service
from app.models.portfolio import PortfolioHolding
from app.utils.exceptions import BadRequestException, NotFoundException
import logging

logger = logging.getLogger("cryptosphere.portfolio_service")

class PortfolioService:
    async def get_portfolio_summary(self, user_id: PydanticObjectId) -> Dict[str, Any]:
        """
        Calculates user's total portfolio valuation, holding assets, average buy prices,
        and current market profits/losses based on live CoinGecko rates.
        """
        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        # Fetch current market rates for supported coins
        live_prices = await market_service.get_supported_coin_prices()

        total_holdings_value = 0.0
        holdings_summary = []
        
        for holding in portfolio.holdings:
            live_price = live_prices.get(holding.coin_id, 0.0)
            if live_price == 0.0:
                # Fallback to average buy price if market service fails completely
                live_price = holding.average_buy_price
                
            current_value = holding.quantity * live_price
            total_holdings_value += current_value
            
            cost_basis = holding.quantity * holding.average_buy_price
            profit_loss = current_value - cost_basis
            profit_loss_pct = (profit_loss / cost_basis * 100.0) if cost_basis > 0 else 0.0
            
            holdings_summary.append({
                "coin_id": holding.coin_id,
                "symbol": holding.symbol,
                "quantity": holding.quantity,
                "average_buy_price": holding.average_buy_price,
                "current_price": live_price,
                "current_value": current_value,
                "cost_basis": cost_basis,
                "profit_loss": profit_loss,
                "profit_loss_percentage": profit_loss_pct,
                "updated_at": holding.updated_at
            })

        total_value = total_holdings_value + portfolio.cash_balance
        
        # Portfolio today's profit loss (simplified: comparison with cost basis or a simple return index)
        total_cost_basis = sum(h["cost_basis"] for h in holdings_summary)
        total_profit_loss = total_holdings_value - total_cost_basis
        total_profit_loss_percentage = (total_profit_loss / total_cost_basis * 100.0) if total_cost_basis > 0 else 0.0

        return {
            "user_id": str(user_id),
            "cash_balance": portfolio.cash_balance,
            "total_holdings_value": total_holdings_value,
            "total_portfolio_value": total_value,
            "total_profit_loss": total_profit_loss,
            "total_profit_loss_percentage": total_profit_loss_percentage,
            "holdings": holdings_summary
        }

    async def buy_asset(self, user_id: PydanticObjectId, coin_id: str, quantity: float) -> Dict[str, Any]:
        """
        Simulates purchasing a coin. Checks cash, deducts balance, updates holding cost basis,
        logs transaction.
        """
        if quantity <= 0:
            raise BadRequestException("Quantity must be greater than zero.")

        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        # Get coin details for transaction price validation
        coin_details = await market_service.get_coin_details(coin_id)
        price = coin_details.get("current_price", 0.0)
        
        if price <= 0:
            # Fallback to simple pricing ticker if details fail
            prices = await market_service.get_supported_coin_prices()
            price = prices.get(coin_id, 0.0)

        if price <= 0:
            raise BadRequestException(f"Unable to fetch valid market price for coin {coin_id}.")

        total_cost = quantity * price
        if portfolio.cash_balance < total_cost:
            raise BadRequestException(
                f"Insufficient virtual cash balance. Requires ${total_cost:,.2f}, "
                f"but has ${portfolio.cash_balance:,.2f}."
            )

        # Deduct cash
        portfolio.cash_balance -= total_cost

        # Find existing holding or create one
        holding = next((h for h in portfolio.holdings if h.coin_id == coin_id), None)
        symbol = coin_details.get("symbol", coin_id[:3]).upper()
        
        if holding:
            # Recalculate average buy price
            total_qty = holding.quantity + quantity
            average_price = ((holding.quantity * holding.average_buy_price) + total_cost) / total_qty
            
            holding.quantity = total_qty
            holding.average_buy_price = average_price
            holding.updated_at = datetime.now(timezone.utc)
        else:
            # Add new holding
            holding = PortfolioHolding(
                coin_id=coin_id,
                symbol=symbol.lower(),
                quantity=quantity,
                average_buy_price=price,
                updated_at=datetime.now(timezone.utc)
            )
            portfolio.holdings.append(holding)

        # Commit to DB
        await portfolio_repo.save(portfolio)

        # Log simulated transaction
        transaction = await transaction_repo.create_transaction(
            user_id=user_id,
            coin_id=coin_id,
            type="BUY",
            quantity=quantity,
            price=price,
            total=total_cost
        )

        return {
            "status": "success",
            "message": f"Successfully purchased {quantity} {symbol} at ${price:,.2f}.",
            "transaction_id": str(transaction.id),
            "cash_balance": portfolio.cash_balance,
            "quantity_held": holding.quantity
        }

    async def sell_asset(self, user_id: PydanticObjectId, coin_id: str, quantity: float) -> Dict[str, Any]:
        """
        Simulates selling a coin. Checks holdings, adds cash, updates quantity, logs transaction.
        """
        if quantity <= 0:
            raise BadRequestException("Quantity must be greater than zero.")

        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio or not portfolio.holdings:
            raise BadRequestException("No assets found in your portfolio.")

        # Find holding
        holding = next((h for h in portfolio.holdings if h.coin_id == coin_id), None)
        if not holding or holding.quantity < quantity:
            held_qty = holding.quantity if holding else 0.0
            raise BadRequestException(
                f"Insufficient asset balance. Attempted to sell {quantity}, "
                f"but only hold {held_qty}."
            )

        # Get price
        coin_details = await market_service.get_coin_details(coin_id)
        price = coin_details.get("current_price", 0.0)
        
        if price <= 0:
            prices = await market_service.get_supported_coin_prices()
            price = prices.get(coin_id, 0.0)

        if price <= 0:
            raise BadRequestException(f"Unable to fetch valid market price for coin {coin_id}.")

        total_revenue = quantity * price
        
        # Credit cash
        portfolio.cash_balance += total_revenue

        # Update or remove holding
        remaining_qty = holding.quantity - quantity
        symbol = holding.symbol.upper()
        
        if remaining_qty == 0:
            portfolio.holdings.remove(holding)
        else:
            holding.quantity = remaining_qty
            holding.updated_at = datetime.now(timezone.utc)

        # Commit to DB
        await portfolio_repo.save(portfolio)

        # Log simulated transaction
        transaction = await transaction_repo.create_transaction(
            user_id=user_id,
            coin_id=coin_id,
            type="SELL",
            quantity=quantity,
            price=price,
            total=total_revenue
        )

        return {
            "status": "success",
            "message": f"Successfully sold {quantity} {symbol} at ${price:,.2f}.",
            "transaction_id": str(transaction.id),
            "cash_balance": portfolio.cash_balance,
            "quantity_held": remaining_qty
        }

    async def get_transaction_history(
        self, user_id: PydanticObjectId, limit: int = 50, skip: int = 0
    ) -> Dict[str, Any]:
        """
        Retrieves paginated transactions ledger.
        """
        transactions = await transaction_repo.get_by_user_id(user_id, limit, skip)
        total_count = await transaction_repo.count_by_user_id(user_id)
        
        return {
            "transactions": transactions,
            "total_count": total_count,
            "limit": limit,
            "skip": skip
        }

    async def transfer_assets(
        self, sender_id: PydanticObjectId, recipient_email: str, asset_type: str, amount: float
    ) -> Dict[str, Any]:
        """
        Simulates transferring cash (USD) or crypto assets to another registered user.
        """
        if amount <= 0:
            raise BadRequestException("Transfer amount must be greater than zero.")

        # Import repository locally to avoid circular dependencies
        from app.repositories.user_repository import user_repo

        # 1. Lookup recipient
        recipient = await user_repo.get_by_email(recipient_email)
        if not recipient:
            # Check if whitelisted but not registered
            whitelisted = await user_repo.get_authorised_user(recipient_email)
            if whitelisted:
                raise BadRequestException(
                    f"Recipient '{recipient_email}' is whitelisted but has not signed up "
                    "on CryptoSphere yet. They must log in once to activate their wallet."
                )
            raise NotFoundException(f"Recipient user '{recipient_email}' not found on this platform.")

        if recipient.id == sender_id:
            raise BadRequestException("You cannot transfer assets to yourself.")

        # 2. Fetch portfolios
        sender_portfolio = await portfolio_repo.get_by_user_id(sender_id)
        recipient_portfolio = await portfolio_repo.get_by_user_id(recipient.id)

        if not sender_portfolio:
            sender_portfolio = await portfolio_repo.create_portfolio(sender_id)
        if not recipient_portfolio:
            recipient_portfolio = await portfolio_repo.create_portfolio(recipient.id)

        if asset_type.upper() == "USD":
            # Cash Transfer
            if sender_portfolio.cash_balance < amount:
                raise BadRequestException(
                    f"Insufficient cash balance. Attempted to transfer ${amount:,.2f}, "
                    f"but only have ${sender_portfolio.cash_balance:,.2f}."
                )

            sender_portfolio.cash_balance -= amount
            recipient_portfolio.cash_balance += amount

            # Log transactions
            # For sender
            tx_sender = await transaction_repo.create_transaction(
                user_id=sender_id,
                coin_id=None,
                type="TRANSFER_SENT",
                quantity=amount,
                price=1.0,
                total=amount
            )
            # For recipient
            await transaction_repo.create_transaction(
                user_id=recipient.id,
                coin_id=None,
                type="TRANSFER_RECEIVED",
                quantity=amount,
                price=1.0,
                total=amount
            )

            await portfolio_repo.save(sender_portfolio)
            await portfolio_repo.save(recipient_portfolio)

            return {
                "status": "success",
                "message": f"Successfully transferred ${amount:,.2f} USD to {recipient.name} ({recipient.email}).",
                "transaction_id": str(tx_sender.id),
                "cash_balance": sender_portfolio.cash_balance
            }

        else:
            # Crypto Transfer (asset_type is coin_id e.g. "bitcoin")
            coin_id = asset_type.lower()
            sender_holding = next((h for h in sender_portfolio.holdings if h.coin_id == coin_id), None)
            if not sender_holding or sender_holding.quantity < amount:
                held_qty = sender_holding.quantity if sender_holding else 0.0
                raise BadRequestException(
                    f"Insufficient asset holdings. Attempted to transfer {amount} {coin_id.upper()}, "
                    f"but only hold {held_qty}."
                )

            # Get coin details for transaction price logging
            price = 0.0
            try:
                coin_details = await market_service.get_coin_details(coin_id)
                price = coin_details.get("current_price", 0.0)
            except Exception:
                pass
            if price <= 0:
                prices = await market_service.get_supported_coin_prices()
                price = prices.get(coin_id, 0.0)
            if price <= 0:
                price = sender_holding.average_buy_price  # Fallback to cost basis

            # Cache the sender's average buy price before modifications
            sender_avg_buy_price = sender_holding.average_buy_price

            # Deduct from sender holding
            sender_holding.quantity -= amount
            if sender_holding.quantity <= 0:
                sender_portfolio.holdings.remove(sender_holding)
            else:
                sender_holding.updated_at = datetime.now(timezone.utc)

            # Add to recipient holding (recalculate cost basis based on sender's average buy price)
            recipient_holding = next((h for h in recipient_portfolio.holdings if h.coin_id == coin_id), None)
            if recipient_holding:
                # Recalculate cost basis
                total_qty = recipient_holding.quantity + amount
                new_avg = ((recipient_holding.quantity * recipient_holding.average_buy_price) + (amount * sender_avg_buy_price)) / total_qty
                recipient_holding.quantity = total_qty
                recipient_holding.average_buy_price = new_avg
                recipient_holding.updated_at = datetime.now(timezone.utc)
            else:
                # Create new holding in recipient portfolio
                from app.models.portfolio import PortfolioHolding
                recipient_holding = PortfolioHolding(
                    coin_id=coin_id,
                    symbol=sender_holding.symbol,
                    quantity=amount,
                    average_buy_price=sender_avg_buy_price,
                    updated_at=datetime.now(timezone.utc)
                )
                recipient_portfolio.holdings.append(recipient_holding)

            # Log transactions
            # For sender
            tx_sender = await transaction_repo.create_transaction(
                user_id=sender_id,
                coin_id=coin_id,
                type="TRANSFER_SENT",
                quantity=amount,
                price=price,
                total=amount * price
            )
            # For recipient
            await transaction_repo.create_transaction(
                user_id=recipient.id,
                coin_id=coin_id,
                type="TRANSFER_RECEIVED",
                quantity=amount,
                price=price,
                total=amount * price
            )

            await portfolio_repo.save(sender_portfolio)
            await portfolio_repo.save(recipient_portfolio)

            return {
                "status": "success",
                "message": f"Successfully transferred {amount} {sender_holding.symbol.upper()} to {recipient.name} ({recipient.email}).",
                "transaction_id": str(tx_sender.id),
                "cash_balance": sender_portfolio.cash_balance
            }

    async def get_portfolio_analytics(self, user_id: PydanticObjectId) -> Dict[str, Any]:
        """
        Computes standard deviation (volatility), Sharpe ratio (assuming a 4% risk-free rate),
        and flags asset concentration risk metrics.
        """
        import math
        portfolio = await portfolio_repo.get_by_user_id(user_id)
        if not portfolio:
            portfolio = await portfolio_repo.create_portfolio(user_id)

        # 1. Fetch current price rates
        live_prices = await market_service.get_supported_coin_prices()

        # If they don't hold any assets, return zero metrics
        if not portfolio.holdings:
            return {
                "volatility": 0.0,
                "sharpe_ratio": 0.0,
                "concentration_status": "HEALTHY",
                "warnings": []
            }

        # 2. Fetch price history for standard deviation
        coin_returns = {}
        total_holdings_val = 0.0
        holding_values = {}

        for h in portfolio.holdings:
            # Current value calculations
            price = live_prices.get(h.coin_id, h.average_buy_price)
            val = h.quantity * price
            holding_values[h.coin_id] = val
            total_holdings_val += val

            # Fetch daily return rates history (last 30 days)
            try:
                history = await market_service.get_coin_history(h.coin_id, days=30)
                prices = [p["price"] for p in history.get("prices", [])]
                
                # Sample daily close prices (typically hourly/spaced inputs)
                if len(prices) > 30:
                    step = len(prices) // 30
                    prices = prices[::step][:30]

                rets = []
                for i in range(1, len(prices)):
                    if prices[i-1] > 0:
                        rets.append((prices[i] - prices[i-1]) / prices[i-1])
                coin_returns[h.coin_id] = rets
            except Exception as e:
                logger.error(f"Failed to fetch historical analytics pricing for {h.coin_id}: {e}")
                coin_returns[h.coin_id] = []

        total_portfolio_val = total_holdings_val + portfolio.cash_balance
        if total_portfolio_val <= 0:
            return {
                "volatility": 0.0,
                "sharpe_ratio": 0.0,
                "concentration_status": "HEALTHY",
                "warnings": []
            }

        weights = {cid: val / total_portfolio_val for cid, val in holding_values.items()}

        # 3. Align historical pricing sizes
        min_len = 30
        for rets in coin_returns.values():
            if len(rets) < min_len:
                min_len = len(rets)

        if min_len <= 1:
            return {
                "volatility": 0.0,
                "sharpe_ratio": 0.0,
                "concentration_status": "HEALTHY",
                "warnings": ["Insufficient historical price points to run risk calculations."]
            }

        # 4. Construct weighted returns
        portfolio_returns = []
        for t in range(min_len):
            daily_ret = 0.0
            for cid, rets in coin_returns.items():
                # Align items relative to end indices
                offset = -(min_len - t)
                if abs(offset) <= len(rets):
                    daily_ret += rets[offset] * weights[cid]
            portfolio_returns.append(daily_ret)

        # 5. Compute mean & volatility
        avg_daily_return = sum(portfolio_returns) / len(portfolio_returns)
        daily_variance = sum((r - avg_daily_return) ** 2 for r in portfolio_returns) / (len(portfolio_returns) - 1)
        daily_std_dev = math.sqrt(daily_variance)

        annualized_volatility = daily_std_dev * math.sqrt(365) # Crypto 365 trading days
        annualized_return = avg_daily_return * 365
        
        # 6. Sharpe ratio calculation (Risk-Free rate = 4%)
        risk_free_rate = 0.04
        if annualized_volatility > 0:
            sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility
        else:
            sharpe_ratio = 0.0

        # 7. Diversification warning
        concentration_status = "HEALTHY"
        warnings = []
        for cid, w in weights.items():
            if w > 0.50:
                concentration_status = "HIGH_CONCENTRATION"
                warnings.append(
                    f"Concentration risk: {cid.capitalize()} represents {(w*100):.1f}% of your portfolio. "
                    "Consider diversifying to reduce risk."
                )

        return {
            "volatility": annualized_volatility,
            "sharpe_ratio": sharpe_ratio,
            "concentration_status": concentration_status,
            "warnings": warnings
        }

portfolio_service = PortfolioService()
