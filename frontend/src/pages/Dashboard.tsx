import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { DashboardData } from '../types';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp as IconTrending,
  Layers,
  Sparkles,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  // Fetch Dashboard aggregate data with 30s auto-refresh
  const { data, isLoading, isRefetching, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardData>('/dashboard');
      return response.data;
    },
    refetchInterval: 30000, // Refresh automatically every 30 seconds
  });

  // Fetch portfolio risk analytics
  const { data: analytics } = useQuery<any>({
    queryKey: ['portfolioAnalytics'],
    queryFn: async () => {
      const response = await apiClient.get<any>('/portfolio/analytics');
      return response.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Assembling live intelligence...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[80vh] flex flex-col justify-center items-center text-center">
        <p className="text-red-400 font-semibold mb-2">Error loading dashboard metrics</p>
        <button onClick={() => refetch()} className="btn-primary">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const { portfolio, trending, gainers, losers, global_market, recent_transactions } = data;

  // Prepare data for PieChart allocation
  const pieData = portfolio.holdings.map(h => ({
    name: h.symbol.toUpperCase(),
    value: h.current_value
  }));

  if (portfolio.cash_balance > 0) {
    pieData.push({
      name: 'USD CASH',
      value: portfolio.cash_balance
    });
  }

  const COLORS = ['#3b66ff', '#10B981', '#F59E0B', '#A78BFA', '#4B5563'];

  // Prepare dummy data for the portfolio performance chart (visual baseline)
  const chartData = [
    { name: 'Mon', value: portfolio.total_portfolio_value * 0.96 },
    { name: 'Tue', value: portfolio.total_portfolio_value * 0.98 },
    { name: 'Wed', value: portfolio.total_portfolio_value * 0.97 },
    { name: 'Thu', value: portfolio.total_portfolio_value * 0.99 },
    { name: 'Fri', value: portfolio.total_portfolio_value * 1.01 },
    { name: 'Sat', value: portfolio.total_portfolio_value * 1.00 },
    { name: 'Sun', value: portfolio.total_portfolio_value }
  ];

  return (
    <div className="space-y-8">
      {/* Header Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Market Terminal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Live prices auto-refreshing. Last updated:{' '}
            <span className="font-semibold text-slate-300">
              {new Date().toLocaleTimeString()}
            </span>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="btn-secondary text-xs flex items-center gap-2 self-end"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Force Refresh
        </button>
      </div>

      {/* Global Market Overview Tickers Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass-panel border-brand-500/10 bg-brand-500/[0.01]">
        <div className="text-center md:text-left border-r border-dark-border last:border-0 pr-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Global Cap</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">
            {formatCurrency(global_market.total_market_cap_usd)}
          </p>
        </div>
        <div className="text-center md:text-left border-r border-dark-border last:border-0 pr-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">24h Change</span>
          <p className={`text-sm font-bold mt-0.5 flex items-center justify-center md:justify-start gap-1 ${global_market.market_cap_change_percentage_24h_usd >= 0 ? 'text-crypto-green' : 'text-crypto-red'
            }`}>
            {global_market.market_cap_change_percentage_24h_usd >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {formatPercentage(global_market.market_cap_change_percentage_24h_usd)}
          </p>
        </div>
        <div className="text-center md:text-left border-r border-dark-border last:border-0 pr-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">24h Vol</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">
            {formatCurrency(global_market.total_volume_usd)}
          </p>
        </div>
        <div className="text-center md:text-left pr-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">BTC Dominance</span>
          <p className="text-sm font-bold text-brand-400 mt-0.5">
            {global_market.btc_dominance.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Asset Value */}
        <div className="glass-panel p-6 glass-panel-hover flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-brand-500"></div>
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-brand-400" />
              Net Portfolio Valuation
            </span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {formatCurrency(portfolio.total_portfolio_value)}
            </h3>
            <p className="text-[11px] text-slate-400">
              Holdings Value: <span className="font-semibold text-slate-300">{formatCurrency(portfolio.total_holdings_value)}</span>
            </p>
          </div>
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Unrealized Return P&L */}
        <div className="glass-panel p-6 glass-panel-hover flex items-center justify-between relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-[4px] h-full ${portfolio.total_profit_loss >= 0 ? 'bg-crypto-green' : 'bg-crypto-red'
            }`}></div>
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <IconTrending className="w-4 h-4 text-brand-400" />
              Total Unrealized P&L
            </span>
            <h3 className={`text-3xl font-extrabold tracking-tight ${portfolio.total_profit_loss >= 0 ? 'text-crypto-green' : 'text-crypto-red'
              }`}>
              {formatCurrency(portfolio.total_profit_loss)}
            </h3>
            <p className={`text-[11px] font-semibold flex items-center gap-1 ${portfolio.total_profit_loss >= 0 ? 'text-crypto-green' : 'text-crypto-red'
              }`}>
              {portfolio.total_profit_loss >= 0 ? '+' : ''}
              {portfolio.total_profit_loss_percentage.toFixed(2)}% Return
            </p>
          </div>
          <div className={`p-3 rounded-xl ${portfolio.total_profit_loss >= 0 ? 'bg-crypto-green/10 text-crypto-green' : 'bg-crypto-red/10 text-crypto-red'
            }`}>
            {portfolio.total_profit_loss >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
        </div>

        {/* Virtual Cash Balance */}
        <div className="glass-panel p-6 glass-panel-hover flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500"></div>
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Available Virtual Cash
            </span>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {formatCurrency(portfolio.cash_balance)}
            </h3>
            <p className="text-[11px] text-slate-400">
              Deposited Virtual Fiat Currency
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Portfolio Risk Analytics Panel */}
      {analytics && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
                Institutional Risk Analytics
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Calculated using 30-day historical correlation and volatility indices.</p>
            </div>
          </div>
          
          {analytics.warnings && analytics.warnings.length > 0 && (
            <div className="space-y-2">
              {analytics.warnings.map((warning: string, i: number) => (
                <div key={i} className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex gap-2 items-center">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sharpe Ratio */}
            <div className="glass-panel p-5 border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Sharpe Ratio
                </span>
                <h4 className={`text-2xl font-extrabold font-mono ${
                  analytics.sharpe_ratio >= 1.5 
                    ? 'text-crypto-green' 
                    : analytics.sharpe_ratio >= 1.0 
                    ? 'text-brand-400' 
                    : 'text-amber-400'
                }`}>
                  {analytics.sharpe_ratio.toFixed(2)}
                </h4>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {analytics.sharpe_ratio >= 1.5 
                    ? 'Excellent risk-adjusted returns' 
                    : analytics.sharpe_ratio >= 1.0 
                    ? 'Good risk-adjusted return profile' 
                    : 'Low risk-adjusted return profile'}
                </span>
              </div>
              <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* Annualized Volatility */}
            <div className="glass-panel p-5 border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Annual Volatility
                </span>
                <h4 className="text-2xl font-extrabold text-white font-mono">
                  {(analytics.volatility * 100).toFixed(1)}%
                </h4>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {analytics.volatility >= 0.8 
                    ? 'Extremely volatile asset spread' 
                    : analytics.volatility >= 0.4 
                    ? 'Moderately volatile asset spread' 
                    : 'Low volatility asset spread'}
                </span>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Diversification Index */}
            <div className="glass-panel p-5 border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Concentration Risk
                </span>
                <h4 className={`text-2xl font-extrabold ${
                  analytics.concentration_status === 'HEALTHY' ? 'text-crypto-green' : 'text-amber-400'
                }`}>
                  {analytics.concentration_status === 'HEALTHY' ? 'Healthy' : 'High Risk'}
                </h4>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {analytics.concentration_status === 'HEALTHY' 
                    ? 'Holdings are well diversified' 
                    : 'Single asset concentration warning!'}
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Charts & Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-md font-bold text-slate-200">Portfolio Growth Curve</h3>
            <p className="text-[11px] text-slate-500">7-Day account valuation index</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b66ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b66ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4B5563" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#4B5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '12px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                  itemStyle={{ color: '#E5E7EB' }}
                  formatter={(val: any) => [formatCurrency(Number(val)), 'NAV']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b66ff" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie Chart */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-200">Asset Allocation</h3>
            <p className="text-[11px] text-slate-500">Portfolio distribution breakdown</p>
          </div>
          {pieData.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-500 text-xs py-10">
              <Layers className="w-10 h-10 mb-2 opacity-50" />
              Empty portfolio. Deposit funds to buy coins.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Value']}
                      contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Labels list */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 text-xs max-h-32 overflow-y-auto">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="text-slate-400 font-medium truncate">{entry.name}</span>
                    <span className="text-slate-300 font-bold ml-auto">
                      {((entry.value / portfolio.total_portfolio_value) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Live Rates Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <div>
            <h3 className="text-md font-bold text-slate-200">Whitelisted Asset Rates</h3>
            <p className="text-[11px] text-slate-500">Direct trade and holdings supported tickers</p>
          </div>
          <Link to="/markets" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold">
            Markets Directory <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-500 bg-dark-bg/25">
                <th className="px-6 py-4 font-semibold">Asset</th>
                <th className="px-6 py-4 font-semibold">Ticker</th>
                <th className="px-6 py-4 font-semibold text-right">Live Price</th>
                <th className="px-6 py-4 font-semibold text-right">24h Change</th>
                <th className="px-6 py-4 font-semibold text-right">Market Valuation</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-xs">
              {/* Load prices for whitelisted coins */}
              {['bitcoin', 'ethereum', 'solana', 'tether'].map(coinId => {
                const coinMarket = gainers.find(c => c.id === coinId) || losers.find(c => c.id === coinId);
                const coinHolding = portfolio.holdings.find(h => h.coin_id === coinId);

                const name = coinId === 'bitcoin' ? 'Bitcoin' : coinId === 'ethereum' ? 'Ethereum' : coinId === 'solana' ? 'Solana' : 'Tether';
                const symbol = coinId === 'bitcoin' ? 'BTC' : coinId === 'ethereum' ? 'ETH' : coinId === 'solana' ? 'SOL' : 'USDT';
                const price = coinMarket?.current_price || (coinHolding ? coinHolding.current_price : coinId === 'bitcoin' ? 65000 : coinId === 'ethereum' ? 3400 : coinId === 'solana' ? 140 : 1.0);
                const change = coinMarket?.price_change_percentage_24h || 0;
                const mcap = coinMarket?.market_cap || (price * (coinId === 'bitcoin' ? 19.7e6 : coinId === 'ethereum' ? 120e6 : coinId === 'solana' ? 460e6 : 110e9));

                return (
                  <tr key={coinId} className="hover:bg-dark-border/10 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-slate-200">{name}</td>
                    <td className="px-6 py-4.5 font-mono text-slate-400">{symbol}</td>
                    <td className="px-6 py-4.5 text-right font-semibold text-slate-200">{formatCurrency(price)}</td>
                    <td className={`px-6 py-4.5 text-right font-bold ${change >= 0 ? 'text-crypto-green' : 'text-crypto-red'
                      }`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4.5 text-right text-slate-400 font-medium">
                      {formatCurrency(mcap)}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <Link
                        to="/portfolio"
                        className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white rounded-lg font-semibold transition-all duration-150"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gainers, Losers, Trending side grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trending Searches */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Trending Intelligence
          </h3>
          <div className="divide-y divide-dark-border/40">
            {trending.slice(0, 4).map((coin) => (
              <div key={coin.id} className="py-3 flex items-center justify-between text-xs hover:bg-dark-border/10 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <img src={coin.large_image} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <div>
                    <span className="font-semibold text-slate-300 block">{coin.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{coin.symbol}</span>
                  </div>
                </div>
                <span className="text-slate-400 font-semibold font-mono text-[10px]">
                  Rank #{coin.market_cap_rank || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Gainers */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-crypto-green flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top Gainers (24h)
          </h3>
          <div className="divide-y divide-dark-border/40">
            {gainers.slice(0, 4).map((coin) => (
              <div key={coin.id} className="py-3 flex items-center justify-between text-xs hover:bg-dark-border/10 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <div>
                    <span className="font-semibold text-slate-300 block">{coin.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{coin.symbol}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-200 block font-mono">{formatCurrency(coin.current_price)}</span>
                  <span className="text-[10px] font-bold text-crypto-green font-mono">
                    +{coin.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-crypto-red flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Top Losers (24h)
          </h3>
          <div className="divide-y divide-dark-border/40">
            {losers.slice(0, 4).map((coin) => (
              <div key={coin.id} className="py-3 flex items-center justify-between text-xs hover:bg-dark-border/10 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2.5">
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <div>
                    <span className="font-semibold text-slate-300 block">{coin.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{coin.symbol}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-200 block font-mono">{formatCurrency(coin.current_price)}</span>
                  <span className="text-[10px] font-bold text-crypto-red font-mono">
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Ledger History */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <div>
            <h3 className="text-md font-bold text-slate-200">Recent Operations</h3>
            <p className="text-[11px] text-slate-500">Auditable account history logs</p>
          </div>
          <Link to="/portfolio" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold">
            Full Ledger <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recent_transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No transactions recorded yet. deposits or asset purchases to start.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-500 bg-dark-bg/25">
                  <th className="px-6 py-4 font-semibold">Operation</th>
                  <th className="px-6 py-4 font-semibold">Asset</th>
                  <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                  <th className="px-6 py-4 font-semibold text-right">Unit Price</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Net</th>
                  <th className="px-6 py-4 font-semibold text-right">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-dark-border/10 transition-colors">
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${tx.type === 'BUY'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : tx.type === 'SELL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : tx.type === 'DEPOSIT'
                            ? 'bg-crypto-green/10 text-crypto-green border border-crypto-green/20'
                            : 'bg-red-500/10 text-crypto-red border border-red-500/20'
                        }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-slate-200">
                      {tx.coin_id ? tx.coin_id.toUpperCase() : 'CASH'}
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-300">
                      {tx.quantity > 0 ? tx.quantity.toFixed(4) : '-'}
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-300">
                      {tx.price > 0 ? formatCurrency(tx.price) : '-'}
                    </td>
                    <td className="px-6 py-4.5 text-right font-bold text-slate-200">
                      {formatCurrency(tx.total)}
                    </td>
                    <td className="px-6 py-4.5 text-right text-slate-400 font-medium">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
