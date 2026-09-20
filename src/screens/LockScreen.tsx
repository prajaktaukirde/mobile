import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PinKeypad } from '../components/PinKeypad';

export const LockScreen: React.FC = () => {
  const {
    userProfile,
    biometricStatus,
    loginWithPin,
    loginWithPassword,
    loginWithBiometrics,
    resetApp,
  } = useAuth();

  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Auto trigger biometrics when LockScreen loads if enabled
  useEffect(() => {
    if (userProfile.biometricEnabled && biometricStatus.hasHardware && biometricStatus.isEnrolled) {
      handleBiometricUnlock();
    }
  }, []);

  const handleBiometricUnlock = async () => {
    setError(null);
    setIsVerifying(true);
    const result = await loginWithBiometrics();
    setIsVerifying(false);
    if (!result.success && result.error) {
      // If user cancelled, don't show an intrusive alert, just display error hint
      setError(result.error);
    }
  };

  const handleDigitPress = async (digit: string) => {
    if (isVerifying) return;
    setError(null);
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        setIsVerifying(true);
        const result = await loginWithPin(nextPin);
        setIsVerifying(false);
        if (!result.success) {
          setError(result.error || 'Incorrect PIN');
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleBackspacePress = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError(null);
    setIsVerifying(true);
    const result = await loginWithPassword(password);
    setIsVerifying(false);
    if (!result.success) {
      setError(result.error || 'Incorrect Password');
    }
  };

  const handleForgotOrReset = () => {
    Alert.alert(
      'Reset Authentication?',
      'If you forgot your PIN and Password, you can reset the app. This will clear all stored credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset App',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.lockIconWrap}>
          <Ionicons name="lock-closed" size={36} color="#0284c7" />
        </View>
        <Text style={styles.welcomeText}>Welcome back, {userProfile.name}</Text>
        <Text style={styles.subtitleText}>
          {mode === 'pin' ? 'Enter your 4-digit PIN to unlock' : 'Enter your password to unlock'}
        </Text>
      </View>

      {/* Main Mode View */}
      {mode === 'pin' ? (
        <View style={styles.pinSection}>
          <PinKeypad
            pin={pin}
            pinLength={4}
            onDigitPress={handleDigitPress}
            onBackspacePress={handleBackspacePress}
            onBiometricPress={handleBiometricUnlock}
            showBiometricButton={userProfile.biometricEnabled && biometricStatus.hasHardware}
            biometricType={biometricStatus.primaryType}
            error={error}
          />

          {/* Quick Biometric Button below keypad if enabled */}
          {userProfile.biometricEnabled && biometricStatus.hasHardware && (
            <TouchableOpacity
              style={styles.biometricBarButton}
              activeOpacity={0.7}
              onPress={handleBiometricUnlock}
            >
              <Ionicons
                name={biometricStatus.primaryType === 'face' ? 'scan' : 'finger-print'}
                size={22}
                color="#0284c7"
              />
              <Text style={styles.biometricBarText}>
                Unlock with {biometricStatus.supportedTypes[0] || 'Biometrics'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Toggle to Password */}
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => {
              setMode('password');
              setError(null);
              setPin('');
            }}
          >
            <Ionicons name="key-outline" size={16} color="#0284c7" />
            <Text style={styles.modeToggleText}>Use Password Instead</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Password Mode */
        <View style={styles.passwordSection}>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                onSubmitEditing={handlePasswordSubmit}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.passwordError}>{error}</Text>}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePasswordSubmit}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Unlock</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch back to PIN */}
          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => {
              setMode('pin');
              setError(null);
              setPassword('');
            }}
          >
            <Ionicons name="keypad-outline" size={16} color="#0284c7" />
            <Text style={styles.modeToggleText}>Use PIN Instead</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Forgot / Reset option */}
      <TouchableOpacity style={styles.forgotButton} onPress={handleForgotOrReset}>
        <Text style={styles.forgotText}>Forgot PIN or Password?</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  lockIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  pinSection: {
    alignItems: 'center',
    width: '100%',
  },
  biometricBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  biometricBarText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordSection: {
    width: '100%',
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  passwordError: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  modeToggleText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: '#94a3b8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
