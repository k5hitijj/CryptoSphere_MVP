import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { WalletSummaryResponse } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Building2,
  Plus,
  Trash2,
  Lock,
  Loader2,
  ArrowRight,
  ArrowRightLeft,
  Send,
  Users
} from 'lucide-react';

export const Wallet: React.FC = () => {
  const queryClient = useQueryClient();
  const [actionType, setActionType] = useState<'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'>('DEPOSIT');
  const [amountInput, setAmountInput] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [transferAssetType, setTransferAssetType] = useState<string>('USD');
  const [txReceipt, setTxReceipt] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Plaid bank linking states
  const [showPlaidModal, setShowPlaidModal] = useState<boolean>(false);
  const [plaidStep, setPlaidStep] = useState<'SELECT_BANK' | 'SIGN_IN' | 'ENTER_DETAILS' | 'LINKING' | 'SUCCESS'>('SELECT_BANK');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [routingCode, setRoutingCode] = useState<string>('');
  const [fakeLast4, setFakeLast4] = useState<string>('');

  // Fetch virtual wallet cash summary
  const { data: wallet, isLoading } = useQuery<WalletSummaryResponse>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get<WalletSummaryResponse>('/wallet');
      return response.data;
    },
  });

  // Fetch other registered users for transfer selection
  const { data: otherUsers } = useQuery<any[]>({
    queryKey: ['otherUsers'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/auth/users');
      return response.data;
    },
    enabled: actionType === 'TRANSFER',
  });

  // Fetch user portfolio to know what assets they can transfer
  const { data: portfolio } = useQuery<any>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await apiClient.get<any>('/portfolio');
      return response.data;
    },
    enabled: actionType === 'TRANSFER',
  });

  // Funding operation mutation
  const fundingMutation = useMutation({
    mutationFn: async (payload: { amount: number; type: 'DEPOSIT' | 'WITHDRAW' }) => {
      const endpoint = payload.type === 'DEPOSIT' ? '/wallet/deposit' : '/wallet/withdraw';
      const response = await apiClient.post(endpoint, {
        amount: payload.amount
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      setTxReceipt(data);
      setAmountInput('');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Funding operation failed.');
    }
  });

  // P2P Asset Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: async (payload: { recipient_email: string; asset_type: string; amount: number }) => {
      const response = await apiClient.post('/portfolio/transfer', payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      setTxReceipt({
        message: data.message,
        cash_balance: data.cash_balance
      });
      setAmountInput('');
      setRecipientEmail('');
      setTransferAssetType('USD');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Asset transfer failed.');
    }
  });

  // Bank Link Mutation
  const linkBankMutation = useMutation({
    mutationFn: async (payload: { 
      bank_name: string; 
      account_holder_name: string; 
      account_number: string; 
      routing_code: string; 
    }) => {
      const response = await apiClient.post('/wallet/link-bank', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setShowPlaidModal(false);
      setPlaidStep('SELECT_BANK');
      setSelectedBank('');
      setUsername('');
      setPassword('');
      setAccountHolderName('');
      setAccountNumber('');
      setRoutingCode('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to link bank account.');
    }
  });

  // Bank Unlink Mutation
  const unlinkBankMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/wallet/unlink-bank');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to unlink bank account.');
    }
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }

    if (actionType === 'TRANSFER') {
      if (!recipientEmail) {
        setErrorMsg('Please select or enter a recipient email.');
        return;
      }
      transferMutation.mutate({
        recipient_email: recipientEmail,
        asset_type: transferAssetType,
        amount
      });
    } else {
      fundingMutation.mutate({
        amount,
        type: actionType
      });
    }
  };

  const loadPreset = (amount: number) => {
    setAmountInput(amount.toString());
    setErrorMsg(null);
  };

  // Trigger simulated Plaid credentials checking
  const handlePlaidLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setPlaidStep('ENTER_DETAILS');
  };

  // Trigger simulated Account validation
  const handlePlaidDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName || !accountNumber || !routingCode) return;

    setPlaidStep('LINKING');
    const last4 = accountNumber.slice(-4);
    setFakeLast4(last4);

    setTimeout(() => {
      setPlaidStep('SUCCESS');
    }, 2200);
  };

  const handleConfirmPlaidDone = () => {
    linkBankMutation.mutate({
      bank_name: selectedBank,
      account_holder_name: accountHolderName,
      account_number: accountNumber,
      routing_code: routingCode
    });
  };

  const popularBanks = [
    { name: 'HSBC' },
    { name: 'AXIS BANK' },
    { name: 'IDFC BANK' },
    { name: 'HDFC BANK' }
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">Fiat Funding & P2P Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Deposit cash balances or transfer funds/holdings to other whitelisted users.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Cash Display + Bank Linking Status Card */}
        <div className="space-y-6 md:col-span-1">
          
          {/* Cash Balance Display Card */}
          <div className="glass-panel p-6 border-brand-500/10 flex flex-col justify-between h-48 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-emerald-500"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Available Cash
              </span>
              {isLoading ? (
                <div className="w-1/2 h-10 bg-dark-border/40 animate-pulse rounded-lg mt-2"></div>
              ) : (
                <h3 className="text-3xl font-extrabold text-white font-mono mt-2">
                  {formatCurrency(wallet?.cash_balance || 0.0)}
                </h3>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              100% Virtual Balance Sheet Sandbox
            </span>
          </div>

          {/* Linked Bank Card */}
          <div className="glass-panel p-6 border-slate-800 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
            {wallet?.linked_bank ? (
              // If bank is linked
              <div className="flex flex-col justify-between h-full flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                      Linked Bank Account
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5 mt-2.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      {wallet.linked_bank.bank_name}
                    </h4>
                    <div className="mt-2 space-y-1 text-[10px] text-slate-400 font-mono">
                      <div>Holder: <span className="text-slate-300 font-semibold">{wallet.linked_bank.account_holder_name}</span></div>
                      <div>Routing / SWIFT: <span className="text-slate-300 font-semibold">{wallet.linked_bank.routing_code}</span></div>
                      <div>Checking: <span className="text-slate-300 font-semibold">•••• {wallet.linked_bank.account_last4}</span></div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Connected
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-dark-border/40 pt-4">
                  <span className="text-[9px] text-slate-500">
                    Linked internationally
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to disconnect your bank account?')) {
                        unlinkBankMutation.mutate();
                      }
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 font-extrabold flex items-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              // If no bank is linked
              <div className="flex flex-col justify-between h-full flex-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Bank Account Link
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Connect an authorized international bank account via simulated Plaid verification to unlock instant fiat operations.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setPlaidStep('SELECT_BANK');
                    setShowPlaidModal(true);
                  }}
                  className="mt-6 w-full py-2.5 bg-dark-bg hover:bg-dark-border/40 border border-dark-border hover:border-brand-500 text-xs text-slate-200 hover:text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4 text-brand-400" />
                  Connect Bank Account
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Action Panel Forms */}
        <div className="glass-panel p-6 md:col-span-2 border-slate-800 relative">
          {txReceipt ? (
            /* Success confirmation box */
            <div className="text-center py-6 space-y-4 animate-scale-up">
              <CheckCircle className="w-14 h-14 text-crypto-green mx-auto" />
              <h3 className="text-lg font-bold text-white">Transaction Completed Successfully</h3>

              <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl text-left text-xs font-mono max-w-md mx-auto space-y-2">
                <p className="text-slate-300">{txReceipt.message}</p>
                {txReceipt.cash_balance !== undefined && (
                  <div className="flex justify-between border-t border-dark-border/40 pt-2 font-bold">
                    <span className="text-slate-500">Remaining Cash Balance:</span>
                    <span className="text-white">{formatCurrency(txReceipt.cash_balance)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setTxReceipt(null)}
                className="btn-primary px-6"
              >
                Perform another transaction
              </button>
            </div>
          ) : (
            <form onSubmit={handleActionSubmit} className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4 border-b border-dark-border/60 pb-3">
                <span className="text-sm font-extrabold text-slate-200">Execute Transaction</span>

                {/* Switch Action Tab Buttons */}
                <div className="flex gap-1 bg-dark-bg border border-dark-border p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setActionType('DEPOSIT'); setErrorMsg(null); }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${actionType === 'DEPOSIT'
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 inline mr-1" />
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionType('WITHDRAW'); setErrorMsg(null); }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${actionType === 'WITHDRAW'
                        ? 'bg-red-500/80 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActionType('TRANSFER'); setErrorMsg(null); }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${actionType === 'TRANSFER'
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" />
                    P2P Transfer
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              {actionType === 'TRANSFER' ? (
                /* ================= P2P TRANSFER VIEW ================= */
                <div className="space-y-4">
                  {/* Recipient User Select Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Recipient Whitelisted User
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="input-field py-3 font-semibold text-xs cursor-pointer bg-dark-bg border-dark-border text-slate-100 flex-1"
                        required
                      >
                        <option value="">Select Recipient...</option>
                        {otherUsers && otherUsers.map((u: any) => (
                          <option key={u.email} value={u.email}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                        <option value="custom">-- Enter Email Manually --</option>
                      </select>
                    </div>

                    {recipientEmail === 'custom' || (!otherUsers || otherUsers.length === 0) ? (
                      <input
                        type="email"
                        placeholder="recipient@example.com"
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="input-field mt-2 text-xs font-semibold"
                        required
                      />
                    ) : null}
                  </div>

                  {/* Asset Select Dropdown */}
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase font-bold text-slate-500">Asset to Transfer</label>
                    <select
                      value={transferAssetType}
                      onChange={(e) => setTransferAssetType(e.target.value)}
                      className="input-field py-3 font-semibold text-xs cursor-pointer bg-dark-bg border-dark-border text-slate-100"
                      required
                    >
                      <option value="USD">USD Cash Balance</option>
                      {portfolio?.holdings?.map((h: any) => (
                        <option key={h.coin_id} value={h.coin_id}>
                          {h.symbol.toUpperCase()} ({h.coin_id}) - Held: {h.quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* ================= DEPOSIT/WITHDRAW METHOD DETAILS ================= */
                <div className="space-y-2">
                  <label className="text-[11px] uppercase font-bold text-slate-500">
                    {actionType === 'DEPOSIT' ? 'Deposit Method' : 'Withdrawal Destination'}
                  </label>
                  <div className="p-3.5 bg-dark-bg/60 border border-dark-border rounded-xl flex items-center justify-between text-xs">
                    {wallet?.linked_bank ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-slate-200 font-bold block">{wallet.linked_bank.bank_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Checking (•••• {wallet.linked_bank.account_last4})</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="text-slate-400 block font-medium">Standard Wire Sandbox</span>
                          <span className="text-[9px] text-slate-500">No bank linked yet</span>
                        </div>
                      </div>
                    )}
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-500 bg-dark-border px-2 py-1 rounded">
                      Instant Clearing
                    </span>
                  </div>
                </div>
              )}

              {/* Amount/Quantity input box */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold text-slate-500">
                  {actionType === 'TRANSFER' && transferAssetType !== 'USD' ? 'Asset Quantity' : 'USD Amount'}
                </label>
                <div className="relative">
                  {transferAssetType === 'USD' || actionType !== 'TRANSFER' ? (
                    <DollarSign className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                  ) : (
                    <ArrowRightLeft className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                  )}
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => { setAmountInput(e.target.value); setErrorMsg(null); }}
                    className="input-field pl-12 font-semibold font-mono text-slate-100"
                    required
                  />
                </div>
              </div>

              {/* Presets (Only show for Cash operations) */}
              {(transferAssetType === 'USD' || actionType !== 'TRANSFER') && (
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Quick Presets</span>
                  <div className="flex gap-2">
                    {[10000, 50000, 100000].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => loadPreset(amount)}
                        className="px-3.5 py-2 bg-dark-bg hover:bg-dark-border/40 border border-dark-border text-xs text-slate-300 font-bold rounded-xl transition-all"
                      >
                        +{formatCurrency(amount).replace('.00', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Submit */}
              <button
                type="submit"
                disabled={fundingMutation.isPending || transferMutation.isPending}
                className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
                  actionType === 'DEPOSIT'
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10'
                    : actionType === 'WITHDRAW'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                    : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/10'
                } disabled:opacity-50`}
              >
                {(fundingMutation.isPending || transferMutation.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                )}
                {actionType === 'DEPOSIT' && 'Confirm Deposit'}
                {actionType === 'WITHDRAW' && 'Confirm Withdrawal'}
                {actionType === 'TRANSFER' && (
                  <>
                    <Send className="w-4 h-4" />
                    Send P2P Transfer
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Info notice box */}
      <div className="p-4 bg-dark-card/30 border border-dark-border rounded-2xl flex gap-3 text-xs text-slate-400 leading-relaxed max-w-xl">
        <HelpCircle className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
        {actionType === 'TRANSFER' ? (
          <div>
            <span className="font-semibold block mb-0.5 text-slate-200">Simulated P2P Transfer Notice:</span>
            Transfers credit another whitelisted user's account instantly inside the local database ledger. Ensure the recipient has logged in at least once so their account profile and virtual wallet exist.
          </div>
        ) : (
          <div>
            <span className="font-semibold block mb-0.5 text-slate-200">Virtual Ledger Notice:</span>
            Deposits and withdrawals inside this portal do not interact with any bank accounts, cards, or credit bureaus. They are mock updates to your database profile cash balance, allowing for offline paper trading experiments.
          </div>
        )}
      </div>

      {/* Plaid Link Modal Interface Simulator (Plaid Signature Minimalist Theme) */}
      {showPlaidModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] text-[#111827] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[480px] border border-[#E5E7EB]">
            
            {/* Plaid Header */}
            <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-black font-mono">
                  plaid
                </span>
                <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                  SANDBOX
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowPlaidModal(false)}
                className="text-[#6B7280] hover:text-[#111827] font-semibold text-xs transition-all"
              >
                Cancel
              </button>
            </div>

            {/* Plaid content viewport based on steps */}
            <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
              
              {plaidStep === 'SELECT_BANK' && (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">Link your Bank Account</h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Choose an international, crypto-supporting banking group below:
                    </p>

                    {/* Popular banks grid */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      {popularBanks.map((bank) => (
                        <button
                          key={bank.name}
                          type="button"
                          onClick={() => {
                            setSelectedBank(bank.name);
                            setPlaidStep('SIGN_IN');
                          }}
                          className="p-3 border border-[#E5E7EB] hover:border-black rounded-xl text-left font-bold text-xs flex flex-col justify-between min-h-[75px] transition-all bg-[#FAFBFB] hover:bg-white text-[#111827]"
                        >
                          <Building2 className="w-4 h-4 text-[#4B5563]" />
                          <span>{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF] justify-center mt-6 border-t border-[#F3F4F6] pt-4">
                    <Lock className="w-3.5 h-3.5" />
                    Secure bank connection powered by Plaid
                  </div>
                </div>
              )}

              {plaidStep === 'SIGN_IN' && (
                <form onSubmit={handlePlaidLoginSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#6B7280] block">Logging in to</span>
                      <h3 className="text-base font-extrabold text-[#111827] mt-0.5">{selectedBank}</h3>
                    </div>

                    <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] rounded-xl text-[11px] leading-normal">
                      <strong>Sandbox Credentials:</strong> Enter any random user login credentials.
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Username / ID</label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Your bank username"
                          className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-lg text-xs outline-none focus:border-black bg-white text-[#111827]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-lg text-xs outline-none focus:border-black bg-white text-[#111827]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#F3F4F6] pt-4">
                    <button
                      type="button"
                      onClick={() => setPlaidStep('SELECT_BANK')}
                      className="px-4 py-2.5 text-xs text-[#4B5563] font-bold hover:text-black transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                    >
                      Next
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {plaidStep === 'ENTER_DETAILS' && (
                <form onSubmit={handlePlaidDetailsSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#6B7280] block">Verification Details</span>
                      <h3 className="text-base font-extrabold text-[#111827] mt-0.5">{selectedBank} Transaction Link</h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Account Holder Name</label>
                        <input
                          type="text"
                          required
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-lg text-xs outline-none focus:border-black bg-white text-[#111827]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Account Number</label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="e.g. 12098485231"
                          className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-lg text-xs outline-none focus:border-black bg-white text-[#111827]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Routing / SWIFT / IFSC Code</label>
                        <input
                          type="text"
                          required
                          value={routingCode}
                          onChange={(e) => setRoutingCode(e.target.value)}
                          placeholder="e.g. BARCGB22XXX or CITIGB2L"
                          className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-lg text-xs outline-none focus:border-black bg-white text-[#111827]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#F3F4F6] pt-4">
                    <button
                      type="button"
                      onClick={() => setPlaidStep('SIGN_IN')}
                      className="px-4 py-2.5 text-xs text-[#4B5563] font-bold hover:text-black transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                    >
                      Verify details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {plaidStep === 'LINKING' && (
                <div className="flex flex-col items-center justify-center flex-1 py-10 space-y-4">
                  <Loader2 className="w-12 h-12 text-[#111827] animate-spin" />
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-[#111827]">Verifying and connecting bank...</h3>
                    <p className="text-xs text-[#6B7280]">Running ledger handshake on {selectedBank} gateway...</p>
                  </div>
                </div>
              )}

              {plaidStep === 'SUCCESS' && (
                <div className="flex flex-col justify-between flex-1">
                  <div className="flex flex-col items-center justify-center flex-1 py-6 space-y-4">
                    <div className="w-14 h-14 bg-[#ECFDF5] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-[#059669]" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-[#111827]">Connection Verified</h3>
                      <p className="text-xs text-[#6B7280]">
                        Linked checking account ending in <strong className="font-mono text-black font-bold">•••• {fakeLast4}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmPlaidDone}
                    disabled={linkBankMutation.isPending}
                    className="w-full py-3.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow"
                  >
                    {linkBankMutation.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    )}
                    Authorize & Done
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Wallet;
