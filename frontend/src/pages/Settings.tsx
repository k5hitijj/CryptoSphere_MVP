import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { UserSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Palette, 
  DollarSign, 
  Bell, 
  CheckCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch settings from DB
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiClient.get<UserSettings>('/settings');
      return response.data;
    },
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: Partial<UserSettings>) => {
      const response = await apiClient.patch('/settings', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
  });

  const handleFieldChange = (field: keyof UserSettings | 'notifications', value: any) => {
    if (!settings) return;
    
    if (field === 'notifications') {
      updateSettingsMutation.mutate({
        notifications: {
          ...settings.notifications,
          ...value
        }
      });
    } else {
      updateSettingsMutation.mutate({
        [field]: value
      });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">System Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Configure profile preferences, styling, and notification logs.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Whitelisted Profile Card */}
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row items-center gap-4 bg-dark-card/30">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border border-dark-border" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white uppercase text-xl">
            {user?.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h3 className="text-lg font-bold text-slate-200">{user?.name}</h3>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-1.5 mt-2">
            <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Authorized Investor
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Live Whitelist
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-dark-card/50 rounded-2xl border border-dark-border"></div>
          <div className="h-28 bg-dark-card/50 rounded-2xl border border-dark-border"></div>
        </div>
      ) : settings ? (
        <div className="space-y-6">
          {/* Theme Preferences */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-400" />
              Display Theme
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select your interface color scheme. This MVP is styled for visual dark slate performance.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['dark', 'light', 'system'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleFieldChange('theme', t)}
                  className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                    settings.theme === t 
                      ? 'bg-brand-500 border-brand-500 text-white shadow shadow-brand-500/20' 
                      : 'bg-dark-bg/60 border-dark-border text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Currency preferences */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Base Valuation Currency
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose the default currency for portfolio valuation summaries and market rates.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['USD', 'EUR', 'GBP'].map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => handleFieldChange('currency', curr)}
                  className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                    settings.currency === curr 
                      ? 'bg-brand-500 border-brand-500 text-white shadow shadow-brand-500/20' 
                      : 'bg-dark-bg/60 border-dark-border text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Alerts Settings */}
          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-400" />
              Security & Alerts Configuration
            </h4>
            
            <div className="space-y-3.5 divide-y divide-dark-border/40 text-xs">
              <div className="flex justify-between items-center py-2.5">
                <div>
                  <span className="font-bold text-slate-300 block">Target Price Alerts</span>
                  <span className="text-[10px] text-slate-500">Enable background target hits notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.price_alerts}
                  onChange={(e) => handleFieldChange('notifications', { price_alerts: e.target.checked })}
                  className="w-4.5 h-4.5 cursor-pointer accent-brand-500 bg-dark-bg border border-dark-border"
                />
              </div>

              <div className="flex justify-between items-center py-3.5">
                <div>
                  <span className="font-bold text-slate-300 block">Weekly Digest reports</span>
                  <span className="text-[10px] text-slate-500">Receive portfolio yield performance logs</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.weekly_digest}
                  onChange={(e) => handleFieldChange('notifications', { weekly_digest: e.target.checked })}
                  className="w-4.5 h-4.5 cursor-pointer accent-brand-500 bg-dark-bg border border-dark-border"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default Settings;
