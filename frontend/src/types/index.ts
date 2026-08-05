export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  last_login: string;
  created_at: string;
}

export interface PortfolioHolding {
  coin_id: string;
  symbol: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  current_value: number;
  cost_basis: number;
  profit_loss: number;
  profit_loss_percentage: number;
  updated_at: string;
}

export interface PortfolioSummary {
  user_id: string;
  cash_balance: number;
  total_holdings_value: number;
  total_portfolio_value: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
  holdings: PortfolioHolding[];
}

export interface Transaction {
  id: string;
  user_id: string;
  coin_id?: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW';
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank?: number;
  total_volume: number;
  price_change_percentage_24h?: number;
  high_24h?: number;
  low_24h?: number;
}

export interface DetailedCoin {
  id: string;
  symbol: string;
  name: string;
  description: string;
  image?: string;
  current_price: number;
  market_cap: number;
  market_cap_rank?: number;
  total_volume: number;
  price_change_percentage_24h?: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply: number;
}

export interface GlobalMarketOverview {
  active_cryptocurrencies: number;
  total_market_cap_usd: number;
  total_volume_usd: number;
  market_cap_change_percentage_24h_usd: number;
  btc_dominance: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  large_image: string;
  market_cap_rank?: number;
  price_btc: number;
}

export interface UserSettings {
  theme: string;
  currency: string;
  notifications: {
    price_alerts: boolean;
    weekly_digest: boolean;
  };
}

export interface DashboardData {
  portfolio: PortfolioSummary;
  trending: TrendingCoin[];
  gainers: CoinMarketData[];
  losers: CoinMarketData[];
  global_market: GlobalMarketOverview;
  recent_transactions: Transaction[];
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface CoinHistoryResponse {
  prices: PricePoint[];
}

export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  total_count: number;
  limit: number;
  skip: number;
}

export interface LinkedBank {
  bank_name: string;
  account_holder_name: string;
  routing_code: string;
  account_last4: string;
  is_linked: boolean;
  linked_at: string;
}

export interface WalletSummaryResponse {
  user_id: string;
  cash_balance: number;
  linked_bank?: LinkedBank | null;
}
