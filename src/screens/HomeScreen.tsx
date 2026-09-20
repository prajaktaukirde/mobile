import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const HomeScreen: React.FC = () => {
  const {
    userProfile,
    authMethodUsed,
    biometricStatus,
    toggleBiometrics,
    logout,
    resetApp,
  } = useAuth();

  const [toggling, setToggling] = useState(false);

  const handleBiometricToggle = async (value: boolean) => {
    if (value && !biometricStatus.hasHardware) {
      Alert.alert('Unavailable', 'No biometric sensor detected on this device.');
      return;
    }
    if (value && !biometricStatus.isEnrolled) {
      Alert.alert(
        'Not Enrolled',
        'Please enroll your fingerprint or face in your phone system settings first.'
      );
      return;
    }

    try {
      setToggling(true);
      await toggleBiometrics(value);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update biometric setting');
    } finally {
      setToggling(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Credentials',
      'This will delete your PIN, Password, and Biometric preferences. You will return to the setup screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetApp();
          },
        },
      ]
    );
  };

  const getMethodBadge = () => {
    switch (authMethodUsed) {
      case 'biometric':
        return {
          icon: biometricStatus.primaryType === 'face' ? 'scan' : 'finger-print',
          label: 'Biometrics (Face / Fingerprint)',
          color: '#10b981',
          bg: '#ecfdf5',
        };
      case 'pin':
        return {
          icon: 'keypad',
          label: '4-Digit PIN Code',
          color: '#0284c7',
          bg: '#f0f9ff',
        };
      case 'password':
        return {
          icon: 'lock-closed',
          label: 'Master Password',
          color: '#8b5cf6',
          bg: '#f5f3ff',
        };
      default:
        return {
          icon: 'checkmark-circle',
          label: 'Authenticated',
          color: '#10b981',
          bg: '#ecfdf5',
        };
    }
  };

  const badge = getMethodBadge();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      <View style={styles.topCard}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon as any} size={20} color={badge.color} />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>

        <Text style={styles.greeting}>Welcome, {userProfile.name}!</Text>
        <Text style={styles.subgreeting}>Your session is secure and active.</Text>

        <TouchableOpacity style={styles.lockNowButton} onPress={logout}>
          <Ionicons name="lock-closed-outline" size={18} color="#0284c7" />
          <Text style={styles.lockNowText}>Lock App Now</Text>
        </TouchableOpacity>
      </View>

      {/* Security & Authentication Overview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
      </View>

      <View style={styles.card}>
        {/* Biometric Toggle Row */}
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons
              name={biometricStatus.primaryType === 'face' ? 'scan' : 'finger-print'}
              size={24}
              color="#0284c7"
            />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.settingTitle}>Biometric Unlock</Text>
            <Text style={styles.settingSubtitle}>
              {biometricStatus.hasHardware
                ? `Supported: ${biometricStatus.supportedTypes.join(', ') || 'Sensor available'}`
                : 'No biometric hardware sensor'}
            </Text>
          </View>
          <Switch
            value={userProfile.biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={toggling || !biometricStatus.hasHardware}
            trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
            thumbColor={userProfile.biometricEnabled ? '#0284c7' : '#f8fafc'}
          />
        </View>

        <View style={styles.divider} />

        {/* PIN Status */}
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="keypad-outline" size={24} color="#0284c7" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.settingTitle}>Quick PIN Code</Text>
            <Text style={styles.settingSubtitle}>Active (4 digits configured)</Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#10b981" />
        </View>

        <View style={styles.divider} />

        {/* Password Status */}
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#0284c7" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.settingTitle}>Master Password</Text>
            <Text style={styles.settingSubtitle}>Protected via SHA-256 hash</Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#10b981" />
        </View>
      </View>

      {/* Device Biometric Diagnostics */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Device Hardware Diagnostics</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hardware Sensor Available</Text>
          <Text
            style={[
              styles.infoValue,
              { color: biometricStatus.hasHardware ? '#10b981' : '#ef4444' },
            ]}
          >
            {biometricStatus.hasHardware ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Biometrics Enrolled</Text>
          <Text
            style={[
              styles.infoValue,
              { color: biometricStatus.isEnrolled ? '#10b981' : '#f59e0b' },
            ]}
          >
            {biometricStatus.isEnrolled ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Detected Sensor Type</Text>
          <Text style={styles.infoValue}>
            {biometricStatus.supportedTypes.join(', ') || 'None'}
          </Text>
        </View>
      </View>

      {/* Danger Zone: Reset App */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
        <Text style={styles.resetButtonText}>Reset All Credentials & Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subgreeting: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 18,
  },
  lockNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  lockNowText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  resetButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
