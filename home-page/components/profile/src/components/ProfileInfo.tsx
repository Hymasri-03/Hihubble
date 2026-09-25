import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { UserProfile, ThemeMode } from '../types/profile';

export interface ProfileInfoProps {
  user: UserProfile;
  themeMode: ThemeMode;
  onEditPress?: () => void;
  onSharePress?: () => void;
  onMascotPress?: () => void;
  onAvatarPress?: () => void;
}

export const ProfileInfo = ({
  user,
  themeMode,
  onEditPress,
  onSharePress,
  onMascotPress,
  onAvatarPress,
}: ProfileInfoProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  return (
    <View style={styles.container}>
      {/* Horizontal Layout matching screenshot: Avatar on Left, Details on Right */}
      <View style={styles.horizontalRow}>
        {/* Interactive Profile Photo */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onAvatarPress}
          style={styles.avatarWrapper}
        >
          <View style={[styles.avatarCircle, { borderColor: colors.cardBg }]}>
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: BRAND_COLORS.purplePrimary }]}>
            <Feather name="camera" size={11} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* User Details on Right */}
        <View style={styles.infoRight}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onEditPress}
            style={styles.nameRow}
          >
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user.name}
            </Text>
            {user.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={BRAND_COLORS.purplePrimary}
                style={styles.verifiedIcon}
              />
            )}
          </TouchableOpacity>

          <Text style={[styles.userHandle, { color: colors.textMuted }]}>
            {user.handle}
          </Text>

          {user.bio ? (
            <Text style={[styles.userBio, { color: colors.textSecondary }]}>
              {user.bio}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    marginTop: -38,
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRight: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 36,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  editIcon: {
    marginLeft: 4,
    opacity: 0.6,
  },
  userHandle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 1,
  },
  userBio: {
    fontSize: 13.5,
    lineHeight: 18,
    marginTop: 3,
  },
});

export default ProfileInfo;
