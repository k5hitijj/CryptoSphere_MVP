import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Sparkles, Terminal, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import { apiClient } from '../services/api';

declare global {
  interface Window {
    google?: any;
    handleCredentialResponse?: (response: any) => void;
  }
}

export const Login: React.FC = () => {
  const { user, loginWithGoogle, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDevPanel, setShowDevPanel] = useState<boolean>(true);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch google client id from backend dynamically
    const fetchConfig = async () => {
      try {
        const response = await apiClient.get<{ google_client_id: string }>('/auth/config');
        console.log("Backend auth config response:", response.data);
        if (response.data.google_client_id) {
          setGoogleClientId(response.data.google_client_id);
        } else {
          console.warn("Backend returned an empty Google Client ID. Check your backend env variables.");
        }
      } catch (err) {
        console.error("Failed to load auth config from backend:", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    console.log("Checking Google Sign-In state. Client ID:", googleClientId, "window.google:", !!window.google);
    if (!googleClientId) return;

    // Define the global callback for Google OAuth response
    window.handleCredentialResponse = async (response: any) => {
      setIsLoading(true);
      setError(null);
      try {
        await loginWithGoogle(response.credential);
      } catch (err: any) {
        console.error(err);
        setError(
          err.response?.data?.detail || 'Authentication failed. Are you authorized?'
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize Google Sign-In with safe script load check polling
    const renderGoogleButton = () => {
      if (window.google && window.google.accounts) {
        console.log("Google accounts library loaded. Initializing button...");
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: window.handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'dark', size: 'large', width: '320' }
        );
        return true;
      }
      return false;
    };

    if (!renderGoogleButton()) {
      const interval = setInterval(() => {
        if (renderGoogleButton()) {
          clearInterval(interval);
        }
      }, 250);
      return () => clearInterval(interval);
    }
  }, [googleClientId, loginWithGoogle]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleMockLogin = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle(`mock_token_${email}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Mock Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] -top-20 -left-20 animate-pulse-slow"></div>
      <div className="absolute w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] -bottom-20 -right-20"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-brand-600 to-emerald-500 rounded-2xl shadow-xl shadow-brand-500/10 mb-2">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            CryptoSphere
          </h2>
          <p className="text-sm text-slate-400">
            Private Market Intelligence & Portfolio Management
          </p>
        </div>

        {/* Auth Panel Box */}
        <div className="glass-panel p-8 relative overflow-hidden border-slate-800/80">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>

          <h3 className="text-xl font-semibold text-slate-100 mb-6 text-center">
            Authorized Account Login
          </h3>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2.5 mb-6 animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Sign-In Button Container */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div id="google-signin-btn" className="w-full flex justify-center"></div>

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <div className="w-4 h-4 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
                Verifying authorized access...
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-dark-border/60 text-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Google OAuth Authentication Only
            </span>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3 text-xs text-amber-500/90 leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Access Restriction:</span>
            Only pre-authorized administrator and investor accounts can gain session access. Public registration is permanently closed for this instance.
          </div>
        </div>

        {/* Sandbox Mock Developer Login Panel */}
        {showDevPanel && (
          <div className="glass-panel p-6 border-brand-500/10 bg-brand-500/[0.01]">
            <div className="flex items-center justify-between border-b border-dark-border/60 pb-3 mb-4">
              <span className="text-xs font-semibold text-brand-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                Developer Sandbox Bypass
              </span>
              <span className="text-[9px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded font-mono">
                Local Testing
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Use these whitelisted accounts to skip the Google login requirement for demo verification:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {['user1@example.com', 'user2@example.com', 'user3@example.com', 'user4@example.com'].map((email, idx) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => handleMockLogin(email)}
                  disabled={isLoading}
                  className="px-3 py-2 bg-dark-card hover:bg-brand-500/10 border border-dark-border hover:border-brand-500/30 rounded-lg text-[11px] text-slate-300 hover:text-brand-400 transition-all duration-150 flex items-center justify-between text-left"
                >
                  <span className="truncate">{email}</span>
                  <UserCheck className="w-3 h-3 flex-shrink-0 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
