import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { PinKeypad } from '../components/PinKeypad';

export const SetupScreen: React.FC = () => {
  const { biometricStatus, register } = useAuth();

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

  // Biometrics
  const [enableBiometrics, setEnableBiometrics] = useState(
    biometricStatus.hasHardware && biometricStatus.isEnrolled
  );

  const handleStep1Submit = () => {
    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-check.');
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
          // Move to confirm PIN after a short delay
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
            // Success! Move to Biometric step or complete
            setTimeout(() => {
              setStep(3);
            }, 250);
          } else {
            setPinError('PINs do not match. Try again.');
            setTimeout(() => {
              setConfirmedPin('');
            }, 800);
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

  const handleCompleteSetup = async () => {
    try {
      await register({
        name: name.trim() || 'User',
        password,
        pin,
        enableBiometrics: biometricStatus.hasHardware ? enableBiometrics : false,
      });
      Alert.alert('Success', 'Security credentials saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save credentials.');
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
          <Text style={styles.title}>Secure Setup</Text>
          <Text style={styles.subtitle}>
            {step === 1 && 'Step 1 of 3: Create your account password'}
            {step === 2 && 'Step 2 of 3: Set up a 4-digit quick PIN'}
            {step === 3 && 'Step 3 of 3: Configure biometric security'}
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepBar, step >= 1 && styles.stepBarActive]} />
          <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
          <View style={[styles.stepBar, step >= 3 && styles.stepBarActive]} />
        </View>

        {/* STEP 1: Name & Password */}
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

            <Text style={styles.inputLabel}>Master Password (min 6 chars)</Text>
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

            <TouchableOpacity style={styles.primaryButton} onPress={handleStep1Submit}>
              <Text style={styles.primaryButtonText}>Continue to PIN Setup</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: PIN Setup */}
        {step === 2 && (
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
                <Text style={styles.textButtonLabel}>Start Over</Text>
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

        {/* STEP 3: Biometrics & Finish */}
        {step === 3 && (
          <View style={styles.card}>
            <View style={styles.biometricHeader}>
              <View style={styles.bioIconWrap}>
                <Ionicons
                  name={biometricStatus.primaryType === 'face' ? 'scan' : 'finger-print'}
                  size={36}
                  color="#0284c7"
                />
              </View>
              <Text style={styles.bioTitle}>Biometric Authentication</Text>
              <Text style={styles.bioDescription}>
                {biometricStatus.hasHardware
                  ? biometricStatus.isEnrolled
                    ? `Use ${biometricStatus.supportedTypes.join(' or ') || 'Biometrics'} to quickly and securely unlock your app.`
                    : 'Biometric hardware detected, but no fingerprint/face is enrolled yet. You can enroll in device settings.'
                  : 'No biometric hardware detected on this device. You can still use PIN and Password.'}
              </Text>
            </View>

            {biometricStatus.hasHardware && (
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Enable Biometric Unlock</Text>
                  <Text style={styles.switchSubtext}>Unlock with Fingerprint / Face</Text>
                </View>
                <Switch
                  value={enableBiometrics}
                  onValueChange={setEnableBiometrics}
                  trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
                  thumbColor={enableBiometrics ? '#0284c7' : '#f8fafc'}
                />
              </View>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleCompleteSetup}>
              <Text style={styles.primaryButtonText}>Complete Setup</Text>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            </TouchableOpacity>

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
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
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
    marginBottom: 24,
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
    padding: 24,
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
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
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
  biometricHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bioIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  bioDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  switchSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
