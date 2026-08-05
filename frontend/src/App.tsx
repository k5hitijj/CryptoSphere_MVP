import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Portfolio from './pages/Portfolio';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import Terminal from './pages/Terminal';
import Alerts from './pages/Alerts';
import NotFound from './pages/NotFound';

// Setup TanStack QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Portal Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="markets" element={<Markets />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="settings" element={<Settings />} />
              <Route path="terminal" element={<Terminal />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
