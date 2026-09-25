import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { TabType, ThemeMode } from '../types/profile';

export interface EmptyStateProps {
  activeTab: TabType;
  themeMode: ThemeMode;
  onCreatePress?: () => void;
}

export const EmptyState = ({
  activeTab,
  themeMode,
  onCreatePress,
}: EmptyStateProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const contentMap: Record<
    TabType,
    { icon: string; title: string; description: string; buttonText: string }
  > = {
    hubs: {
      icon: 'camera-outline',
      title: 'No hubs shared yet.',
      description: 'Capture a moment or post an update to share with your hubbers!',
      buttonText: '+ Create First Hub',
    },
    hubclips: {
      icon: 'videocam-outline',
      title: 'No Hubclips yet.',
      description: 'Share short video clips and let your creativity shine across Hubble!',
      buttonText: '+ Record Hubclip',
    },
    saved: {
      icon: 'bookmark',
      title: 'No saved Hubs yet.',
      description: 'Items you bookmark will appear here for easy access anytime.',
      buttonText: 'Explore Hubs',
    },
    hubbers: {
      icon: 'people-outline',
      title: 'No hubbers yet.',
      description: 'Connect with people and grow your galactic audience on Hi-Hubble!',
      buttonText: '+ Discover Hubbers',
    },
    hubbies: {
      icon: 'heart-outline',
      title: 'Not following anyone yet.',
      description: 'Follow friends and creators to see their cosmic updates here!',
      buttonText: '+ Follow Hubbies',
    },
    tagged: {
      icon: 'pricetag-outline',
      title: 'No tagged people yet.',
      description: 'Tag your friends and teammates in posts to highlight them here!',
      buttonText: '+ Tag Someone',
    },
  };

  const current = contentMap[activeTab] || contentMap.hubs;

  return (
    <View style={styles.container}>
      {/* Icon Badge with Soft Glow */}
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: colors.badgeBg,
            borderColor: colors.badgeBorder,
          },
        ]}
      >
        {activeTab === 'saved' ? (
          <Feather name="bookmark" size={32} color={BRAND_COLORS.purplePrimary} />
        ) : (
          <Ionicons
            name={current.icon as any}
            size={34}
            color={BRAND_COLORS.purplePrimary}
          />
        )}
      </View>

      {/* Title & Description */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {current.title}
      </Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {current.description}
      </Text>

      {/* Primary Call to Action Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onCreatePress}
        style={styles.ctaButtonWrapper}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>{current.buttonText}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 42,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  ctaButtonWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default EmptyState;
