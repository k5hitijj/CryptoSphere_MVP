import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Wallet,
  Settings,
  LogOut,
  Sparkles,
  LineChart,
  Bell,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen }) => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Markets', to: '/markets', icon: TrendingUp },
    { name: 'Portfolio', to: '/portfolio', icon: Briefcase },
    { name: 'Wallet', to: '/wallet', icon: Wallet },
    { name: 'Analytics Terminal', to: '/terminal', icon: LineChart },
    { name: 'Price Alerts', to: '/alerts', icon: Bell },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const content = (
    <div className="w-64 h-full bg-[#0d1321]/95 backdrop-blur-xl border-r border-dark-border flex flex-col">
      {/* Brand Logo Header */}
      <div className="h-20 border-b border-dark-border flex items-center justify-between px-6 gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CryptoSphere
            </h1>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Private Platform
            </span>
          </div>
        </div>
        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 hover:bg-dark-border/40 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-dark-border/40'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User Information Profile & Logout */}
      <div className="p-4 border-t border-dark-border bg-dark-bg/20 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full border-2 border-dark-border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white uppercase shadow-inner">
              {user?.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/25 hover:border-red-500 text-red-400 text-sm font-semibold rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex w-64 h-screen fixed left-0 top-0 bg-dark-card/40 backdrop-blur-xl border-r border-dark-border flex-col z-30">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setMobileOpen && setMobileOpen(false)}></div>
          <aside className="relative animate-slide-in flex h-full z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};
export default Sidebar;
