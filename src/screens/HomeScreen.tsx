import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const HomeScreen: React.FC = () => {
  const {
    userProfile,
    authMethodUsed,
    logout,
    resetApp,
  } = useAuth();

  const handleReset = () => {
    Alert.alert(
      'Reset All Credentials',
      'This will delete your PIN, Password, and Pattern. You will return to the initial setup screen.',
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

  const getMethodBadge = () => {
    switch (authMethodUsed) {
      case 'pin':
        return {
          icon: 'keypad',
          label: '4-Digit Numeric PIN',
          color: '#0284c7',
          bg: '#f0f9ff',
        };
      case 'pattern':
        return {
          icon: 'grid',
          label: '3x3 Grid Pattern Lock',
          color: '#10b981',
          bg: '#ecfdf5',
        };
      case 'password':
        return {
          icon: 'lock-closed',
          label: 'Character Password',
          color: '#8b5cf6',
          bg: '#f5f3ff',
        };
      default:
        return {
          icon: 'shield-checkmark',
          label: 'Secure Authenticated Session',
          color: '#0284c7',
          bg: '#f0f9ff',
        };
    }
  };

  const badge = getMethodBadge();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Welcome Banner */}
      <View style={styles.topCard}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon as any} size={18} color={badge.color} />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>

        <Text style={styles.greeting}>Welcome, {userProfile.name}!</Text>
        <Text style={styles.subgreeting}>Your application session is active and secure.</Text>

        <TouchableOpacity style={styles.lockNowButton} onPress={logout}>
          <Ionicons name="lock-closed-outline" size={18} color="#0284c7" />
          <Text style={styles.lockNowText}>Lock App Now</Text>
        </TouchableOpacity>
      </View>

      {/* Security Status Overview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Authentication Methods</Text>
      </View>

      <View style={styles.card}>
        {/* Numeric PIN */}
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="keypad-outline" size={24} color="#0284c7" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.settingTitle}>Numeric PIN</Text>
            <Text style={styles.settingSubtitle}>4-digit numeric dial code</Text>
          </View>
          <View style={styles.activeTag}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Pattern Lock */}
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="grid-outline" size={24} color="#10b981" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.settingTitle}>Pattern Lock</Text>
            <Text style={styles.settingSubtitle}>3x3 connected dot gesture</Text>
          </View>
          <View style={styles.activeTag}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Character Password */}
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="text-outline" size={24} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={styles.settingTitle}>Character Password</Text>
            <Text style={styles.settingSubtitle}>Alphanumeric with SHA-256 hash</Text>
          </View>
          <View style={styles.activeTag}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Security Architecture Summary */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Security Architecture</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hashing Algorithm</Text>
          <Text style={styles.infoValue}>SHA-256 + Salt</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Secure Storage</Text>
          <Text style={styles.infoValue}>Hardware Keystore / Keychain</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pattern Minimum Length</Text>
          <Text style={styles.infoValue}>4 Connected Dots</Text>
        </View>
      </View>

      {/* Reset credentials */}
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
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
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
