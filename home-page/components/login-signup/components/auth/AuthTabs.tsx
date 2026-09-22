import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Mode } from '../../types/auth';
import { COLORS } from '../../constants/colors';

interface AuthTabsProps {
  mode: Mode;
  onSwitchMode: (nextMode: Mode) => void;
}

export default function AuthTabs({ mode, onSwitchMode }: AuthTabsProps) {
  return (
    <View style={styles.tabRow}>
      {/* Sign Up tab (left) */}
      <Pressable
        onPress={() => onSwitchMode('signup')}
        style={[styles.tabButton, mode === 'signup' && styles.tabButtonActive]}
      >
        {mode === 'signup' ? (
          <LinearGradient
            colors={[COLORS.PURPLE_GRADIENT_START, COLORS.PURPLE_GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradient}
          >
            <Ionicons name="person-add" size={17} color="#fff" />
            <Text style={styles.tabTextActive}>Sign Up</Text>
          </LinearGradient>
        ) : (
          <View style={styles.tabInactiveContent}>
            <Ionicons name="person-add-outline" size={17} color={COLORS.PURPLE} />
            <Text style={styles.tabTextInactive}>Sign Up</Text>
          </View>
        )}
      </Pressable>

      {/* Login tab (right) */}
      <Pressable
        onPress={() => onSwitchMode('login')}
        style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
      >
        {mode === 'login' ? (
          <LinearGradient
            colors={[COLORS.PURPLE_GRADIENT_START, COLORS.PURPLE_GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tabGradient}
          >
            <Ionicons name="log-in" size={18} color="#fff" />
            <Text style={styles.tabTextActive}>Login</Text>
          </LinearGradient>
        ) : (
          <View style={styles.tabInactiveContent}>
            <Ionicons name="log-in-outline" size={18} color={COLORS.PURPLE} />
            <Text style={styles.tabTextInactive}>Login</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.PURPLE_BG,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabButtonActive: {},
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 6,
  },
  tabInactiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 6,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14.5,
  },
  tabTextInactive: {
    color: COLORS.PURPLE,
    fontWeight: '700',
    fontSize: 14.5,
  },
});
