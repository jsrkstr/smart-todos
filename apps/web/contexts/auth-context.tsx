"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  isChecking: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const AuthContext = createContext<AuthContextType>({ 
  isAuthenticated: false,
  isChecking: true,
  user: null,
  login: async () => { throw new Error('AuthContext not initialized') },
  loginWithProvider: async () => { throw new Error('AuthContext not initialized') },
  logout: async () => { throw new Error('AuthContext not initialized') }
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!window.localStorage.getItem('isAuthenticated'));
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.isAuthenticated);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Login with provider (Google, Telegram, etc.)
  const loginWithProvider = async (provider: string) => {
    try {
      // Redirect to provider auth endpoint
      if (provider.toLowerCase() === 'google') {
        window.location.href = '/api/auth/google';
      } else if (provider.toLowerCase() === 'telegram') {
        window.location.href = '/api/auth/telegram';
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      throw error;
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };
  
  const contextValue = {
    isAuthenticated,
    isChecking,
    user,
    login,
    loginWithProvider,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
} 