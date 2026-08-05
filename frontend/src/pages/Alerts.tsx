import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { CoinMarketData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { 
  Bell, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Clock 
} from 'lucide-react';

export const Alerts: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch live coin prices to populate options and show current prices
  const { data: coinsList, isLoading: isLoadingCoins } = useQuery<CoinMarketData[]>({
    queryKey: ['alertsMarkets'],
    queryFn: async () => {
      const response = await apiClient.get<CoinMarketData[]>('/markets?limit=10');
      return response.data;
    },
  });

  // 2. Fetch active and historical alerts
  const { data: alertsList, isLoading: isLoadingAlerts } = useQuery<any[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/alerts');
      return response.data;
    },
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (payload: { coin_id: string; target_price: number; condition: string }) => {
      const response = await apiClient.post('/alerts', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setSuccessMsg(`Successfully created alert for ${data.coin_id.toUpperCase()} at ${formatCurrency(data.target_price)}.`);
      setTargetPriceInput('');
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to create price alert.');
      setSuccessMsg(null);
    }
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiClient.delete(`/alerts/${alertId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete alert.');
    }
  });

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const price = parseFloat(targetPriceInput);
    if (isNaN(price) || price <= 0) {
      setErrorMsg('Please enter a valid target price greater than zero.');
      return;
    }

    createAlertMutation.mutate({
      coin_id: selectedCoinId,
      target_price: price,
      condition
    });
  };

  const activeAlerts = (alertsList || []).filter(a => !a.is_triggered);
  const triggeredAlerts = (alertsList || []).filter(a => a.is_triggered);
  const selectedCoinPrice = coinsList?.find(c => c.id === selectedCoinId)?.current_price || 0.0;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-brand-400" />
          Price Alerts Console
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Set targets for your cryptocurrencies and receive real-time banner alerts when conditions are triggered.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Create Price Alert Box */}
        <div className="glass-panel p-6 border-brand-500/10 lg:col-span-1 h-fit">
          <h3 className="text-sm font-extrabold uppercase text-slate-200 border-b border-dark-border/40 pb-3 mb-5">
            Create Price Alert
          </h3>

          <form onSubmit={handleCreateAlert} className="space-y-5 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl leading-normal">
                {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl leading-normal">
                {successMsg}
              </div>
            )}

            {/* Select Cryptocurrency */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-slate-500">Cryptocurrency</label>
              <select
                value={selectedCoinId}
                onChange={(e) => setSelectedCoinId(e.target.value)}
                className="input-field py-3 font-semibold cursor-pointer bg-dark-bg border-dark-border text-slate-100"
                required
              >
                {coinsList?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol.toUpperCase()})
                  </option>
                ))}
              </select>
              {selectedCoinPrice > 0 && (
                <div className="text-[10px] text-slate-400 font-semibold mt-1">
                  Current Price: <span className="font-mono text-slate-200">{formatCurrency(selectedCoinPrice)}</span>
                </div>
              )}
            </div>

            {/* Select Condition */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-slate-500">Trigger Condition</label>
              <div className="grid grid-cols-2 gap-2 bg-dark-bg border border-dark-border p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`py-2 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
                    condition === 'ABOVE'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Above (≥)
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`py-2 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
                    condition === 'BELOW'
                      ? 'bg-red-500/80 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Below (≤)
                </button>
              </div>
            </div>

            {/* Target price input */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold text-slate-500">Target Price (USD)</label>
              <input
                type="number"
                step="any"
                min="0.000001"
                placeholder="0.00"
                value={targetPriceInput}
                onChange={(e) => setTargetPriceInput(e.target.value)}
                className="input-field font-semibold font-mono text-slate-100 bg-dark-bg border-dark-border"
                required
              />
            </div>

            {/* Create submit action */}
            <button
              type="submit"
              disabled={createAlertMutation.isPending}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {createAlertMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Set Price Alert
            </button>
          </form>
        </div>

        {/* Right Side: Alerts lists tabs (Active + Triggered History) (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Alerts Panel */}
          <div className="glass-panel p-6 border-slate-800">
            <h3 className="text-sm font-extrabold uppercase text-slate-200 border-b border-dark-border/40 pb-3 mb-4 flex justify-between items-center">
              <span>Active Price Alerts</span>
              <span className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded font-mono font-bold">
                {activeAlerts.length} Pending
              </span>
            </h3>

            {isLoadingAlerts ? (
              <div className="py-12 text-center text-slate-500 text-xs animate-pulse">Loading active alerts...</div>
            ) : activeAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Bell className="w-7 h-7 mx-auto opacity-30 mb-2.5" />
                No active price alerts set. Use the left panel to configure targets.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border/40 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Coin</th>
                      <th className="py-2.5">Current Rate</th>
                      <th className="py-2.5">Condition</th>
                      <th className="py-2.5">Target Value</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/20 font-medium text-slate-300">
                    {activeAlerts.map((alert) => {
                      const coin = coinsList?.find(c => c.id === alert.coin_id);
                      return (
                        <tr key={alert.id} className="hover:bg-dark-card/20 transition-all">
                          <td className="py-3 flex items-center gap-2">
                            {coin && <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />}
                            <span className="font-bold text-slate-200 uppercase">{alert.coin_id}</span>
                          </td>
                          <td className="py-3 font-mono">
                            {coin ? formatCurrency(coin.current_price) : '—'}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              alert.condition === 'ABOVE' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {alert.condition === 'ABOVE' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {alert.condition}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-100 font-bold">
                            {formatCurrency(alert.target_price)}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => deleteAlertMutation.mutate(alert.id)}
                              className="p-1.5 bg-dark-bg hover:bg-red-500/10 border border-dark-border hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                              title="Delete Price Alert"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Triggered Alerts History Panel */}
          <div className="glass-panel p-6 border-slate-800">
            <h3 className="text-sm font-extrabold uppercase text-slate-200 border-b border-dark-border/40 pb-3 mb-4 flex justify-between items-center">
              <span>Triggered Alerts History</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                {triggeredAlerts.length} Triggered
              </span>
            </h3>

            {isLoadingAlerts ? (
              <div className="py-12 text-center text-slate-500 text-xs animate-pulse">Loading triggered history...</div>
            ) : triggeredAlerts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <Clock className="w-7 h-7 mx-auto opacity-30 mb-2.5" />
                No alert trigger events logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-dark-border/40 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Coin</th>
                      <th className="py-2.5">Target</th>
                      <th className="py-2.5">Condition</th>
                      <th className="py-2.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Triggered At
                      </th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/20 font-medium text-slate-400">
                    {triggeredAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-dark-card/25 transition-all">
                        <td className="py-3 uppercase font-bold text-slate-300">
                          {alert.coin_id}
                        </td>
                        <td className="py-3 font-mono text-slate-300">
                          {formatCurrency(alert.target_price)}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            alert.condition === 'ABOVE' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {alert.condition}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-400">
                          {new Date(alert.triggered_at).toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Triggered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Alerts;
