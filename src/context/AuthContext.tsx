import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, BiometricStatus } from '../services/authService';

interface UserProfile {
  name: string;
  hasPin: boolean;
  hasPassword: boolean;
  biometricEnabled: boolean;
}

interface AuthContextType {
  isLoading: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  authMethodUsed: 'pin' | 'password' | 'biometric' | null;
  biometricStatus: BiometricStatus;
  userProfile: UserProfile;
  loginWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithBiometrics: () => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    name?: string;
    password?: string;
    pin?: string;
    enableBiometrics?: boolean;
  }) => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  logout: () => void;
  resetApp: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMethodUsed, setAuthMethodUsed] = useState<'pin' | 'password' | 'biometric' | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    hasHardware: false,
    isEnrolled: false,
    supportedTypes: [],
    primaryType: 'none',
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    hasPin: false,
    hasPassword: false,
    biometricEnabled: false,
  });

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      const configured = await AuthService.isConfigured();
      const bioStatus = await AuthService.checkBiometricStatus();
      const profile = await AuthService.getUserProfile();

      setIsConfigured(configured);
      setBiometricStatus(bioStatus);
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
    return { success: false, error: 'Incorrect PIN. Please try again.' };
  };

  const loginWithPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const valid = await AuthService.verifyPassword(password);
    if (valid) {
      setIsAuthenticated(true);
      setAuthMethodUsed('password');
      return { success: true };
    }
    return { success: false, error: 'Incorrect Password. Please try again.' };
  };

  const loginWithBiometrics = async (): Promise<{ success: boolean; error?: string }> => {
    // If device doesn't have biometric hardware or not enrolled, return descriptive error
    if (!biometricStatus.hasHardware) {
      return {
        success: false,
        error: 'Biometric hardware is not available on this device.',
      };
    }
    if (!biometricStatus.isEnrolled) {
      return {
        success: false,
        error: 'No biometric credentials enrolled. Please enroll in device settings.',
      };
    }

    const result = await AuthService.authenticateWithBiometrics('Unlock Mobile App');
    if (result.success) {
      setIsAuthenticated(true);
      setAuthMethodUsed('biometric');
      return { success: true };
    }
    return { success: false, error: result.error || 'Biometric authentication failed.' };
  };

  const register = async (params: {
    name?: string;
    password?: string;
    pin?: string;
    enableBiometrics?: boolean;
  }): Promise<void> => {
    await AuthService.registerCredentials(params);
    await refreshStatus();
    setIsAuthenticated(true);
    setAuthMethodUsed('password');
  };

  const toggleBiometrics = async (enabled: boolean): Promise<void> => {
    await AuthService.setBiometricEnabled(enabled);
    setUserProfile((prev) => ({ ...prev, biometricEnabled: enabled }));
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
        biometricStatus,
        userProfile,
        loginWithPin,
        loginWithPassword,
        loginWithBiometrics,
        register,
        toggleBiometrics,
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
