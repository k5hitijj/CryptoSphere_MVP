import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { PortfolioSummary, PaginatedTransactionsResponse, CoinMarketData, Transaction } from '../types';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
  HelpCircle,
  X,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const Portfolio: React.FC = () => {
  const queryClient = useQueryClient();
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  const [tradeQuantity, setTradeQuantity] = useState<string>('');
  const [txSuccessReceipt, setTxSuccessReceipt] = useState<any | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  // Ledger Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  // 1. Fetch user portfolio
  const { data: portfolio, isLoading: isLoadingPortfolio, refetch: refetchPortfolio } = useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await apiClient.get<PortfolioSummary>('/portfolio');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // 2. Fetch transaction history
  const { data: txData, isLoading: isLoadingTx, refetch: refetchTx } = useQuery<PaginatedTransactionsResponse>({
    queryKey: ['transactions', currentPage],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedTransactionsResponse>(`/portfolio/history?limit=${limit}&skip=${skip}`);
      return response.data;
    },
  });

  // 3. Fetch current live prices of whitelisted assets inside trade modal
  const { data: simplePrices } = useQuery<Record<string, number>>({
    queryKey: ['supportedPrices'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, number>>('/dashboard/summary'); // yields lightweight total summary
      // Fetch prices directly
      const pricesRes = await apiClient.get<CoinMarketData[]>('/markets?limit=50');
      const rates: Record<string, number> = {};
      pricesRes.data.forEach((c: CoinMarketData) => {
        rates[c.id] = c.current_price;
      });
      return rates;
    },
    enabled: isTradeModalOpen,
    refetchInterval: 10000, // refresh price inside modal every 10s
  });

  // 4. Trade Mutations
  const tradeMutation = useMutation({
    mutationFn: async (payload: { coin_id: string; quantity: number; type: 'BUY' | 'SELL' }) => {
      const endpoint = payload.type === 'BUY' ? '/portfolio/buy' : '/portfolio/sell';
      const response = await apiClient.post(endpoint, {
        coin_id: payload.coin_id,
        quantity: payload.quantity
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      setTxSuccessReceipt(data);
      setTradeQuantity('');
    },
    onError: (err: any) => {
      setTradeError(err.response?.data?.detail || 'Transaction failed. Try again.');
    }
  });

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeError(null);
    const qty = parseFloat(tradeQuantity);
    if (isNaN(qty) || qty <= 0) {
      setTradeError('Enter a valid quantity greater than zero.');
      return;
    }

    tradeMutation.mutate({
      coin_id: selectedCoinId,
      quantity: qty,
      type: tradeType
    });
  };

  const getCoinLivePrice = () => {
    return simplePrices?.[selectedCoinId] || 0.0;
  };

  const getHoldingsQuantity = (coinId: string) => {
    return portfolio?.holdings.find(h => h.coin_id === coinId)?.quantity || 0.0;
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Investment Portfolio</h2>
          <p className="text-xs text-slate-400 mt-1">Manage offline crypto balances, evaluate returns, and  orders.</p>
        </div>
        <button
          onClick={() => {
            setTxSuccessReceipt(null);
            setTradeError(null);
            setIsTradeModalOpen(true);
          }}
          className="btn-primary w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Paper Trade
        </button>
      </div>

      {/* Aggregate KPI boxes */}
      {isLoadingPortfolio ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-28 bg-dark-card/50 rounded-2xl border border-dark-border"></div>
          <div className="h-28 bg-dark-card/50 rounded-2xl border border-dark-border"></div>
          <div className="h-28 bg-dark-card/50 rounded-2xl border border-dark-border"></div>
        </div>
      ) : portfolio ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-brand-500/10">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Portfolio Valuation (NAV)</span>
            <h3 className="text-3xl font-extrabold text-white font-mono">{formatCurrency(portfolio.total_portfolio_value)}</h3>
            <span className="text-[10px] text-slate-400 block mt-2">
              Virtual Cash: <span className="font-semibold text-slate-300">{formatCurrency(portfolio.cash_balance)}</span>
            </span>
          </div>

          <div className="glass-panel p-6 border-brand-500/10">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Yield (All time)</span>
            <h3 className={`text-3xl font-extrabold font-mono ${portfolio.total_profit_loss >= 0 ? 'text-crypto-green' : 'text-crypto-red'
              }`}>
              {portfolio.total_profit_loss >= 0 ? '+' : ''}{formatCurrency(portfolio.total_profit_loss)}
            </h3>
            <span className={`text-[10px] font-bold block mt-2 ${portfolio.total_profit_loss >= 0 ? 'text-crypto-green' : 'text-crypto-red'
              }`}>
              {portfolio.total_profit_loss >= 0 ? '+' : ''}{portfolio.total_profit_loss_percentage.toFixed(2)}% ROI
            </span>
          </div>

          <div className="glass-panel p-6 border-brand-500/10">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Virtual Cash Balance</span>
            <h3 className="text-3xl font-extrabold text-white font-mono">{formatCurrency(portfolio.cash_balance)}</h3>
            <span className="text-[10px] text-slate-400 block mt-2">Available Cash to BUY Assets</span>
          </div>
        </div>
      ) : null}

      {/* Assets Holding Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-md font-bold text-slate-200">Current Asset Holdings</h3>
          <p className="text-[11px] text-slate-500">Virtual balance sheet and cost cost-basis valuations</p>
        </div>
        <div className="overflow-x-auto">
          {isLoadingPortfolio ? (
            <div className="py-20 text-center text-slate-500 text-xs animate-pulse">Loading holdings...</div>
          ) : !portfolio || portfolio.holdings.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Your virtual wallet is empty. Click "Paper Trade" to acquire assets.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-500 bg-dark-bg/25">
                  <th className="px-6 py-4 font-semibold">Asset</th>
                  <th className="px-6 py-4 font-semibold text-right">Quantity Held</th>
                  <th className="px-6 py-4 font-semibold text-right">Average Cost</th>
                  <th className="px-6 py-4 font-semibold text-right">Market Price</th>
                  <th className="px-6 py-4 font-semibold text-right">Net Value</th>
                  <th className="px-6 py-4 font-semibold text-right">Cost Basis</th>
                  <th className="px-6 py-4 font-semibold text-right">Yield Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {portfolio.holdings.map((holding) => (
                  <tr key={holding.coin_id} className="hover:bg-dark-border/10 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-slate-200">
                      <div className="flex flex-col">
                        <span>{holding.coin_id.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-500 font-mono">/{holding.symbol.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-300 font-semibold">{holding.quantity.toFixed(6)}</td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-300">{formatCurrency(holding.average_buy_price)}</td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-300">{formatCurrency(holding.current_price)}</td>
                    <td className="px-6 py-4.5 text-right font-mono font-bold text-slate-200">{formatCurrency(holding.current_value)}</td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-400">{formatCurrency(holding.cost_basis)}</td>
                    <td className={`px-6 py-4.5 text-right font-mono font-bold ${holding.profit_loss >= 0 ? 'text-crypto-green' : 'text-crypto-red'
                      }`}>
                      <div className="flex flex-col items-end">
                        <span>{holding.profit_loss >= 0 ? '+' : ''}{formatCurrency(holding.profit_loss)}</span>
                        <span className="text-[10px]">
                          {holding.profit_loss >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ledger Transaction Logs Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <div>
            <h3 className="text-md font-bold text-slate-200">Auditable Order Ledger</h3>
            <p className="text-[11px] text-slate-500">Permanent record of deposits, withdrawals, buys, and sales</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoadingTx}
              className="p-1.5 bg-dark-border/40 hover:bg-dark-border disabled:opacity-40 text-slate-300 rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 self-center font-semibold px-2">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!txData || txData.transactions.length < limit || isLoadingTx}
              className="p-1.5 bg-dark-border/40 hover:bg-dark-border disabled:opacity-40 text-slate-300 rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoadingTx ? (
            <div className="py-20 text-center text-slate-500 text-xs animate-pulse">Syncing logs...</div>
          ) : !txData || txData.transactions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">No records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-[11px] uppercase tracking-wider text-slate-500 bg-dark-bg/25">
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Token</th>
                  <th className="px-6 py-4 font-semibold text-right">Size</th>
                  <th className="px-6 py-4 font-semibold text-right">Price per unit</th>
                  <th className="px-6 py-4 font-semibold text-right">Debit/Credit Value</th>
                  <th className="px-6 py-4 font-semibold text-right">Time (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {txData.transactions.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-dark-border/10 transition-colors">
                    <td className="px-6 py-4.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${tx.type === 'BUY'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : tx.type === 'SELL'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : tx.type === 'DEPOSIT'
                            ? 'bg-crypto-green/10 text-crypto-green border-crypto-green/20'
                            : 'bg-red-500/10 text-crypto-red border-red-500/20'
                        }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 font-semibold text-slate-200">
                      {tx.coin_id ? tx.coin_id.toUpperCase() : 'CASH USD'}
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-slate-300 font-semibold">
                      {tx.quantity > 0 ? tx.quantity.toFixed(6) : '-'}
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

      {/* Trade Simulation Execution Dialog Modal */}
      {isTradeModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-md bg-[#0F1622] border-slate-800 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>

            <button
              onClick={() => setIsTradeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-dark-border rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {txSuccessReceipt ? (
              /* Success Receipt State */
              <div className="text-center py-6 space-y-4 animate-scale-up">
                <CheckCircle className="w-16 h-16 text-crypto-green mx-auto animate-pulse" />
                <h3 className="text-lg font-bold text-white">Order Executed</h3>

                <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt Message:</span>
                    <span className="text-slate-300 text-right truncate max-w-[200px]">{txSuccessReceipt.message}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TX ID:</span>
                    <span className="text-slate-300">{txSuccessReceipt.transaction_id.slice(-12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Cash:</span>
                    <span className="text-white font-bold">{formatCurrency(txSuccessReceipt.cash_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Asset Balance:</span>
                    <span className="text-white font-bold">{txSuccessReceipt.quantity_held.toFixed(6)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsTradeModalOpen(false)}
                  className="btn-primary w-full py-2.5 mt-4"
                >
                  Return to Portfolio
                </button>
              </div>
            ) : (
              /* Order Form Input State */
              <form onSubmit={handleExecuteTrade} className="space-y-5">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Paper Trading Simulation</h3>
                  <p className="text-xs text-slate-500">Execute mock buy and sell orders with zero risk</p>
                </div>

                {tradeError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs leading-relaxed">
                    {tradeError}
                  </div>
                )}

                {/* BUY/SELL Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-dark-bg border border-dark-border rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setTradeType('BUY'); setTradeError(null); }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${tradeType === 'BUY'
                      ? 'bg-brand-500 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Buy Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTradeType('SELL'); setTradeError(null); }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${tradeType === 'SELL'
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sell Asset
                  </button>
                </div>

                {/* Select Asset */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-slate-400">Cryptocurrency Token</label>
                  <select
                    value={selectedCoinId}
                    onChange={(e) => { setSelectedCoinId(e.target.value); setTradeError(null); }}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border text-slate-100 rounded-xl outline-none focus:border-brand-500 text-xs font-semibold cursor-pointer"
                  >
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="solana">Solana (SOL)</option>
                    <option value="tether">Tether (USDT)</option>
                  </select>
                </div>

                {/* Quantity input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <label className="uppercase font-bold text-slate-400">Quantity size</label>
                    <span className="text-slate-500 font-medium">
                      {tradeType === 'BUY'
                        ? `Cash: ${formatCurrency(portfolio?.cash_balance || 0)}`
                        : `Held: ${getHoldingsQuantity(selectedCoinId).toFixed(4)}`
                      }
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={tradeQuantity}
                    onChange={(e) => { setTradeQuantity(e.target.value); setTradeError(null); }}
                    className="input-field py-3 text-sm font-semibold"
                    required
                  />
                </div>

                {/* Estimate Ticker Summary Info */}
                <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live Rate Price:</span>
                    <span className="text-slate-300 font-mono font-bold">
                      {getCoinLivePrice() > 0 ? formatCurrency(getCoinLivePrice()) : <Clock className="w-3 h-3 inline animate-spin" />}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dark-border/40 pt-2 font-bold text-sm">
                    <span className="text-slate-400">Estimated Cost:</span>
                    <span className="text-white font-mono">
                      {formatCurrency(getCoinLivePrice() * (parseFloat(tradeQuantity) || 0))}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={tradeMutation.isPending}
                  className={`w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${tradeType === 'BUY'
                    ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                    } disabled:opacity-50`}
                >
                  {tradeMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                  Execute {tradeType}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Portfolio;
