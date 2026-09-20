import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, UserAuthProfile } from '../services/authService';

interface AuthContextType {
  isLoading: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  authMethodUsed: 'pin' | 'password' | 'pattern' | null;
  userProfile: UserAuthProfile;
  loginWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPattern: (pattern: number[]) => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    name?: string;
    password?: string;
    pin?: string;
    pattern?: number[];
  }) => Promise<void>;
  logout: () => void;
  resetApp: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMethodUsed, setAuthMethodUsed] = useState<'pin' | 'password' | 'pattern' | null>(null);
  const [userProfile, setUserProfile] = useState<UserAuthProfile>({
    name: 'User',
    hasPin: false,
    hasPassword: false,
    hasPattern: false,
  });

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      const configured = await AuthService.isConfigured();
      const profile = await AuthService.getUserProfile();

      setIsConfigured(configured);
      setUserProfile(profile);
    } catch (err) {
      console.error('Error in refreshStatus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const loginWithPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    const valid = await AuthService.verifyPin(pin);
    if (valid) {
      setIsAuthenticated(true);
      setAuthMethodUsed('pin');
      return { success: true };
    }
    return { success: false, error: 'Incorrect PIN. Try again.' };
  };

  const loginWithPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const valid = await AuthService.verifyPassword(password);
    if (valid) {
      setIsAuthenticated(true);
      setAuthMethodUsed('password');
      return { success: true };
    }
    return { success: false, error: 'Incorrect password. Try again.' };
  };

  const loginWithPattern = async (pattern: number[]): Promise<{ success: boolean; error?: string }> => {
    if (pattern.length < 4) {
      return { success: false, error: 'Pattern must connect at least 4 dots.' };
    }
    const valid = await AuthService.verifyPattern(pattern);
    if (valid) {
      setIsAuthenticated(true);
      setAuthMethodUsed('pattern');
      return { success: true };
    }
    return { success: false, error: 'Incorrect pattern. Try again.' };
  };

  const register = async (params: {
    name?: string;
    password?: string;
    pin?: string;
    pattern?: number[];
  }): Promise<void> => {
    await AuthService.registerCredentials(params);
    await refreshStatus();
    setIsAuthenticated(true);
    setAuthMethodUsed('pattern');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthMethodUsed(null);
  };

  const resetApp = async () => {
    await AuthService.resetAll();
    setIsAuthenticated(false);
    setAuthMethodUsed(null);
    await refreshStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isConfigured,
        isAuthenticated,
        authMethodUsed,
        userProfile,
        loginWithPin,
        loginWithPassword,
        loginWithPattern,
        register,
        logout,
        resetApp,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
