import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { CoinMarketData, DetailedCoin, CoinHistoryResponse } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import {
  Search,
  ArrowUpDown,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export const Markets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof CoinMarketData>('market_cap_rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [historyDays, setHistoryDays] = useState<number>(7);

  // Fetch all markets (limit 50)
  const { data: marketsList, isLoading, refetch } = useQuery<CoinMarketData[]>({
    queryKey: ['markets'],
    queryFn: async () => {
      const response = await apiClient.get<CoinMarketData[]>('/markets?limit=50');
      return response.data;
    },
    refetchInterval: 60000,
  });

  // Fetch individual coin details
  const { data: coinDetails, isLoading: isLoadingDetails } = useQuery<DetailedCoin>({
    queryKey: ['coinDetails', selectedCoinId],
    queryFn: async () => {
      const response = await apiClient.get<DetailedCoin>(`/markets/${selectedCoinId}`);
      return response.data;
    },
    enabled: !!selectedCoinId,
  });

  // Fetch individual coin history
  const { data: coinHistory } = useQuery<CoinHistoryResponse>({
    queryKey: ['coinHistory', selectedCoinId, historyDays],
    queryFn: async () => {
      const response = await apiClient.get<CoinHistoryResponse>(`/markets/${selectedCoinId}/history?days=${historyDays}`);
      return response.data;
    },
    enabled: !!selectedCoinId,
  });

  const toggleSort = (key: keyof CoinMarketData) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter and sort the markets list
  const filteredMarkets = (marketsList || [])
    .filter(coin =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      if (typeof valA === 'string') {
        return sortAsc
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      } else {
        return sortAsc
          ? (valA as number) - (valB as number)
          : (valB as number) - (a[sortKey] as number);
      }
    });

  return (
    <div className="space-y-6">
      {/* Title Widget */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">Markets Directory</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time cryptocurrency statistics. Search and filter index assets.</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search coin by name or ticker symbol..."
            value={searchTerm}
            onChange={handleSearch}
            className="input-field pl-12 py-3 bg-dark-card/40 focus:bg-dark-card/70 border-dark-border focus:border-brand-500 text-sm"
          />
        </div>
      </div>

      {/* Main Markets List Table */}
      {isLoading ? (
        <div className="h-[60vh] flex flex-col justify-center items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs">Fetching market listings...</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-500 bg-dark-bg/25">
                  <th className="px-6 py-4 font-semibold text-center w-16">
                    <button onClick={() => toggleSort('market_cap_rank')} className="flex items-center gap-1.5 mx-auto hover:text-slate-200">
                      Rank <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-slate-200">
                      Asset Name <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <button onClick={() => toggleSort('current_price')} className="flex items-center gap-1.5 ml-auto hover:text-slate-200">
                      Price <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <button onClick={() => toggleSort('price_change_percentage_24h')} className="flex items-center gap-1.5 ml-auto hover:text-slate-200">
                      24h Change <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <button onClick={() => toggleSort('market_cap')} className="flex items-center gap-1.5 ml-auto hover:text-slate-200">
                      Market Cap <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">24h Vol</th>
                  <th className="px-6 py-4 font-semibold text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {filteredMarkets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500 font-semibold">
                      No assets match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMarkets.map((coin) => (
                    <tr
                      key={coin.id}
                      onClick={() => setSelectedCoinId(coin.id)}
                      className="hover:bg-dark-border/15 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4.5 text-center font-bold text-slate-500 font-mono">
                        {coin.market_cap_rank || '-'}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full shadow-inner" />
                          <div>
                            <span className="font-bold text-slate-200 block text-sm">{coin.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right font-bold text-slate-200 font-mono text-sm">
                        {formatCurrency(coin.current_price)}
                      </td>
                      <td className={`px-6 py-4.5 text-right font-extrabold font-mono text-sm ${(coin.price_change_percentage_24h || 0) >= 0 ? 'text-crypto-green' : 'text-crypto-red'
                        }`}>
                        {(coin.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                        {(coin.price_change_percentage_24h || 0).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4.5 text-right text-slate-300 font-semibold font-mono">
                        {formatCurrency(coin.market_cap)}
                      </td>
                      <td className="px-6 py-4.5 text-right text-slate-400 font-medium font-mono">
                        {formatCurrency(coin.total_volume)}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className="inline-flex p-1 bg-dark-border/30 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intelligence Slide-over Modal Dialog */}
      {selectedCoinId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-[#0F1622] h-full shadow-2xl border-l border-dark-border flex flex-col p-6 overflow-y-auto animate-slide-in relative">

            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              {isLoadingDetails ? (
                <div className="w-1/2 h-10 bg-dark-border/50 animate-pulse rounded-lg"></div>
              ) : coinDetails ? (
                <div className="flex items-center gap-4">
                  <img src={coinDetails.image} alt={coinDetails.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {coinDetails.name}
                      <span className="text-xs uppercase font-mono text-slate-400 bg-dark-border px-2 py-0.5 rounded-full">
                        {coinDetails.symbol}
                      </span>
                    </h3>
                    <span className="text-[10px] text-brand-400 uppercase tracking-widest font-semibold">
                      Rank #{coinDetails.market_cap_rank || 'N/A'}
                    </span>
                  </div>
                </div>
              ) : null}
              <button
                onClick={() => setSelectedCoinId(null)}
                className="p-2 hover:bg-dark-border/80 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex-1 flex flex-col justify-center items-center py-20 gap-4">
                <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 text-xs font-semibold">Aggregating historical curves...</p>
              </div>
            ) : coinDetails ? (
              <div className="space-y-6 flex-1">
                {/* Visual Performance Metrics Box */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Current rate</span>
                    <span className="text-md font-bold text-white font-mono">{formatCurrency(coinDetails.current_price)}</span>
                  </div>
                  <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">24h High</span>
                    <span className="text-md font-bold text-crypto-green font-mono">{formatCurrency(coinDetails.high_24h || 0)}</span>
                  </div>
                  <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">24h Low</span>
                    <span className="text-md font-bold text-crypto-red font-mono">{formatCurrency(coinDetails.low_24h || 0)}</span>
                  </div>
                </div>

                {/* Historical Chart Segment */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Chart</span>

                    {/* Range Tabs */}
                    <div className="flex gap-1 bg-dark-bg border border-dark-border p-0.5 rounded-lg">
                      {[7, 30, 90].map((d) => (
                        <button
                          key={d}
                          onClick={() => setHistoryDays(d)}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${historyDays === d
                              ? 'bg-brand-500 text-white'
                              : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-56 bg-dark-bg/40 border border-dark-border rounded-xl p-4">
                    {coinHistory && coinHistory.prices.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={coinHistory.prices}>
                          <defs>
                            <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="time"
                            stroke="#4B5563"
                            fontSize={9}
                            tickLine={false}
                            tickFormatter={(val) => {
                              const d = new Date(val);
                              return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis
                            stroke="#4B5563"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249', borderRadius: '12px' }}
                            labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
                            itemStyle={{ color: '#E5E7EB', fontSize: 10 }}
                            formatter={(val: any) => [formatCurrency(Number(val)), 'Price']}
                            labelFormatter={(label: any) => new Date(Number(label)).toLocaleString()}
                          />
                          <Area type="monotone" dataKey="price" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#modalGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 font-semibold">
                        Chart data unavailable.
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Statistics Card */}
                <div className="glass-panel p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Market Intelligence Stats</h4>
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                    <div className="flex justify-between border-b border-dark-border/40 pb-2">
                      <span className="text-slate-500">Market Cap</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(coinDetails.market_cap)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dark-border/40 pb-2">
                      <span className="text-slate-500">24h Vol</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(coinDetails.total_volume)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dark-border/40 pb-2 col-span-2">
                      <span className="text-slate-500">Circulating Supply</span>
                      <span className="font-semibold text-slate-200 font-mono">
                        {coinDetails.circulating_supply.toLocaleString()} {coinDetails.symbol.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Asset Description Paragraph */}
                {coinDetails.description && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</span>
                    <p
                      className="text-xs text-slate-400 leading-relaxed max-h-40 overflow-y-auto pr-2 bg-dark-bg/20 p-3 rounded-lg border border-dark-border/40"
                      dangerouslySetInnerHTML={{ __html: coinDetails.description }}
                    ></p>
                  </div>
                )}

                {/* Direct Action Link */}
                <div className="pt-4 flex gap-4">
                  {/* Redirect trade button */}
                  <Link
                    to="/portfolio"
                    className="btn-primary w-full py-3"
                    onClick={() => setSelectedCoinId(null)}
                  >
                    <DollarSign className="w-4 h-4" />
                    Paper Trade
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-10">Details could not be compiled.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Markets;
