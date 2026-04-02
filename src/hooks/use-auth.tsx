'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  isSuperAdmin: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For demo purposes, we'll use localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pf_access_token',
  REFRESH_TOKEN: 'pf_refresh_token',
  USER: 'pf_user',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (storedToken && storedUser) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      const { user: userData, accessToken: token, refreshToken } = data.data;
      
      setUser(userData);
      setAccessToken(token);
      
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [accessToken]);

  const hasRole = useCallback((role: string) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.roles.includes(role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
    }}>
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

/**
 * Demo login function - bypasses API for development.
 * Call this directly when no DB is configured.
 */
export function useDemoAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const demoLogin = useCallback(() => {
    const demoUser: User = {
      id: 'demo-user-001',
      name: 'Carlos Mendes',
      email: 'carlos@campanha.com',
      avatar: undefined,
      roles: ['tenant_admin'],
      isSuperAdmin: false,
      tenant: {
        id: 'demo-tenant-001',
        name: 'Campanha Prefeito 2026',
        slug: 'campanha-prefeito-2026',
      },
    };

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'demo-token');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
    window.location.href = '/dashboard';
  }, []);

  return { user, isAuthenticated, isLoading, demoLogin };
}
