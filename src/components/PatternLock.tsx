import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  TouchableOpacity,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface PatternLockProps {
  size?: number;
  onPatternComplete: (pattern: number[]) => void;
  error?: string | null;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const PatternLock: React.FC<PatternLockProps> = ({
  size = 280,
  onPatternComplete,
  error = null,
  disabled = false,
}) => {
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [currentTouch, setCurrentTouch] = useState<Point | null>(null);

  // Ref to completely prevent closure staleness and duplicate entries
  const selectedDotsRef = useRef<number[]>([]);
  const containerOffsetRef = useRef<{ pageX: number; pageY: number }>({ pageX: 0, pageY: 0 });
  const containerViewRef = useRef<View>(null);

  // Synchronize ref when external error or clear happens
  useEffect(() => {
    if (error) {
      // Keep selected visible on error for visual feedback, will be cleared by parent
    }
  }, [error]);

  const step = size / 3;
  const dotRadius = 11;
  const hitRadius = 34; // Generous hit area for easy touch / mouse dragging

  const dotCenters: Point[] = Array.from({ length: 9 }).map((_, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: col * step + step / 2,
      y: row * step + step / 2,
    };
  });

  const getDotIndexFromCoords = (x: number, y: number): number | null => {
    for (let i = 0; i < dotCenters.length; i++) {
      const center = dotCenters[i];
      const dist = Math.hypot(x - center.x, y - center.y);
      if (dist <= hitRadius) {
        return i;
      }
    }
    return null;
  };

  const addDot = (dotIndex: number) => {
    if (!selectedDotsRef.current.includes(dotIndex)) {
      selectedDotsRef.current.push(dotIndex);
      setSelectedDots([...selectedDotsRef.current]);
    }
  };

  const clearPattern = () => {
    selectedDotsRef.current = [];
    setSelectedDots([]);
    setCurrentTouch(null);
  };

  const updateContainerOffset = () => {
    if (containerViewRef.current) {
      containerViewRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
        containerOffsetRef.current = { pageX: pageX || 0, pageY: pageY || 0 };
      });
    }
  };

  // Convert gesture event coordinates to local container coordinates
  const getLocalCoords = (evt: GestureResponderEvent): { x: number; y: number } => {
    const native = evt.nativeEvent as any;
    if (typeof native.locationX === 'number' && typeof native.locationY === 'number') {
      return { x: native.locationX, y: native.locationY };
    }
    // Fallback using page coordinates
    const pageX = native.pageX ?? native.clientX ?? 0;
    const pageY = native.pageY ?? native.clientY ?? 0;
    return {
      x: pageX - containerOffsetRef.current.pageX,
      y: pageY - containerOffsetRef.current.pageY,
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (disabled) return;
        updateContainerOffset();
        const { x, y } = getLocalCoords(evt);
        const hitIndex = getDotIndexFromCoords(x, y);

        selectedDotsRef.current = [];
        if (hitIndex !== null) {
          selectedDotsRef.current = [hitIndex];
          setSelectedDots([hitIndex]);
          setCurrentTouch({ x, y });
        } else {
          setSelectedDots([]);
          setCurrentTouch(null);
        }
      },

      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (disabled) return;
        const { x, y } = getLocalCoords(evt);
        const hitIndex = getDotIndexFromCoords(x, y);
        if (hitIndex !== null) {
          addDot(hitIndex);
        }
        setCurrentTouch({ x, y });
      },

      onPanResponderRelease: () => {
        setCurrentTouch(null);
        const finalPattern = [...selectedDotsRef.current];
        if (finalPattern.length > 0) {
          onPatternComplete(finalPattern);
        }
      },
    })
  ).current;

  // Also support tapping individual dots directly
  const handleDotTap = (index: number) => {
    if (disabled) return;
    addDot(index);
  };

  const handleFinishTapSelection = () => {
    const finalPattern = [...selectedDotsRef.current];
    if (finalPattern.length > 0) {
      onPatternComplete(finalPattern);
    }
  };

  const lineColor = error ? '#ef4444' : '#0284c7';
  const dotActiveColor = error ? '#ef4444' : '#0284c7';
  const dotInactiveColor = '#94a3b8';

  return (
    <View style={styles.wrapper}>
      {/* 3x3 Canvas */}
      <View
        ref={containerViewRef}
        onLayout={updateContainerOffset}
        style={[styles.container, { width: size, height: size }]}
        {...panResponder.panHandlers}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {/* Connecting Lines */}
          {selectedDots.map((dotIndex, idx) => {
            if (idx === 0) return null;
            const prevDot = dotCenters[selectedDots[idx - 1]];
            const currDot = dotCenters[dotIndex];
            return (
              <Line
                key={`line-${idx}`}
                x1={prevDot.x}
                y1={prevDot.y}
                x2={currDot.x}
                y2={currDot.y}
                stroke={lineColor}
                strokeWidth={5}
                strokeLinecap="round"
              />
            );
          })}

          {/* Active trailing line to cursor/touch */}
          {currentTouch && selectedDots.length > 0 && (
            <Line
              x1={dotCenters[selectedDots[selectedDots.length - 1]].x}
              y1={dotCenters[selectedDots[selectedDots.length - 1]].y}
              x2={currentTouch.x}
              y2={currentTouch.y}
              stroke={lineColor}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.7}
            />
          )}

          {/* 9 Pattern Dots */}
          {dotCenters.map((center, index) => {
            const isSelected = selectedDots.includes(index);
            return (
              <React.Fragment key={`dot-${index}`}>
                {isSelected && (
                  <Circle
                    cx={center.x}
                    cy={center.y}
                    r={hitRadius - 8}
                    fill={error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.15)'}
                    stroke={dotActiveColor}
                    strokeWidth={2}
                  />
                )}
                <Circle
                  cx={center.x}
                  cy={center.y}
                  r={isSelected ? dotRadius + 3 : dotRadius}
                  fill={isSelected ? dotActiveColor : dotInactiveColor}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Status / Error feedback */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.hintText}>
          {selectedDots.length > 0
            ? `Connected: ${selectedDots.length} ${selectedDots.length === 1 ? 'dot' : 'dots'} (min 4)`
            : 'Swipe or tap across at least 4 dots'}
        </Text>
      )}

      {/* Clear & Done buttons for tap mode */}
      {selectedDots.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={clearPattern}>
            <Ionicons name="refresh-outline" size={16} color="#ef4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleFinishTapSelection}>
            <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
            <Text style={styles.submitBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    touchAction: 'none',
    userSelect: 'none',
  } as any,
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    minHeight: 20,
  },
  hintText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    minHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 4,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
