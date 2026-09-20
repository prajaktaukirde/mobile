import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PinKeypad } from '../components/PinKeypad';
import { PatternLock } from '../components/PatternLock';

export const LockScreen: React.FC = () => {
  const {
    userProfile,
    loginWithPin,
    loginWithPassword,
    loginWithPattern,
    resetApp,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'pin' | 'pattern' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [patternResetKey, setPatternResetKey] = useState(0);

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

  const handleClearPin = () => {
    setError(null);
    setPin('');
  };

  const handlePatternComplete = async (drawnPattern: number[]) => {
    if (isVerifying) return;
    setError(null);
    setIsVerifying(true);
    const result = await loginWithPattern(drawnPattern);
    setIsVerifying(false);
    if (!result.success) {
      setError(result.error || 'Incorrect pattern');
      setTimeout(() => {
        setPatternResetKey((k) => k + 1);
      }, 700);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Please enter your character password.');
      return;
    }
    setError(null);
    setIsVerifying(true);
    const result = await loginWithPassword(password);
    setIsVerifying(false);
    if (!result.success) {
      setError(result.error || 'Incorrect password');
    }
  };

  const handleForgotOrReset = () => {
    Alert.alert(
      'Reset Authentication?',
      'If you forgot your PIN, Pattern, or Password, you can reset the app. This will clear stored credentials.',
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
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.lockIconWrap}>
            <Ionicons name="lock-closed" size={32} color="#0284c7" />
          </View>
          <Text style={styles.welcomeText}>Welcome back, {userProfile.name}</Text>
          <Text style={styles.subtitleText}>Choose your unlock method below</Text>
        </View>

        {/* Method Switcher Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pin' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('pin');
              setError(null);
            }}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              color={activeTab === 'pin' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'pin' && styles.tabButtonTextActive]}>
              PIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pattern' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('pattern');
              setError(null);
              setPatternResetKey((k) => k + 1);
            }}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={activeTab === 'pattern' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'pattern' && styles.tabButtonTextActive]}
            >
              Pattern
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'password' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('password');
              setError(null);
            }}
          >
            <Ionicons
              name="text-outline"
              size={18}
              color={activeTab === 'password' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'password' && styles.tabButtonTextActive]}
            >
              Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Numeric PIN */}
        {activeTab === 'pin' && (
          <View style={styles.methodSection}>
            <PinKeypad
              pin={pin}
              pinLength={4}
              onDigitPress={handleDigitPress}
              onBackspacePress={handleBackspacePress}
              onClearPress={handleClearPin}
              error={error}
            />
          </View>
        )}

        {/* Tab 2: Pattern Lock */}
        {activeTab === 'pattern' && (
          <View style={styles.methodSection}>
            <PatternLock
              key={patternResetKey}
              size={280}
              onPatternComplete={handlePatternComplete}
              error={error}
              disabled={isVerifying}
            />
          </View>
        )}

        {/* Tab 3: Character Password */}
        {activeTab === 'password' && (
          <View style={styles.passwordSection}>
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Character Password</Text>
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
          </View>
        )}

        {/* Forgot / Reset link */}
        <TouchableOpacity style={styles.forgotButton} onPress={handleForgotOrReset}>
          <Text style={styles.forgotText}>Forgot PIN, Pattern, or Password?</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginTop: 6,
  },
  lockIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#0284c7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  methodSection: {
    alignItems: 'center',
    width: '100%',
  },
  passwordSection: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
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
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotText: {
    color: '#94a3b8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
