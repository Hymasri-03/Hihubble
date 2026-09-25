import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

export interface CoverBannerProps {
  themeMode: ThemeMode;
  coverUrl?: string;
  onSettingsPress?: () => void;
  onEditCoverPress?: () => void;
  onMascotPress?: () => void;
}

export const CoverBanner = ({
  themeMode,
  coverUrl,
  onSettingsPress,
  onEditCoverPress,
  onMascotPress,
}: CoverBannerProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const gradientColors =
    themeMode === 'light'
      ? (['#EBE6FD', '#EAE6FC', '#F0ECFE'] as const)
      : BRAND_COLORS.darkBannerGradient;

  return (
    <View style={styles.container}>
      {/* Top Header Row inside the Card: Settings Cog (Left), "Profile" Title (Center), Mascot Badge (Right) */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSettingsPress}
          style={styles.settingsBtn}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={[styles.profileTitle, { color: colors.textPrimary }]}>
          Profile
        </Text>

        {/* Balance spacer for centered Profile title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Cover Canvas Area */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onEditCoverPress}
        style={styles.bannerWrapper}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}

          {/* Adjust & Upload Cover option on the banner */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onEditCoverPress}
            style={styles.bannerEditWrapper}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bannerEditBtn}
            >
              <Feather name="edit-2" size={12} color="#FFFFFF" />
              <Text style={styles.bannerEditText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  bannerWrapper: {
    height: 180,
    marginHorizontal: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAE6FB',
  },
  bannerGradient: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 16,
    right: 24,
  },
  sparkle2: {
    position: 'absolute',
    top: 36,
    left: 20,
  },
  bannerEditWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  bannerEditText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default CoverBanner;
