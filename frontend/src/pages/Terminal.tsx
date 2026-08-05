import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { CoinMarketData, DetailedCoin, CoinHistoryResponse, PortfolioSummary } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Search, 
  ArrowUpDown, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Layers,
  RefreshCw,
  Coins,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Terminal: React.FC = () => {
  // States matching the image widgets
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  const [searchCoinTerm, setSearchCoinTerm] = useState<string>('');
  const [chartRangeDays, setChartRangeDays] = useState<number>(30); // Default 1M (30 days)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Exchange calculator states
  const [exchangeSellCurrency, setExchangeSellCurrency] = useState<string>('USD');
  const [exchangeBuyCoin, setExchangeBuyCoin] = useState<string>('bitcoin');
  const [exchangeSellValue, setExchangeSellValue] = useState<string>('1000');
  const [exchangeBuyValue, setExchangeBuyValue] = useState<number>(0);

  // 1. Fetch top coins by market cap
  const { data: coinsList, isLoading: isLoadingCoins } = useQuery<CoinMarketData[]>({
    queryKey: ['terminalMarkets'],
    queryFn: async () => {
      const response = await apiClient.get<CoinMarketData[]>('/markets?limit=50');
      return response.data;
    },
    refetchInterval: 60000,
  });

  // 2. Fetch history for the active chart
  const { data: chartHistory, isLoading: isLoadingChart } = useQuery<CoinHistoryResponse>({
    queryKey: ['terminalHistory', selectedCoinId, chartRangeDays],
    queryFn: async () => {
      const response = await apiClient.get<CoinHistoryResponse>(`/markets/${selectedCoinId}/history?days=${chartRangeDays}`);
      return response.data;
    },
    enabled: !!selectedCoinId,
  });

  // 3. Fetch portfolio summaries for the allocation donut
  const { data: portfolioSummary } = useQuery<PortfolioSummary>({
    queryKey: ['terminalPortfolio'],
    queryFn: async () => {
      const response = await apiClient.get<PortfolioSummary>('/portfolio');
      return response.data;
    },
  });

  // Active coin metadata (for details display in chart header)
  const activeCoin = coinsList?.find(c => c.id === selectedCoinId);

  // Recalculate converter rate on inputs change
  useEffect(() => {
    if (!coinsList || !exchangeSellValue) {
      setExchangeBuyValue(0);
      return;
    }

    const val = parseFloat(exchangeSellValue);
    if (isNaN(val) || val <= 0) {
      setExchangeBuyValue(0);
      return;
    }

    // Get prices of crypto coins
    const buyPrice = coinsList.find(c => c.id === exchangeBuyCoin)?.current_price || 1.0;
    
    let sellPriceUsd = 1.0;
    if (exchangeSellCurrency === 'EUR') sellPriceUsd = 1.09;
    else if (exchangeSellCurrency === 'GBP') sellPriceUsd = 1.27;
    else if (exchangeSellCurrency === 'USD') sellPriceUsd = 1.0;
    else {
      // If selling a cryptocurrency
      sellPriceUsd = coinsList.find(c => c.id === exchangeSellCurrency.toLowerCase())?.current_price || 0.0;
    }

    const totalUsdValue = val * sellPriceUsd;
    const equivalentCrypto = totalUsdValue / buyPrice;
    setExchangeBuyValue(equivalentCrypto);
  }, [exchangeSellCurrency, exchangeBuyCoin, exchangeSellValue, coinsList]);

  // Sidebar list filters
  const filteredCoins = (coinsList || [])
    .filter(c => c.name.toLowerCase().includes(searchCoinTerm.toLowerCase()) || c.symbol.toLowerCase().includes(searchCoinTerm.toLowerCase()))
    .sort((a, b) => {
      const valA = a.current_price;
      const valB = b.current_price;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

  // Pie chart allocation data
  const pieData = (portfolioSummary?.holdings || []).map(h => ({
    name: h.symbol.toUpperCase(),
    value: h.current_value
  }));
  
  if (portfolioSummary && portfolioSummary.cash_balance > 0) {
    pieData.push({
      name: 'CASH',
      value: portfolioSummary.cash_balance
    });
  }

  const COLORS = ['#3b66ff', '#10B981', '#F59E0B', '#A78BFA', '#4B5563'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[85vh]">
      
      {/* LEFT COLUMN: Main Chart & Widgets Dashboard (3/4 Width) */}
      <div className="flex-1 space-y-6">
        
        {/* Top Control Header Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Currency Select Box */}
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-4 py-2.5 bg-dark-card border border-dark-border text-slate-100 rounded-xl outline-none focus:border-brand-500 font-bold text-sm cursor-pointer"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>

            {/* Quick coin search select */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search coin..."
                value={searchCoinTerm}
                onChange={(e) => setSearchCoinTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-dark-card border border-dark-border text-slate-100 placeholder:text-slate-500 rounded-xl outline-none focus:border-brand-500 text-xs"
              />
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-white hidden sm:block">Interactive Analytics</h2>
        </div>

        {/* Main Price Chart Terminal Panel */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-dark-border/40 pb-4">
            
            {/* Chart Header Details */}
            <div className="flex items-center gap-3">
              {activeCoin && (
                <>
                  <img src={activeCoin.image} alt={activeCoin.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                      {activeCoin.name} in {selectedCurrency}
                      <span className="text-[10px] text-slate-500 uppercase font-mono bg-dark-border px-1.5 py-0.5 rounded">
                        {activeCoin.symbol}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold font-mono">
                      {formatCurrency(activeCoin.current_price)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Chart Config buttons */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Range selectors */}
              <div className="flex bg-dark-bg border border-dark-border p-0.5 rounded-lg">
                {[1, 7, 30, 180, 365].map((days) => (
                  <button
                    key={days}
                    onClick={() => setChartRangeDays(days)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                      chartRangeDays === days 
                        ? 'bg-brand-500 text-white' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {days === 1 ? '1D' : days === 7 ? '1W' : days === 30 ? '1M' : days === 180 ? '6M' : '1Y'}
                  </button>
                ))}
              </div>

              {/* Chart type select */}
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
                className="px-3 py-1 bg-dark-bg border border-dark-border text-slate-400 font-bold rounded-lg outline-none cursor-pointer text-[10px]"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
          </div>

          {/* Recharts viewport */}
          <div className="h-80 w-full relative">
            {isLoadingChart ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center gap-2">
                <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
                <span className="text-xs text-slate-500">Loading historical chart...</span>
              </div>
            ) : chartHistory && chartHistory.prices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <AreaChart data={chartHistory.prices}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      stroke="#4B5563" 
                      fontSize={9} 
                      tickLine={false}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
                      }}
                    />
                    <YAxis 
                      stroke="#4B5563" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '12px' }}
                      labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
                      itemStyle={{ color: '#E5E7EB', fontSize: 10 }}
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Rate']}
                      labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
                    />
                    <Area type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#chartGrad)" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartHistory.prices}>
                    <XAxis 
                      dataKey="time" 
                      stroke="#4B5563" 
                      fontSize={9} 
                      tickLine={false}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return d.toLocaleDateString(undefined, {month:'short', day:'numeric'});
                      }}
                    />
                    <YAxis 
                      stroke="#4B5563" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '12px' }}
                      labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
                      itemStyle={{ color: '#E5E7EB', fontSize: 10 }}
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Rate']}
                    />
                    <Bar dataKey="price" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Chart history data not available.
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: Split portfolio and converter (Exchange Coins) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bottom Left Panel: Portfolio Allocation */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-200 text-sm">Portfolio Summary</h3>
              {portfolioSummary && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Val: {formatCurrency(portfolioSummary.total_portfolio_value)}
                </span>
              )}
            </div>

            {pieData.length === 0 ? (
              <div className="h-44 flex flex-col justify-center items-center text-xs text-slate-500">
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                No assets held yet.
              </div>
            ) : (
              <div className="flex items-center justify-around h-44 py-2">
                <div className="h-full w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Labels list */}
                <div className="w-1/2 space-y-1.5 text-[10px] max-h-40 overflow-y-auto pl-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></span>
                      <span className="text-slate-400 font-semibold truncate max-w-[80px]">{entry.name}</span>
                      <span className="text-slate-200 font-bold ml-auto">
                        {portfolioSummary ? `${((entry.value / portfolioSummary.total_portfolio_value) * 100).toFixed(0)}%` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Right Panel: Exchange Converter */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Exchange Coins Calculator
            </h3>
            
            <div className="space-y-3.5 text-xs">
              {/* Sell Side */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Sell Asset</label>
                  <select
                    value={exchangeSellCurrency}
                    onChange={(e) => setExchangeSellCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border text-slate-100 rounded-xl outline-none focus:border-brand-500 font-bold text-xs"
                  >
                    <option value="USD">USD (Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (Pound)</option>
                    <option value="bitcoin">BTC (Bitcoin)</option>
                    <option value="ethereum">ETH (Ethereum)</option>
                    <option value="solana">SOL (Solana)</option>
                  </select>
                </div>
                
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Sell Amount</label>
                  <input
                    type="number"
                    value={exchangeSellValue}
                    onChange={(e) => setExchangeSellValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border text-slate-100 font-mono font-bold rounded-xl outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Swap indicator */}
              <div className="flex justify-center py-1">
                <ArrowRightLeft className="w-4 h-4 text-slate-500 rotate-90" />
              </div>

              {/* Buy Side */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Buy Token</label>
                  <select
                    value={exchangeBuyCoin}
                    onChange={(e) => setExchangeBuyCoin(e.target.value)}
                    className="w-full px-3 py-2.5 bg-dark-bg border border-dark-border text-slate-100 rounded-xl outline-none focus:border-brand-500 font-bold text-xs"
                  >
                    <option value="bitcoin">BTC (Bitcoin)</option>
                    <option value="ethereum">ETH (Ethereum)</option>
                    <option value="solana">SOL (Solana)</option>
                    <option value="tether">USDT (Tether)</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Calculated equivalent</label>
                  <div className="w-full px-3 py-2 bg-dark-bg/60 border border-dark-border text-emerald-400 font-mono font-bold rounded-xl text-sm">
                    {exchangeBuyValue.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Sidebar Market Cap Directory (1/4 Width) */}
      <div className="w-full lg:w-72 space-y-4 flex flex-col">
        
        {/* Sidebar Header */}
        <div className="p-4 bg-dark-card/40 border border-dark-border rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Market Rankings</span>
            <button 
              onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
              className="p-1 hover:bg-dark-border rounded text-slate-400 hover:text-white"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-slate-500">Sorted by market cap value</span>
        </div>

        {/* Sidebar list items */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[70vh] pr-1">
          {isLoadingCoins ? (
            <div className="py-20 text-center text-slate-500 text-xs animate-pulse">Loading ranking list...</div>
          ) : (
            filteredCoins.map((coin) => (
              <div
                key={coin.id}
                onClick={() => setSelectedCoinId(coin.id)}
                className={`p-3 border rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between text-xs ${
                  selectedCoinId === coin.id
                    ? 'bg-brand-500/10 border-brand-500 shadow-glass-hover'
                    : 'bg-dark-card/40 border-dark-border hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={coin.image} alt={coin.name} className="w-6.5 h-6.5 rounded-full" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-200 block truncate">{coin.name}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">{coin.symbol}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-slate-200 block">
                    {formatCurrency(coin.current_price)}
                  </span>
                  <span className={`text-[9px] font-bold font-mono ${
                    (coin.price_change_percentage_24h || 0) >= 0 ? 'text-crypto-green' : 'text-crypto-red'
                  }`}>
                    {(coin.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                    {(coin.price_change_percentage_24h || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
export default Terminal;
