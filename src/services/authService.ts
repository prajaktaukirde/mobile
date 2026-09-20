import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  USER_PIN_HASH: 'auth_user_pin_hash',
  USER_PASSWORD_HASH: 'auth_user_password_hash',
  BIOMETRIC_ENABLED: 'auth_biometric_enabled',
  IS_CONFIGURED: 'auth_is_configured',
  USER_NAME: 'auth_user_name',
};

// Web fallback memory store if SecureStore is not supported on web
const memoryStore: Record<string, string> = {};

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // ignore web storage error
    }
    memoryStore[key] = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // ignore web storage error
    }
    return memoryStore[key] || null;
  }
  return await SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // ignore
    }
    delete memoryStore[key];
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  primaryType: 'face' | 'fingerprint' | 'iris' | 'none';
}

export class AuthService {
  /**
   * Hashes plain text using SHA-256 with a salt
   */
  static async hashValue(value: string): Promise<string> {
    const salt = 'mobile_auth_secure_salt_v1';
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${value}`
    );
  }

  /**
   * Checks device biometric capabilities
   */
  static async checkBiometricStatus(): Promise<BiometricStatus> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const supportedTypes: string[] = [];
      let primaryType: 'face' | 'fingerprint' | 'iris' | 'none' = 'none';

      for (const t of types) {
        if (t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
          supportedTypes.push('Face Recognition');
          if (primaryType === 'none') primaryType = 'face';
        } else if (t === LocalAuthentication.AuthenticationType.FINGERPRINT) {
          supportedTypes.push('Fingerprint');
          if (primaryType === 'none' || primaryType === 'face') primaryType = 'fingerprint';
        } else if (t === LocalAuthentication.AuthenticationType.IRIS) {
          supportedTypes.push('Iris');
          if (primaryType === 'none') primaryType = 'iris';
        }
      }

      if (supportedTypes.length === 0 && hasHardware) {
        supportedTypes.push('Biometrics');
        primaryType = 'fingerprint';
      }

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        primaryType,
      };
    } catch (error) {
      console.warn('Error checking biometric status:', error);
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        primaryType: 'none',
      };
    }
  }

  /**
   * Prompt user for Biometric Authentication
   */
  static async authenticateWithBiometrics(
    promptMessage = 'Confirm your identity with biometrics'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const status = await this.checkBiometricStatus();

      // If no hardware or not enrolled, return appropriate message
      if (!status.hasHardware) {
        return { success: false, error: 'No biometric hardware detected on this device.' };
      }
      if (!status.isEnrolled) {
        return { success: false, error: 'No biometric credentials enrolled in system settings.' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: true,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error ? `Authentication cancelled or failed (${result.error})` : 'Biometric authentication failed',
        };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Biometric authentication error' };
    }
  }

  /**
   * Save initial setup (Password, PIN, Biometric preference, and optional name)
   */
  static async registerCredentials(params: {
    name?: string;
    password?: string;
    pin?: string;
    enableBiometrics?: boolean;
  }): Promise<void> {
    if (params.name) {
      await secureSet(STORAGE_KEYS.USER_NAME, params.name);
    }
    if (params.password) {
      const passwordHash = await this.hashValue(params.password);
      await secureSet(STORAGE_KEYS.USER_PASSWORD_HASH, passwordHash);
    }
    if (params.pin) {
      const pinHash = await this.hashValue(params.pin);
      await secureSet(STORAGE_KEYS.USER_PIN_HASH, pinHash);
    }
    if (params.enableBiometrics !== undefined) {
      await secureSet(STORAGE_KEYS.BIOMETRIC_ENABLED, params.enableBiometrics ? 'true' : 'false');
    }
    await secureSet(STORAGE_KEYS.IS_CONFIGURED, 'true');
  }

  /**
   * Verify entered PIN
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    const storedHash = await secureGet(STORAGE_KEYS.USER_PIN_HASH);
    if (!storedHash) return false;
    const inputHash = await this.hashValue(enteredPin);
    return storedHash === inputHash;
  }

  /**
   * Verify entered Password
   */
  static async verifyPassword(enteredPassword: string): Promise<boolean> {
    const storedHash = await secureGet(STORAGE_KEYS.USER_PASSWORD_HASH);
    if (!storedHash) return false;
    const inputHash = await this.hashValue(enteredPassword);
    return storedHash === inputHash;
  }

  /**
   * Check if the user has completed initial security setup
   */
  static async isConfigured(): Promise<boolean> {
    const isConf = await secureGet(STORAGE_KEYS.IS_CONFIGURED);
    return isConf === 'true';
  }

  /**
   * Check if biometric unlock is enabled by user
   */
  static async isBiometricEnabled(): Promise<boolean> {
    const enabled = await secureGet(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  }

  /**
   * Toggle biometric unlock preference
   */
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    await secureSet(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
  }

  /**
   * Retrieve current user profile display info
   */
  static async getUserProfile(): Promise<{ name: string; hasPin: boolean; hasPassword: boolean; biometricEnabled: boolean }> {
    const name = (await secureGet(STORAGE_KEYS.USER_NAME)) || 'User';
    const hasPin = Boolean(await secureGet(STORAGE_KEYS.USER_PIN_HASH));
    const hasPassword = Boolean(await secureGet(STORAGE_KEYS.USER_PASSWORD_HASH));
    const biometricEnabled = (await secureGet(STORAGE_KEYS.BIOMETRIC_ENABLED)) === 'true';

    return { name, hasPin, hasPassword, biometricEnabled };
  }

  /**
   * Clear all credentials and reset app state
   */
  static async resetAll(): Promise<void> {
    await secureDelete(STORAGE_KEYS.USER_PIN_HASH);
    await secureDelete(STORAGE_KEYS.USER_PASSWORD_HASH);
    await secureDelete(STORAGE_KEYS.BIOMETRIC_ENABLED);
    await secureDelete(STORAGE_KEYS.IS_CONFIGURED);
    await secureDelete(STORAGE_KEYS.USER_NAME);
  }
}
