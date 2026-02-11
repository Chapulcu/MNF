'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getSession as apiGetSession, AuthPlayer } from '@/lib/api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  currentPlayer: AuthPlayer | null;
  isAdmin: boolean;
  loading: boolean;
  login: (playerId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<AuthPlayer | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      setLoading(true);
      const data = await apiGetSession();

      setIsAuthenticated(data.authenticated);
      setCurrentPlayer(data.player || null);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setIsAuthenticated(false);
      setCurrentPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (playerId: string, password: string) => {
    try {
      const data = await apiLogin(playerId, password);

      if (data.success) {
        setIsAuthenticated(true);
        setCurrentPlayer(data.player || null);
      }

      return data;
    } catch (error) {
      return { success: false, error: 'Giriş yapılırken hata oluştu' };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setIsAuthenticated(false);
      setCurrentPlayer(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentPlayer,
        isAdmin: currentPlayer?.isAdmin || false,
        loading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
