import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProfileScreen from './profile/src/screens/ProfileScreen';
import { UserProfile } from './profile/src/types/profile';

export interface ProfileViewProps {
  isDark?: boolean;
  onLogout?: () => void;
  currentUser?: { email: string; name?: string } | null;
  onToggleTheme?: () => void;
  hideTopBar?: boolean;
  onPostCreated?: (post: any) => void;
}

export default function ProfileView({
  isDark = false,
  onLogout,
  currentUser,
  onToggleTheme,
  hideTopBar = false,
  onPostCreated,
}: ProfileViewProps) {
  const initialUser: UserProfile | undefined = currentUser?.name
    ? {
        id: 'usr_current',
        name: currentUser.name,
        handle: `@${currentUser.name.toLowerCase().replace(/\s+/g, '_')}`,
        bio: 'Hubber on Hi-Hubble. Living in the moment & exploring the universe! ✨',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        isVerified: true,
        roleBadge: 'Hubber on Hi-Hubble',
        joinedDate: 'Joined September 2026',
        phoneNumber: '+1 (555) 234-5678',
        preferredOtpMethod: 'SMS',
      }
    : undefined;

  return (
    <View style={styles.container}>
      <ProfileScreen
        isDark={isDark}
        themeMode={isDark ? 'dark' : 'light'}
        onThemeToggle={onToggleTheme ? () => onToggleTheme() : undefined}
        onLogout={onLogout}
        hideTopBar={hideTopBar}
        initialUser={initialUser}
        onPostCreated={onPostCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
