import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';

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

  const containerRef = useRef<View>(null);
  const containerOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pre-calculate dot center coordinates
  const step = size / 3;
  const dotRadius = 10;
  const hitRadius = 32;

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

  const handleTouch = (relativeX: number, relativeY: number) => {
    if (disabled) return;
    const hitIndex = getDotIndexFromCoords(relativeX, relativeY);
    if (hitIndex !== null && !selectedDots.includes(hitIndex)) {
      setSelectedDots((prev) => [...prev, hitIndex]);
    }
    setCurrentTouch({ x: relativeX, y: relativeY });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (disabled) return;
        const { locationX, locationY } = evt.nativeEvent;
        const hitIndex = getDotIndexFromCoords(locationX, locationY);
        if (hitIndex !== null) {
          setSelectedDots([hitIndex]);
          setCurrentTouch({ x: locationX, y: locationY });
        } else {
          setSelectedDots([]);
          setCurrentTouch(null);
        }
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (disabled) return;
        const { locationX, locationY } = evt.nativeEvent;
        handleTouch(locationX, locationY);
      },

      onPanResponderRelease: () => {
        setCurrentTouch(null);
        setSelectedDots((current) => {
          if (current.length > 0) {
            onPatternComplete(current);
          }
          return current;
        });
      },
    })
  ).current;

  const lineColor = error ? '#ef4444' : '#0284c7';
  const dotActiveColor = error ? '#ef4444' : '#0284c7';
  const dotInactiveColor = '#94a3b8';

  return (
    <View style={styles.wrapper}>
      {/* 3x3 Gesture Canvas */}
      <View
        ref={containerRef}
        style={[styles.container, { width: size, height: size }]}
        {...panResponder.panHandlers}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {/* Completed Connecting Lines */}
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

          {/* Active drag line to current finger/cursor */}
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

          {/* 9 Grid Dots */}
          {dotCenters.map((center, index) => {
            const isSelected = selectedDots.includes(index);
            return (
              <React.Fragment key={`dot-${index}`}>
                {/* Outer ring for selected dots */}
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
                {/* Core dot */}
                <Circle
                  cx={center.x}
                  cy={center.y}
                  r={isSelected ? dotRadius + 2 : dotRadius}
                  fill={isSelected ? dotActiveColor : dotInactiveColor}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Error or Help Hint */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.hintText}>Connect at least 4 dots</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
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
    touchAction: 'none', // Prevents screen scrolling during swipe gesture on mobile web
  } as any,
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
    height: 20,
  },
  hintText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    height: 20,
  },
});
