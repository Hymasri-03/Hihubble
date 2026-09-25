import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _Svg, { Path as _Path } from 'react-native-svg';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

const Svg = _Svg as any;
const Path = _Path as any;

export interface TopBarProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  avatarUrl: string;
  onAvatarPress?: () => void;
  onLogoPress?: () => void;
  onNotificationPress?: () => void;
  hasUnreadNotifications?: boolean;
}

export const TopBar = ({
  themeMode,
  onToggleTheme,
  avatarUrl,
  onAvatarPress,
  onLogoPress,
  onNotificationPress,
  hasUnreadNotifications = true,
}: TopBarProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const resolvedAvatar =
    avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

  return (
    <View style={styles.container}>
      {/* Left: Theme Mode Toggle Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleTheme}
        style={[
          styles.iconBtn,
          {
            backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#1C153B',
            borderColor: colors.border,
          },
        ]}
        accessibilityLabel="Toggle Theme"
      >
        <Ionicons
          name={themeMode === 'light' ? 'sunny-outline' : 'moon-outline'}
          size={20}
          color={themeMode === 'light' ? BRAND_COLORS.purplePrimary : '#FCD34D'}
        />
      </TouchableOpacity>

      {/* Center: Mascot & HiHubble typography matching Home Page Header */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onLogoPress}
        style={styles.seamlessLogoContainer}
        accessibilityLabel="Hi Hubble Logo"
      >
        <View style={styles.centerGroup}>
          <Image
            source={require('../../../../../HiHubbleSplash/assets/splash/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />

          <View style={styles.brandRow}>
            {/* "Hi" with heart dot over the "i" */}
            <View style={styles.hiWrapper}>
              <Text style={[styles.brandHi, themeMode === 'dark' && styles.brandHiDark]}>Hı</Text>
              <View style={styles.heartDot}>
                <Svg viewBox="0 0 32 29" width={9} height={8}>
                  <Path
                    fill="#FF3B8A"
                    d="M16 28.2C7.4 22.4 1.2 16.7 1.2 9.6 1.2c2.8 0 5.2 1.5 6.8 3.8 1.6-2.3 4-3.8 6.8-3.8 4.4 0 8 3.7 8 8.4 0 7.1-6.2 12.8-14.8 18.6z"
                  />
                </Svg>
              </View>
            </View>

            {/* "Hubble" */}
            <Text style={[styles.brandHubble, themeMode === 'dark' && styles.brandHubbleDark]}>
              Hubble
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Action Icons: Notification Bell & Profile Avatar */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNotificationPress}
          style={[
            styles.iconBtn,
            {
              backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#1C153B',
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={19}
            color={colors.textPrimary}
          />
          {hasUnreadNotifications && <View style={styles.notificationDot} />}
        </TouchableOpacity>

        {/* User Profile Thumbnail */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAvatarPress}
          style={styles.avatarRing}
          accessibilityLabel="Profile Avatar"
        >
          <Image
            source={{ uri: resolvedAvatar }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  seamlessLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 36,
    height: 36,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  hiWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandHi: {
    fontSize: 21,
    fontWeight: '800',
    color: '#140C2C',
    letterSpacing: -0.5,
  },
  brandHiDark: {
    color: '#FFFFFF',
  },
  heartDot: {
    position: 'absolute',
    top: 3.5,
    right: 0.5,
  },
  brandHubble: {
    fontSize: 21,
    fontWeight: '800',
    color: '#6535EA',
    letterSpacing: -0.5,
    marginLeft: 1,
  },
  brandHubbleDark: {
    color: '#A78BFA',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BRAND_COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
});

export default TopBar;
