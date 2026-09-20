import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  USER_PIN_HASH: 'auth_user_pin_hash',
  USER_PASSWORD_HASH: 'auth_user_password_hash',
  USER_PATTERN_HASH: 'auth_user_pattern_hash',
  IS_CONFIGURED: 'auth_is_configured',
  USER_NAME: 'auth_user_name',
};

// Web fallback storage if SecureStore is running on browser
const memoryStore: Record<string, string> = {};

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // ignore
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
      // ignore
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

export interface UserAuthProfile {
  name: string;
  hasPin: boolean;
  hasPassword: boolean;
  hasPattern: boolean;
}

export class AuthService {
  /**
   * Hashes plain text using SHA-256 with a salt
   */
  static async hashValue(value: string): Promise<string> {
    const salt = 'mobile_auth_salt_secure_2026';
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${value}`
    );
  }

  /**
   * Save initial setup (Password, PIN, and Pattern)
   */
  static async registerCredentials(params: {
    name?: string;
    password?: string;
    pin?: string;
    pattern?: number[];
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
    if (params.pattern && params.pattern.length > 0) {
      const patternString = params.pattern.join('-');
      const patternHash = await this.hashValue(patternString);
      await secureSet(STORAGE_KEYS.USER_PATTERN_HASH, patternHash);
    }
    await secureSet(STORAGE_KEYS.IS_CONFIGURED, 'true');
  }

  /**
   * Verify entered PIN (Numeric)
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    const storedHash = await secureGet(STORAGE_KEYS.USER_PIN_HASH);
    if (!storedHash) return false;
    const inputHash = await this.hashValue(enteredPin);
    return storedHash === inputHash;
  }

  /**
   * Verify entered Password (Character / Alphanumeric)
   */
  static async verifyPassword(enteredPassword: string): Promise<boolean> {
    const storedHash = await secureGet(STORAGE_KEYS.USER_PASSWORD_HASH);
    if (!storedHash) return false;
    const inputHash = await this.hashValue(enteredPassword);
    return storedHash === inputHash;
  }

  /**
   * Verify entered Pattern (Sequence of dot indices)
   */
  static async verifyPattern(pattern: number[]): Promise<boolean> {
    const storedHash = await secureGet(STORAGE_KEYS.USER_PATTERN_HASH);
    if (!storedHash) return false;
    const patternString = pattern.join('-');
    const inputHash = await this.hashValue(patternString);
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
   * Retrieve current user profile display info
   */
  static async getUserProfile(): Promise<UserAuthProfile> {
    const name = (await secureGet(STORAGE_KEYS.USER_NAME)) || 'User';
    const hasPin = Boolean(await secureGet(STORAGE_KEYS.USER_PIN_HASH));
    const hasPassword = Boolean(await secureGet(STORAGE_KEYS.USER_PASSWORD_HASH));
    const hasPattern = Boolean(await secureGet(STORAGE_KEYS.USER_PATTERN_HASH));

    return { name, hasPin, hasPassword, hasPattern };
  }

  /**
   * Clear all credentials and reset app state
   */
  static async resetAll(): Promise<void> {
    await secureDelete(STORAGE_KEYS.USER_PIN_HASH);
    await secureDelete(STORAGE_KEYS.USER_PASSWORD_HASH);
    await secureDelete(STORAGE_KEYS.USER_PATTERN_HASH);
    await secureDelete(STORAGE_KEYS.IS_CONFIGURED);
    await secureDelete(STORAGE_KEYS.USER_NAME);
  }
}
