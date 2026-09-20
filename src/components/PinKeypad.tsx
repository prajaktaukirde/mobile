import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinKeypadProps {
  pin: string;
  pinLength?: number;
  onDigitPress: (digit: string) => void;
  onBackspacePress: () => void;
  onClearPress?: () => void;
  error?: string | null;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
  pin,
  pinLength = 4,
  onDigitPress,
  onBackspacePress,
  onClearPress,
  error = null,
}) => {
  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.container}>
      {/* Masked PIN Dots Indicator */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: pinLength }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                error ? styles.dotError : null,
              ]}
            />
          );
        })}
      </View>

      {/* Error text if any */}
      {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorPlaceholder} />}

      {/* Keypad Grid */}
      <View style={styles.keypad}>
        {digits.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.key}
                activeOpacity={0.65}
                onPress={() => onDigitPress(item)}
              >
                <Text style={styles.keyText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <View style={styles.row}>
          {/* Left: Clear button if pin has digits */}
          {pin.length > 0 && onClearPress ? (
            <TouchableOpacity
              style={[styles.key, styles.specialKey]}
              activeOpacity={0.65}
              onPress={onClearPress}
            >
              <Text style={styles.clearText}>C</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyKey} />
          )}

          {/* Center: 0 */}
          <TouchableOpacity
            style={styles.key}
            activeOpacity={0.65}
            onPress={() => onDigitPress('0')}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>

          {/* Right: Backspace */}
          <TouchableOpacity
            style={[styles.key, styles.specialKey]}
            activeOpacity={0.65}
            onPress={onBackspacePress}
          >
            <Ionicons name="backspace-outline" size={26} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
    transform: [{ scale: 1.15 }],
  },
  dotError: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    height: 24,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  errorPlaceholder: {
    height: 24,
    marginTop: 4,
    marginBottom: 10,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  key: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  specialKey: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  emptyKey: {
    width: 74,
    height: 74,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0f172a',
  },
  clearText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
  },
});
