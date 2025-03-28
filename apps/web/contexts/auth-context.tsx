"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: string) => Promise<void>;
  logout: () => void;
}

const AUTH_TOKEN_KEY = "auth-token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(!!token);
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    // In a real app, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set auth token in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, "mock-auth-token");
    setIsAuthenticated(true);
  };
  
  // Login with provider (Google, Telegram, etc.)
  const loginWithProvider = async (provider: string) => {
    // In a real app, this would initiate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set auth token in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, `mock-auth-token-${provider.toLowerCase()}`);
    setIsAuthenticated(true);
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
    router.push("/login");
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        loginWithProvider,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 