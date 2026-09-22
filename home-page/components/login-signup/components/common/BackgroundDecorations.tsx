import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function BackgroundDecorations() {
  return (
    <>
      {/* Premium Clean Lavender Background Gradient */}
      <LinearGradient
        colors={['#F0EBFE', '#F8F6FF', '#EDE7FA']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top-left soft ambient curve */}
      <View style={[styles.ambientTopLeft, { pointerEvents: 'none' }]} />

      {/* Top-right subtle soft light (clean, no bubble shape) */}
      <View style={[styles.ambientTopRight, { pointerEvents: 'none' }]} />

      {/* Floating 3D Bubble Shape on the LEFT SIDE */}
      <View style={[styles.bubbleLeftMain, { pointerEvents: 'none' }]}>
        <LinearGradient
          colors={['#D8CDFB', '#BFAEF8']}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.8, y: 0.9 }}
          style={styles.bubbleGradient}
        >
          {/* Subtle glossy 3D shine reflection */}
          <View style={styles.bubbleGloss} />
        </LinearGradient>
      </View>

      {/* Small satellite accent bubble on the LEFT SIDE */}
      <View style={[styles.bubbleLeftAccent, { pointerEvents: 'none' }]}>
        <LinearGradient
          colors={['#E5DCFC', '#CBBDF9']}
          start={{ x: 0.2, y: 0.1 }}
          end={{ x: 0.8, y: 0.9 }}
          style={styles.bubbleAccentGradient}
        />
      </View>

      {/* Bottom-left soft organic wave */}
      <View style={[styles.blobBottomLeft, { pointerEvents: 'none' }]} />

      {/* Bottom-right soft organic wave */}
      <View style={[styles.blobBottomRight, { pointerEvents: 'none' }]} />
    </>
  );
}

const styles = StyleSheet.create({
  ambientTopLeft: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#DDD3F9',
    opacity: 0.45,
  },
  ambientTopRight: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E6DCFB',
    opacity: 0.3,
  },
  bubbleLeftMain: {
    position: 'absolute',
    top: 72,
    left: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  bubbleGloss: {
    position: 'absolute',
    top: 5,
    left: 7,
    width: 13,
    height: 7,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    transform: [{ rotate: '-25deg' }],
  },
  bubbleLeftAccent: {
    position: 'absolute',
    top: 126,
    left: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleAccentGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#DDD3F9',
    opacity: 0.5,
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: -70,
    right: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#D4C8FA',
    opacity: 0.45,
  },
});
