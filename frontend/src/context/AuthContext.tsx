import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check active session on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await apiClient.get<User>('/auth/me');
        setUser(response.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const loginWithGoogle = async (token: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ user: User; access_token: string }>('/auth/google', { token });
      const { user: userProfile, access_token } = response.data;
      
      // Store token locally as bearer fallback
      localStorage.setItem('access_token', access_token);
      setUser(userProfile);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      setLoading(false);
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
