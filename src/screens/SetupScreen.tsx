import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PinKeypad } from '../components/PinKeypad';
import { PatternLock } from '../components/PatternLock';

export const SetupScreen: React.FC = () => {
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // PIN state
  const [pin, setPin] = useState('');
  const [confirmedPin, setConfirmedPin] = useState('');
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Pattern state
  const [pattern, setPattern] = useState<number[]>([]);
  const [isConfirmingPattern, setIsConfirmingPattern] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [patternKey, setPatternKey] = useState(0); // to force reset component on retry

  const handleStep1Submit = () => {
    if (!password || password.length < 6) {
      Alert.alert('Password too short', 'Password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-type.');
      return;
    }
    setStep(2);
  };

  const handlePinDigit = (digit: string) => {
    setPinError(null);
    if (!isConfirmingPin) {
      if (pin.length < 4) {
        const nextPin = pin + digit;
        setPin(nextPin);
        if (nextPin.length === 4) {
          setTimeout(() => {
            setIsConfirmingPin(true);
          }, 200);
        }
      }
    } else {
      if (confirmedPin.length < 4) {
        const nextConfirmed = confirmedPin + digit;
        setConfirmedPin(nextConfirmed);
        if (nextConfirmed.length === 4) {
          if (pin === nextConfirmed) {
            setTimeout(() => {
              setStep(3);
            }, 250);
          } else {
            setPinError('PINs do not match. Try again.');
            setTimeout(() => {
              setConfirmedPin('');
            }, 700);
          }
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setPinError(null);
    if (!isConfirmingPin) {
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmedPin((prev) => prev.slice(0, -1));
    }
  };

  const handlePatternComplete = (drawnPattern: number[]) => {
    setPatternError(null);

    if (drawnPattern.length < 4) {
      setPatternError('Pattern must connect at least 4 dots');
      setPatternKey((k) => k + 1);
      return;
    }

    if (!isConfirmingPattern) {
      setPattern(drawnPattern);
      setIsConfirmingPattern(true);
      setPatternKey((k) => k + 1);
    } else {
      // Compare drawnPattern with initial pattern
      const matches =
        drawnPattern.length === pattern.length &&
        drawnPattern.every((dot, idx) => dot === pattern[idx]);

      if (matches) {
        handleFinishAllSetup(drawnPattern);
      } else {
        setPatternError('Pattern does not match. Draw your pattern again.');
        setPatternKey((k) => k + 1);
      }
    }
  };

  const handleFinishAllSetup = async (finalPattern: number[]) => {
    try {
      await register({
        name: name.trim() || 'User',
        password,
        pin,
        pattern: finalPattern,
      });
      Alert.alert('Success', 'PIN, Password, and Pattern Lock configured successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save security settings.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={40} color="#0284c7" />
          </View>
          <Text style={styles.title}>Security Setup</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Step 1 of 3: Character Password (alphanumeric)'}
            {step === 2 && 'Step 2 of 3: Numeric 4-digit PIN'}
            {step === 3 && 'Step 3 of 3: 3x3 Grid Pattern Lock'}
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepBar, step >= 1 && styles.stepBarActive]} />
          <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
          <View style={[styles.stepBar, step >= 3 && styles.stepBarActive]} />
        </View>

        {/* STEP 1: Name & Password (Characters) */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Your Name (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.inputLabel}>Character Password (min 6 chars)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Letters, numbers & symbols"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleStep1Submit}>
              <Text style={styles.primaryButtonText}>Continue to Numeric PIN</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Numeric PIN */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.pinInstruction}>
              {isConfirmingPin ? 'Confirm your 4-digit PIN' : 'Enter a 4-digit Numeric PIN'}
            </Text>

            <PinKeypad
              pin={isConfirmingPin ? confirmedPin : pin}
              pinLength={4}
              onDigitPress={handlePinDigit}
              onBackspacePress={handlePinBackspace}
              error={pinError}
            />

            {isConfirmingPin && (
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setIsConfirmingPin(false);
                  setPin('');
                  setConfirmedPin('');
                  setPinError(null);
                }}
              >
                <Text style={styles.textButtonLabel}>Reset PIN & Re-enter</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setStep(1);
                setIsConfirmingPin(false);
                setPin('');
                setConfirmedPin('');
              }}
            >
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Back to Password</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Pattern Lock */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.pinInstruction}>
              {isConfirmingPattern
                ? 'Confirm Pattern (draw again)'
                : 'Draw a Pattern (connect dots)'}
            </Text>
            <Text style={styles.patternSubhint}>
              {isConfirmingPattern
                ? 'Draw the exact same pattern to confirm'
                : 'Swipe across 4 or more dots to create your pattern'}
            </Text>

            <PatternLock
              key={patternKey}
              size={270}
              onPatternComplete={handlePatternComplete}
              error={patternError}
            />

            {isConfirmingPattern && (
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setIsConfirmingPattern(false);
                  setPattern([]);
                  setPatternError(null);
                  setPatternKey((k) => k + 1);
                }}
              >
                <Text style={styles.textButtonLabel}>Start Pattern Over</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Back to PIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  stepBarActive: {
    backgroundColor: '#0284c7',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
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
    marginTop: 10,
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    gap: 6,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  pinInstruction: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  patternSubhint: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  textButtonLabel: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
