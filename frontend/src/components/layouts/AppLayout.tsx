import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { apiClient } from '../../services/api';
import { Bell, Menu, Sparkles } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [toasts, setToasts] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkNotifications = async () => {
      try {
        const response = await apiClient.get<any[]>('/alerts/notifications');
        if (response.data && response.data.length > 0) {
          response.data.forEach((notification) => {
            const toastId = Math.random().toString();
            // Append toast
            setToasts((prev) => [...prev, { ...notification, toastId }]);
            
            // Auto dismiss toast after 8 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
            }, 8000);
          });
        }
      } catch (e) {
        console.error('Error polling alerts notification triggers:', e);
      }
    };

    // Poll every 15 seconds
    const interval = setInterval(checkNotifications, 15000);
    // Run once on load
    checkNotifications();

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 animate-pulse">CS</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col lg:flex-row relative">
      
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden h-16 bg-dark-card/60 backdrop-blur-xl border-b border-dark-border flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">CryptoSphere</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 hover:bg-dark-border/40 rounded-lg text-slate-300 hover:text-white transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Navigation Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 pt-20 lg:pt-0 min-h-screen flex flex-col overflow-x-hidden">
        {/* Dynamic Inner Views */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Floating Notifications Toast Portal overlay */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none w-80 max-w-[calc(100vw-3rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.toastId}
            className="pointer-events-auto w-full bg-dark-card/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.15)] p-4 rounded-xl flex gap-3 animate-slide-in relative"
          >
            <div className="w-9 h-9 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 flex-shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">
                  Price Target Hit
                </span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId))}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold font-mono transition-all"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                <strong className="text-white uppercase">{toast.coin_id}</strong> has crossed your target price of{' '}
                <strong className="text-amber-300 font-mono font-bold">${toast.target_price.toLocaleString()}</strong> ({toast.condition}).
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppLayout;
