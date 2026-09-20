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

type SetupStage = 'CHOOSE_METHODS' | 'SETUP_PASSWORD' | 'SETUP_PIN' | 'SETUP_PATTERN';

export const SetupScreen: React.FC = () => {
  const { register } = useAuth();

  // Selection stage
  const [selectedMethods, setSelectedMethods] = useState<{
    pin: boolean;
    pattern: boolean;
    password: boolean;
  }>({
    pin: true,
    pattern: true,
    password: false,
  });

  const [currentStage, setCurrentStage] = useState<SetupStage>('CHOOSE_METHODS');
  const [name, setName] = useState('');

  // Password state
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
  const [patternKey, setPatternKey] = useState(0);

  const toggleMethod = (method: 'pin' | 'pattern' | 'password') => {
    setSelectedMethods((prev) => ({
      ...prev,
      [method]: !prev[method],
    }));
  };

  const getActiveMethodQueue = (): SetupStage[] => {
    const queue: SetupStage[] = [];
    if (selectedMethods.password) queue.push('SETUP_PASSWORD');
    if (selectedMethods.pin) queue.push('SETUP_PIN');
    if (selectedMethods.pattern) queue.push('SETUP_PATTERN');
    return queue;
  };

  const handleStartSetup = () => {
    const count = Object.values(selectedMethods).filter(Boolean).length;
    if (count === 0) {
      Alert.alert('Selection Required', 'Please select at least one authentication method to set up.');
      return;
    }
    const queue = getActiveMethodQueue();
    if (queue.length > 0) {
      setCurrentStage(queue[0]);
    }
  };

  const advanceFromStage = (current: SetupStage, finalPattern?: number[]) => {
    const queue = getActiveMethodQueue();
    const currentIndex = queue.indexOf(current);
    if (currentIndex < queue.length - 1) {
      // Advance to next method
      setCurrentStage(queue[currentIndex + 1]);
    } else {
      // Completed all selected methods!
      handleFinishRegistration(finalPattern);
    }
  };

  // --- Password Handlers ---
  const handlePasswordSubmit = () => {
    if (!password || password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }
    advanceFromStage('SETUP_PASSWORD');
  };

  // --- PIN Handlers ---
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
            advanceFromStage('SETUP_PIN');
          } else {
            setPinError('PINs do not match. Please try again.');
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

  // --- Pattern Handlers ---
  const handlePatternComplete = (drawnPattern: number[]) => {
    setPatternError(null);

    if (drawnPattern.length < 4) {
      setPatternError('Please connect at least 4 dots.');
      setPatternKey((k) => k + 1);
      return;
    }

    if (!isConfirmingPattern) {
      // Store the initial pattern and ask for confirmation
      setPattern(drawnPattern);
      setIsConfirmingPattern(true);
      setPatternKey((k) => k + 1);
    } else {
      // Compare drawnPattern against the saved pattern
      const isExactMatch =
        drawnPattern.length === pattern.length &&
        drawnPattern.every((dotIndex, idx) => dotIndex === pattern[idx]);

      if (isExactMatch) {
        advanceFromStage('SETUP_PATTERN', drawnPattern);
      } else {
        setPatternError('Pattern did not match. Please draw your pattern again.');
        setPatternKey((k) => k + 1);
      }
    }
  };

  const handleFinishRegistration = async (finalPattern?: number[]) => {
    try {
      await register({
        name: name.trim() || 'User',
        password: selectedMethods.password ? password : undefined,
        pin: selectedMethods.pin ? pin : undefined,
        pattern: selectedMethods.pattern ? finalPattern || pattern : undefined,
      });
      Alert.alert('Success', 'Your security setup is complete!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save credentials.');
    }
  };

  const selectedCount = Object.values(selectedMethods).filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={38} color="#0284c7" />
          </View>
          <Text style={styles.title}>
            {currentStage === 'CHOOSE_METHODS' && 'Choose Auth Methods'}
            {currentStage === 'SETUP_PASSWORD' && 'Character Password'}
            {currentStage === 'SETUP_PIN' && 'Numeric 4-Digit PIN'}
            {currentStage === 'SETUP_PATTERN' && 'Pattern Lock Setup'}
          </Text>
          <Text style={styles.subtitle}>
            {currentStage === 'CHOOSE_METHODS' && 'Select the security method(s) you would like to enable:'}
            {currentStage === 'SETUP_PASSWORD' && 'Create an alphanumeric password for your account'}
            {currentStage === 'SETUP_PIN' && 'Set up a quick numeric dial PIN'}
            {currentStage === 'SETUP_PATTERN' && 'Connect dots on the 3x3 grid'}
          </Text>
        </View>

        {/* STAGE 0: CHOOSE METHODS */}
        {currentStage === 'CHOOSE_METHODS' && (
          <View style={styles.card}>
            {/* Optional name */}
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

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Select Methods to Set Up</Text>

            {/* Option 1: Numeric PIN */}
            <TouchableOpacity
              style={[styles.methodOption, selectedMethods.pin && styles.methodOptionSelected]}
              onPress={() => toggleMethod('pin')}
              activeOpacity={0.7}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: '#f0f9ff' }]}>
                <Ionicons name="keypad" size={24} color="#0284c7" />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.methodOptionTitle}>Numeric PIN</Text>
                <Text style={styles.methodOptionDesc}>4-digit numeric keypad code for quick unlock</Text>
              </View>
              <Ionicons
                name={selectedMethods.pin ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedMethods.pin ? '#0284c7' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Option 2: Pattern Lock */}
            <TouchableOpacity
              style={[styles.methodOption, selectedMethods.pattern && styles.methodOptionSelected]}
              onPress={() => toggleMethod('pattern')}
              activeOpacity={0.7}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="grid" size={24} color="#10b981" />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.methodOptionTitle}>Pattern Lock</Text>
                <Text style={styles.methodOptionDesc}>3x3 grid connect-the-dots swipe gesture</Text>
              </View>
              <Ionicons
                name={selectedMethods.pattern ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedMethods.pattern ? '#10b981' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Option 3: Character Password */}
            <TouchableOpacity
              style={[styles.methodOption, selectedMethods.password && styles.methodOptionSelected]}
              onPress={() => toggleMethod('password')}
              activeOpacity={0.7}
            >
              <View style={[styles.methodIconWrap, { backgroundColor: '#f5f3ff' }]}>
                <Ionicons name="text" size={24} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.methodOptionTitle}>Character Password</Text>
                <Text style={styles.methodOptionDesc}>Alphanumeric password (letters, digits, symbols)</Text>
              </View>
              <Ionicons
                name={selectedMethods.password ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedMethods.password ? '#8b5cf6' : '#94a3b8'}
              />
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.primaryButton, selectedCount === 0 && styles.buttonDisabled]}
              onPress={handleStartSetup}
              disabled={selectedCount === 0}
            >
              <Text style={styles.primaryButtonText}>
                Continue Setup ({selectedCount} Selected)
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE: SETUP PASSWORD */}
        {currentStage === 'SETUP_PASSWORD' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Master Password (min 6 characters)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
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

            <TouchableOpacity style={styles.primaryButton} onPress={handlePasswordSubmit}>
              <Text style={styles.primaryButtonText}>Save & Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentStage('CHOOSE_METHODS')}
            >
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Back to Method Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE: SETUP PIN */}
        {currentStage === 'SETUP_PIN' && (
          <View style={styles.card}>
            <Text style={styles.pinInstruction}>
              {isConfirmingPin ? 'Confirm your 4-digit PIN' : 'Enter a 4-digit PIN'}
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
              onPress={() => setCurrentStage('CHOOSE_METHODS')}
            >
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Back to Method Selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE: SETUP PATTERN */}
        {currentStage === 'SETUP_PATTERN' && (
          <View style={styles.card}>
            <Text style={styles.pinInstruction}>
              {isConfirmingPattern
                ? 'Confirm Pattern (draw again)'
                : 'Draw Pattern (connect at least 4 dots)'}
            </Text>
            <Text style={styles.patternSubhint}>
              {isConfirmingPattern
                ? 'Connect the exact same dots in the same order'
                : 'Swipe or tap across 4 or more dots to form a shape'}
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
                <Text style={styles.textButtonLabel}>Redo Initial Pattern</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentStage('CHOOSE_METHODS')}
            >
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Back to Method Selection</Text>
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
    paddingHorizontal: 16,
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
    marginBottom: 8,
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
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  methodOptionSelected: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  methodOptionDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
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
