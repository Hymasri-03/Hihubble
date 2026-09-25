import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Share,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EditCoverModal from '../components/EditCoverModal';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import CreateHubModal from '../components/CreateHubModal';
import ClipsGrid from '../components/ClipsGrid';
import CropAvatarModal from '../components/CropAvatarModal';
import PostsGrid from '../components/PostsGrid';
import { TabType, ThemeMode, UserProfile, ProfileStats, HubPost } from '../types/profile';

export interface StandaloneProfileScreenProps {
  initialUser?: UserProfile;
  initialStats?: ProfileStats;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onSettingsPress?: () => void;
}

// ==========================================
// THEME TOKENS
// ==========================================
const BRAND = {
  purplePrimary: '#7C3AED',
  purpleLight: '#8B5CF6',
  pinkAccent: '#EC4899',
  gradientBorder: ['#EC4899', '#A855F7', '#7C3AED'] as const,
  bannerGradient: ['#C4B5FD', '#DDD6FE', '#FBCFE8'] as const,
  darkBannerGradient: ['#3B1F69', '#2E1065', '#4C1D95'] as const,
};

const PALETTE = {
  light: {
    screenBg: '#F5F4FA',
    cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B',
    textSecondary: '#4B5563',
    textMuted: '#6B7280',
    border: '#EBE8F6',
    statCardBg: '#FAF8FE',
    statCardBorder: '#E5DEF7',
    statNumber: '#1F1635',
    tabInactive: '#6B7280',
    tabActive: '#7C3AED',
    badgeBg: '#F3EFFE',
    badgeBorder: '#DDD3F9',
    badgeText: '#6D28D9',
    actionBtnBg: '#F3F0FF',
  },
  dark: {
    screenBg: '#090615',
    cardBg: '#130E26',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    border: '#271F47',
    statCardBg: '#1B1438',
    statCardBorder: '#30265B',
    statNumber: '#FFFFFF',
    tabInactive: '#94A3B8',
    tabActive: '#A78BFA',
    badgeBg: '#241442',
    badgeBorder: '#4C2882',
    badgeText: '#C4B5FD',
    actionBtnBg: '#221844',
  },
};

// ==========================================
// DEFAULT MOCK DATA
// ==========================================
const DEFAULT_USER: UserProfile = {
  id: 'usr_hymasri',
  name: 'Hymasri',
  handle: '@hymasri',
  bio: 'Hubber on Hi-Hubble. Living in the moment & exploring the universe!',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  isVerified: true,
  roleBadge: 'Hubber on Hi-Hubble',
  phoneNumber: '+1 (555) 382-9012',
  preferredOtpMethod: 'SMS',
};

const DEFAULT_STATS: ProfileStats = {
  hubs: 0,
  hubbers: 10,
  hubbies: 16,
  tagged: 0,
  likes: 0,
};

// ==========================================
// MAIN COMPONENT: StandaloneProfileScreen
// ==========================================
export default function StandaloneProfileScreen({
  initialUser = DEFAULT_USER,
  initialStats = DEFAULT_STATS,
  onEditProfile,
  onShareProfile,
  onSettingsPress,
}: StandaloneProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [stats, setStats] = useState<ProfileStats>(initialStats);
  const [activeTab, setActiveTab] = useState<TabType>('hubs');
  const [refreshing, setRefreshing] = useState(false);
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [createHubModalVisible, setCreateHubModalVisible] = useState(false);
  const [posts, setPosts] = useState<HubPost[]>([]);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropImageUri, setCropImageUri] = useState<string | null>(null);

  const colors = PALETTE[themeMode as 'light' | 'dark'];

  // Filter posts by active tab so clips don't appear in Hubs
  const hubsPosts = posts.filter(
    (p) => p.tabType === 'hubs' || (!p.tabType && p.mediaType !== 'video')
  );
  const clipsPosts = posts.filter(
    (p) => p.tabType === 'hubclips' || p.mediaType === 'video'
  );
  const savedPosts = posts.filter((p) => p.tabType === 'saved');

  const toggleTheme = () => {
    setThemeMode((prev: ThemeMode) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleChangeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow access to your photos to change your avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Crop FIRST in our dedicated cropper!
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCropImageUri(result.assets[0].uri);
        setCropModalVisible(true);
      }
    } catch (e) {
      console.log('Error picking avatar:', e);
    }
  };

  const handleCropDone = (croppedUri: string) => {
    setUser((prev) => ({ ...prev, avatarUrl: croppedUri }));
    setCropModalVisible(false);
    setCropImageUri(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleShare = async () => {
    if (onShareProfile) return onShareProfile();
    try {
      await Share.share({
        message: `Check out ${user.name}'s profile (${user.handle}) on Hi-Hubble!`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const handleEdit = () => {
    if (onEditProfile) return onEditProfile();
    setEditProfileModalVisible(true);
  };

  const handleEditCover = () => {
    setCoverModalVisible(true);
  };

  const handleSettings = () => {
    if (onSettingsPress) return onSettingsPress();
    setSettingsModalVisible(true);
  };

  const handleMascotGreeting = () => {
    Alert.alert('Hi from Hubble!', `Welcome to ${user.name}'s universe on Hi-Hubble!`);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[
            styles.iconCircleBtn,
            {
              backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#1C153B',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name={themeMode === 'light' ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={themeMode === 'light' ? BRAND.purplePrimary : '#FCD34D'}
          />
        </TouchableOpacity>

        {/* Center: Logo merged seamlessly with the top header background */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleMascotGreeting}
          style={styles.seamlessLogoContainer}
        >
          <Image
            source={require('../../assets/logo_transparent.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMascotGreeting}
          style={styles.avatarPill}
        >
          <Image source={{ uri: user.avatarUrl }} style={styles.miniAvatar} />
        </TouchableOpacity>
      </View>

      {/* 2. SCROLLABLE PROFILE CONTENT */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={BRAND.purplePrimary}
            colors={[BRAND.purplePrimary]}
          />
        }
      >
        {/* Pink-to-Purple Multi-Stop Gradient Border Card */}
        <LinearGradient
          colors={BRAND.gradientBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCardWrapper}
        >
          <View style={[styles.cardSurface, { backgroundColor: colors.cardBg }]}>
            {/* CARD HEADER & COVER BANNER */}
            <View style={styles.cardHeader}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSettings}
                style={[styles.settingsBtn, { backgroundColor: colors.cardBg }]}
              >
                <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Profile</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Banner Canvas */}
            <View style={styles.bannerContainer}>
              <LinearGradient
                colors={
                  themeMode === 'light'
                    ? BRAND.bannerGradient
                    : BRAND.darkBannerGradient
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                {user.coverUrl ? (
                  <Image
                    source={{ uri: user.coverUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Simple and clean Edit option directly on the banner (no extra logo or mask) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleEditCover}
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
            </View>

            {/* PROFILE INFO ROW (Fixed mascot overlap bug) */}
            <View style={styles.profileInfoContainer}>
              <View style={styles.avatarActionRow}>
                <View style={styles.avatarAnchor}>
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={[styles.mainAvatar, { borderColor: colors.cardBg }]}
                  />
                </View>

                {/* Edit Profile & Share Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleEdit}
                    style={styles.editBtnShadow}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.editBtn}
                    >
                      <Feather name="edit-2" size={13} color="#FFFFFF" />
                      <Text style={styles.editBtnText}>Edit Profile</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleShare}
                    style={[
                      styles.shareBtn,
                      { backgroundColor: colors.actionBtnBg, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons name="share-social-outline" size={17} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Names & Bio Info */}
              <View style={{ marginTop: 12 }}>
                <View style={styles.nameVerifiedRow}>
                  <Text style={[styles.displayName, { color: colors.textPrimary }]}>
                    {user.name}
                  </Text>
                  {user.isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={BRAND.purplePrimary}
                      style={{ marginTop: 2 }}
                    />
                  )}
                </View>

                <Text style={[styles.handleText, { color: colors.textMuted }]}>
                  {user.handle}
                </Text>

                <View style={styles.badgeWrapper}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder },
                    ]}
                  >
                    <Text style={[styles.roleBadgeText, { color: colors.badgeText }]}>
                      {user.roleBadge}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                  {user.bio}
                </Text>
              </View>
            </View>

            {/* STATS ROW (3 Modern tactile cards) */}
            <View style={styles.statsContainer}>
              {[
                { key: 'hubs', count: stats.hubs, label: 'YOUR HUBS' },
                { key: 'hubbers', count: stats.hubbers, label: 'HUBBERS' },
                { key: 'hubbies', count: stats.hubbies, label: 'HUBBIES' },
              ].map((stat) => (
                <TouchableOpacity
                  key={stat.key}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert(stat.label, `Count: ${stat.count}`)}
                  style={[
                    styles.statBox,
                    { backgroundColor: colors.statCardBg, borderColor: colors.statCardBorder },
                  ]}
                >
                  <Text style={[styles.statNum, { color: colors.statNumber }]}>
                    {stat.count}
                  </Text>
                  <Text style={[styles.statLbl, { color: colors.textMuted }]}>
                    {stat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TABS ROW */}
            <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
              {[
                { key: 'hubs' as TabType, label: 'YOUR HUBS', icon: 'image-outline', type: 'ion' },
                { key: 'hubclips' as TabType, label: 'Hubclips', icon: 'videocam-outline', type: 'ion' },
                { key: 'saved' as TabType, label: 'Saved Hubbs', icon: 'bookmark', type: 'feather' },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                const activeColor = isActive ? colors.tabActive : colors.tabInactive;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.7}
                    onPress={() => setActiveTab(tab.key)}
                    style={styles.tabButton}
                  >
                    <View style={styles.tabContentRow}>
                      {tab.type === 'ion' ? (
                        <Ionicons name={tab.icon as any} size={17} color={activeColor} />
                      ) : (
                        <Feather name={tab.icon as any} size={16} color={activeColor} />
                      )}
                      <Text
                        style={[
                          styles.tabText,
                          { color: activeColor, fontWeight: isActive ? '700' : '500' },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </View>
                    {isActive ? (
                      <View
                        style={[
                          styles.tabIndicator,
                          { backgroundColor: BRAND.purplePrimary },
                        ]}
                      />
                    ) : (
                      <View style={{ height: 3, marginTop: 8 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Content Area: Filtered by active tab so clips don't appear in Hubs */}
            {activeTab === 'hubs' &&
              (hubsPosts.length > 0 ? (
                <PostsGrid
                  posts={hubsPosts}
                  themeMode={themeMode}
                  onPressPost={(post) => Alert.alert('Hub Post', post.caption)}
                />
              ) : (
                <View style={styles.emptyStateBox}>
                  <View
                    style={[
                      styles.emptyStateIconBadge,
                      { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={32} color={BRAND.purplePrimary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No hubs shared yet.</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Capture a moment or post an update to share with your hubbers!
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setCreateHubModalVisible(true)}
                    style={styles.createBtnWrapper}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createBtn}
                    >
                      <Text style={styles.createBtnText}>+ Create First Hub</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}

            {activeTab === 'hubclips' &&
              (clipsPosts.length > 0 ? (
                <ClipsGrid
                  clips={clipsPosts}
                  themeMode={themeMode}
                  user={user}
                  onPressClip={(clip) =>
                    Alert.alert('HubClip', clip.caption || 'Playing video clip')
                  }
                  onUpdateClip={(updated) =>
                    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }
                  onDeleteClip={(id) => {
                    setPosts((prev) => prev.filter((p) => p.id !== id));
                    Alert.alert('HubClip Deleted', 'Video clip has been removed.');
                  }}
                />
              ) : (
                <View style={styles.emptyStateBox}>
                  <View
                    style={[
                      styles.emptyStateIconBadge,
                      { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder },
                    ]}
                  >
                    <Ionicons name="videocam-outline" size={32} color={BRAND.purplePrimary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Hubclips yet.</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Record short creative video moments to share with Hubble.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setCreateHubModalVisible(true)}
                    style={styles.createBtnWrapper}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createBtn}
                    >
                      <Text style={styles.createBtnText}>+ Record Hubclip</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}

            {activeTab === 'saved' &&
              (savedPosts.length > 0 ? (
                <PostsGrid
                  posts={savedPosts}
                  themeMode={themeMode}
                  onPressPost={(post) => Alert.alert('Saved Hub', post.caption)}
                />
              ) : (
                <View style={styles.emptyStateBox}>
                  <View
                    style={[
                      styles.emptyStateIconBadge,
                      { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder },
                    ]}
                  >
                    <Feather name="bookmark" size={30} color={BRAND.purplePrimary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved hubs yet.</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Save inspirational hubs from across the cosmic community.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setCreateHubModalVisible(true)}
                    style={styles.createBtnWrapper}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.createBtn}
                    >
                      <Text style={styles.createBtnText}>+ Save New Hub</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Modals */}
      <EditCoverModal
        visible={coverModalVisible}
        themeMode={themeMode}
        currentCoverUrl={user.coverUrl}
        onClose={() => setCoverModalVisible(false)}
        onSelectCover={(newCoverUrl) => setUser((prev) => ({ ...prev, coverUrl: newCoverUrl }))}
      />
      <EditProfileModal
        visible={editProfileModalVisible}
        themeMode={themeMode}
        user={user}
        onClose={() => setEditProfileModalVisible(false)}
        onSave={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
      />
      <SettingsModal
        visible={settingsModalVisible}
        themeMode={themeMode}
        userAvatarUrl={user.avatarUrl}
        onUploadAvatar={handleChangeAvatar}
        onToggleTheme={toggleTheme}
        onEditProfile={() => setEditProfileModalVisible(true)}
        onEditCover={() => setCoverModalVisible(true)}
        onLogout={() => Alert.alert('Logged Out', 'You have been successfully logged out.')}
        onDeleteAccount={() => {
          setPosts([]);
          setStats({ hubs: 0, hubbers: 0, hubbies: 0, tagged: 0, likes: 0 });
          Alert.alert('Account Deleted', 'Your account has been deleted.');
        }}
        onClose={() => setSettingsModalVisible(false)}
      />
      <CreateHubModal
        visible={createHubModalVisible}
        activeTab={activeTab}
        themeMode={themeMode}
        onClose={() => setCreateHubModalVisible(false)}
        onCreatePost={(newPost) => {
          setPosts((prev) => [newPost, ...prev]);
          if (newPost.tabType === 'hubs') {
            setStats((prev) => ({ ...prev, hubs: prev.hubs + 1 }));
          }
        }}
      />

      {/* Crop Avatar Modal: Crop FIRST, then upload */}
      <CropAvatarModal
        visible={cropModalVisible}
        imageUri={cropImageUri}
        themeMode={themeMode}
        onClose={() => {
          setCropModalVisible(false);
          setCropImageUri(null);
        }}
        onCropDone={handleCropDone}
      />
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  seamlessLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  brandLogo: {
    width: 110,
    height: 38,
  },
  avatarPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BRAND.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  gradientCardWrapper: {
    width: '100%',
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  cardSurface: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    paddingBottom: 24,
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
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bannerContainer: {
    height: 155,
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },
  bannerEditWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
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
  profileInfoContainer: {
    paddingHorizontal: 20,
    marginTop: -42,
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarAnchor: {
    position: 'relative',
  },
  mainAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  mascotAnchor: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editBtnShadow: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  handleText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 18,
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.2,
    minHeight: 54,
    elevation: 1,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLbl: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  tabIndicator: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    marginTop: 8,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyStateIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 18,
  },
  createBtnWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  createBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
