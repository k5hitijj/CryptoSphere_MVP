import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { apiClient } from '../../services/api';
import { Bell, AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [toasts, setToasts] = useState<any[]>([]);

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
    <div className="min-h-screen bg-dark-bg flex relative">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col overflow-x-hidden">
        {/* Dynamic Inner Views */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Floating Notifications Toast Portal overlay */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none w-80">
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
