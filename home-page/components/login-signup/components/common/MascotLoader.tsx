import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';

interface MascotLoaderProps {
  title?: string;
  subtitle?: string;
  pillText?: string;
}

export default function MascotLoader({
  title = 'Please wait...',
  subtitle = 'Setting up your HiHubble vibe ✨',
  pillText = 'Almost ready...',
}: MascotLoaderProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth 360-degree continuous rotation (1 full turn per 1000ms)
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Breathing pulse for the aura ring behind the mascot
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateLoop.start();
    pulseLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Soft pulsating purple aura */}
      <Animated.View
        style={[
          styles.auraRing,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* 360° Rotating Mascot */}
      <Animated.View
        style={[
          styles.mascotWrap,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Image
          source={require('../../assets/mascot_loading.png')}
          style={styles.mascotImg}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Text style={styles.titleText}>{title}</Text>

      {/* Subtitle */}
      <Text style={styles.subtitleText}>{subtitle}</Text>

      {/* Status Pill */}
      <View style={styles.statusPill}>
        <ActivityIndicator size="small" color={COLORS.PURPLE} />
        <Text style={styles.statusPillText}>{pillText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    minHeight: 330,
    width: '100%',
  },
  auraRing: {
    position: 'absolute',
    top: 32,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
  },
  mascotWrap: {
    width: 120,
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mascotImg: {
    width: 110,
    height: 135,
  },
  titleText: {
    fontSize: 18.5,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.PURPLE_BG,
    borderWidth: 1.2,
    borderColor: COLORS.PURPLE_BORDER,
    borderRadius: 22,
    paddingVertical: 7,
    paddingHorizontal: 18,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statusPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.PURPLE,
  },
});
