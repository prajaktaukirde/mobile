import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await resetApp();
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
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

        <TouchableOpacity style={styles.lockNowButton} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="lock-closed-outline" size={18} color="#0284c7" />
          <Text style={styles.lockNowText}>Lock / Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Security Status Overview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Configured Authentication Methods</Text>
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
            <Ionicons
              name={userProfile.hasPin ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={userProfile.hasPin ? '#10b981' : '#94a3b8'}
            />
            <Text
              style={[
                styles.activeTagText,
                { color: userProfile.hasPin ? '#10b981' : '#94a3b8' },
              ]}
            >
              {userProfile.hasPin ? 'Active' : 'Not Set'}
            </Text>
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
            <Ionicons
              name={userProfile.hasPattern ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={userProfile.hasPattern ? '#10b981' : '#94a3b8'}
            />
            <Text
              style={[
                styles.activeTagText,
                { color: userProfile.hasPattern ? '#10b981' : '#94a3b8' },
              ]}
            >
              {userProfile.hasPattern ? 'Active' : 'Not Set'}
            </Text>
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
            <Ionicons
              name={userProfile.hasPassword ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={userProfile.hasPassword ? '#10b981' : '#94a3b8'}
            />
            <Text
              style={[
                styles.activeTagText,
                { color: userProfile.hasPassword ? '#10b981' : '#94a3b8' },
              ]}
            >
              {userProfile.hasPassword ? 'Active' : 'Not Set'}
            </Text>
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
          <Text style={styles.infoLabel}>Encrypted Storage</Text>
          <Text style={styles.infoValue}>Keystore / Keychain (Local)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pattern Minimum Length</Text>
          <Text style={styles.infoValue}>4 Connected Dots</Text>
        </View>
      </View>

      {/* Danger Zone: Reset Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => setShowConfirmModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
        <Text style={styles.resetButtonText}>Reset All Credentials & Log Out</Text>
      </TouchableOpacity>

      {/* Confirmation Dialog Modal (100% cross-platform on web and mobile) */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={36} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Reset All Credentials?</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete your stored PIN, Pattern, and Password. You will be logged out and returned to the initial setup screen.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
                disabled={isResetting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Yes, Reset All</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
