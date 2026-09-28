import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Share,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import {
  UserProfile,
  ProfileStats,
  TabType,
  ThemeMode,
  ProfileScreenProps,
  HubPost,
  MemberPerson,
  TaggedPerson,
} from '../types/profile';
import TopBar from '../components/TopBar';
import CoverBanner from '../components/CoverBanner';
import ProfileInfo from '../components/ProfileInfo';
import StatsRow from '../components/StatsRow';
import TabsRow from '../components/TabsRow';
import EmptyState from '../components/EmptyState';
import PostsGrid from '../components/PostsGrid';
import ClipsGrid from '../components/ClipsGrid';
import EditCoverModal from '../components/EditCoverModal';
import EditProfileModal from '../components/EditProfileModal';
import FollowersModal from '../components/FollowersModal';
import SettingsModal from '../components/SettingsModal';
import CreateHubModal from '../components/CreateHubModal';
import PostDetailModal from '../components/PostDetailModal';
import MembersListSection from '../components/MembersListSection';
import TaggedSection from '../components/TaggedSection';
import CropAvatarModal from '../components/CropAvatarModal';
import ProfilePhotoViewModal from '../components/ProfilePhotoViewModal';
import NotificationsModal from '../components/NotificationsModal';
import SharePostModal from '../components/SharePostModal';
import { INITIAL_HUBS_POSTS, INITIAL_CLIPS_POSTS } from '../constants/initialData';

const DEFAULT_USER: UserProfile = {
  id: 'usr_hymasri',
  name: 'Hymasri',
  handle: '@hymasri',
  bio: 'Hubber creator on Hi-Hubble',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  isVerified: false,
  roleBadge: 'Hubber on Hi-Hubble',
  joinedDate: 'Joined September 2026',
  phoneNumber: '+91 98765 43210',
  preferredOtpMethod: 'SMS',
};

const INITIAL_HUBBERS: MemberPerson[] = [
  {
    id: 'm_1',
    name: 'Alex Rivers',
    handle: '@alexrivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'm_2',
    name: 'Jamie Sun',
    handle: '@jamiesun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Jul 2026',
  },
  {
    id: 'm_3',
    name: 'Sarah Chen',
    handle: '@sarahchen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    isFollowing: false,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'm_4',
    name: 'Marcus Vance',
    handle: '@marcusvance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    isFollowing: false,
    roleBadge: 'Cosmic Creator',
    joinedDate: 'Joined Jun 2026',
  },
  {
    id: 'm_5',
    name: 'Elena Rostova',
    handle: '@elenarostova',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Star Voyager',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'm_6',
    name: 'Aarav Sharma',
    handle: '@aarav',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Nebula Artist',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'm_7',
    name: 'Rohan Verma',
    handle: '@rohan',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
    isFollowing: false,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'm_8',
    name: 'Diya Sen',
    handle: '@diyasen',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Cosmic Creator',
    joinedDate: 'Joined Aug 2026',
  },
];

const INITIAL_HUBBIES: MemberPerson[] = [
  {
    id: 'h_1',
    name: 'Alex Rivers',
    handle: '@alexrivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'h_2',
    name: 'Jamie Sun',
    handle: '@jamiesun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Jul 2026',
  },
  {
    id: 'h_3',
    name: 'Aarav Sharma',
    handle: '@aarav',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Nebula Artist',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'h_4',
    name: 'Elena Rostova',
    handle: '@elenarostova',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Star Voyager',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'h_5',
    name: 'Sneha Patel',
    handle: '@sneha',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Cosmic Creator',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'h_6',
    name: 'Marcus Vance',
    handle: '@marcusvance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Star Voyager',
    joinedDate: 'Joined Jun 2026',
  },
  {
    id: 'h_7',
    name: 'Sarah Chen',
    handle: '@sarahchen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'h_8',
    name: 'Diya Sen',
    handle: '@diyasen',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Cosmic Creator',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'h_9',
    name: 'Karan Mehra',
    handle: '@karanm',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Nebula Artist',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'h_10',
    name: 'Pooja Hegde',
    handle: '@poojah',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Jul 2026',
  },
  {
    id: 'h_11',
    name: 'Vikram Seth',
    handle: '@vikrams',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Star Voyager',
    joinedDate: 'Joined Aug 2026',
  },
  {
    id: 'h_12',
    name: 'Ananya Roy',
    handle: '@ananyar',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Cosmic Creator',
    joinedDate: 'Joined Sep 2026',
  },
  {
    id: 'h_13',
    name: 'Rohan Verma',
    handle: '@rohan',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
    roleBadge: 'Hubber on Hi-Hubble',
    joinedDate: 'Joined Sep 2026',
  },
];

const INITIAL_TAGGED: TaggedPerson[] = [
  {
    id: 't_1',
    name: 'Alex Rivers',
    handle: '@alexrivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    taggedInTitle: 'Stargazing into the cosmos',
    taggedDate: '2 hours ago',
    roleBadge: 'Tagged Friend',
  },
  {
    id: 't_2',
    name: 'Jamie Sun',
    handle: '@jamiesun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    taggedInTitle: 'Pastel nebula skies',
    taggedDate: 'Yesterday',
    roleBadge: 'Tagged Friend',
  },
  {
    id: 't_3',
    name: 'Sarah Chen',
    handle: '@sarahchen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    taggedInTitle: 'Live coding session with team',
    taggedDate: '3 days ago',
    roleBadge: 'Tagged Friend',
  },
];

const DEFAULT_STATS: ProfileStats = {
  hubs: INITIAL_HUBS_POSTS.length,
  hubbers: 8,
  hubbies: 13,
  tagged: 3,
  likes: 437,
};

export const ProfileScreen = ({
  initialUser = DEFAULT_USER,
  initialStats = DEFAULT_STATS,
  themeMode: themeModeProp,
  isDark,
  onThemeToggle,
  hideTopBar = false,
  onLogout,
  onPostCreated,
}: ProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    themeModeProp || (isDark ? 'dark' : 'light')
  );

  React.useEffect(() => {
    if (themeModeProp) {
      setThemeMode(themeModeProp);
    } else if (isDark !== undefined) {
      setThemeMode(isDark ? 'dark' : 'light');
    }
  }, [themeModeProp, isDark]);

  const [user, setUser] = useState<UserProfile>(initialUser);
  React.useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);
  const [stats, setStats] = useState<ProfileStats>({
    ...DEFAULT_STATS,
    ...initialStats,
  });
  // Default to 'hubclips' matching screenshot or user preference
  const [activeTab, setActiveTab] = useState<TabType>('hubclips');
  const [refreshing, setRefreshing] = useState(false);

  // User posts storage initialized with Hubs and HubClips
  const [posts, setPosts] = useState<HubPost[]>([
    ...INITIAL_HUBS_POSTS,
    ...INITIAL_CLIPS_POSTS,
  ]);

  // Grid Multi-Selection Mode (Long-press to select multiple images & single-tap upload)
  const [isGridSelectMode, setIsGridSelectMode] = useState(false);
  const [selectedGridPostIds, setSelectedGridPostIds] = useState<string[]>([]);

  // Hubbers, Hubbies, Tagged state with dynamic addition & removal
  const [hubbersList, setHubbersList] = useState<MemberPerson[]>(INITIAL_HUBBERS);
  const [hubbiesList, setHubbiesList] = useState<MemberPerson[]>(INITIAL_HUBBIES);
  const [taggedList, setTaggedList] = useState<TaggedPerson[]>(INITIAL_TAGGED);

  // Saved section filter (All, Videos, Photos)
  const [savedFilter, setSavedFilter] = useState<'all' | 'videos' | 'photos'>('all');

  // Modal Visibility States
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [openedEditFromSettings, setOpenedEditFromSettings] = useState(false);
  const [profilePhotoModalVisible, setProfilePhotoModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'hubbers' | 'hubbies'>('hubbers');
  const [createHubModalVisible, setCreateHubModalVisible] = useState(false);
  const [createHubInitialMedia, setCreateHubInitialMedia] = useState<string | undefined>(undefined);
  const [createHubInitialAdditional, setCreateHubInitialAdditional] = useState<string[] | undefined>(undefined);
  const [createHubDeviceImages, setCreateHubDeviceImages] = useState<string[]>([]);
  const [createHubInitialFormat, setCreateHubInitialFormat] = useState<'photo' | 'video'>('photo');

  // Share Post Modal state (Share through ID, Copy link, Add to Story, Send to Friends)
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedSharePost, setSelectedSharePost] = useState<HubPost | null>(null);

  // Post Detail Modal State (Viewing, Editing, Deleting)
  const [selectedPost, setSelectedPost] = useState<HubPost | null>(null);
  const [postDetailModalVisible, setPostDetailModalVisible] = useState(false);

  // Profile Photo Adjust modal state (Drag with finger, Zoom In/Out, Rotate)
  const [adjustProfileModalVisible, setAdjustProfileModalVisible] = useState(false);
  const [candidateProfileUri, setCandidateProfileUri] = useState<string | null>(null);

  // Notifications Modal State (Bell icon action)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Restricted and Blocked Accounts State (Universal across profile)
  const [restrictedUsers, setRestrictedUsers] = useState<string[]>([
    '@shadow_watcher',
  ]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([
    '@spambot_galaxy',
    '@troll_orbit',
  ]);

  const handleRestrictUser = (handle: string) => {
    const formatted = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    if (restrictedUsers.includes(formatted)) {
      Alert.alert('Already Restricted', `${formatted} is already in your restricted list.`);
      return;
    }
    setRestrictedUsers((prev) => [formatted, ...prev]);
    Alert.alert('Account Restricted', `${formatted} has been added to your Restricted Accounts.`);
  };

  const handleUnrestrictUser = (handle: string) => {
    setRestrictedUsers((prev) => prev.filter((u) => u !== handle));
  };

  const handleBlockUser = (handle: string) => {
    const formatted = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    if (blockedUsers.includes(formatted)) {
      Alert.alert('Already Blocked', `${formatted} is already in your blocked list.`);
      return;
    }
    setBlockedUsers((prev) => [formatted, ...prev]);
    Alert.alert('Account Blocked', `${formatted} has been blocked.`);
  };

  const handleUnblockUser = (handle: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u !== handle));
  };

  const colors = THEME[themeMode as 'light' | 'dark'];

  // Filter posts by active tab
  // Your Hubs: strictly photos/albums only (never videos)
  const hubsPosts = posts.filter(
    (p) => p.mediaType !== 'video' && (!p.tabType || p.tabType === 'hubs')
  );
  // HubClips: strictly video clips only
  const clipsPosts = posts.filter(
    (p) => p.mediaType === 'video' || p.tabType === 'hubclips'
  );
  const savedPosts = posts.filter((p) => {
    if (p.tabType !== 'saved') return false;
    if (savedFilter === 'videos') return p.mediaType === 'video';
    if (savedFilter === 'photos') return p.mediaType !== 'video';
    return true;
  });

  // Toggle light/dark mode
  const handleToggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
    onThemeToggle?.(nextMode);
  };

  // Pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // Share profile action
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${user.name}'s profile (${user.handle}) on Hi-Hubble!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Profile Photo Upload with on-screen finger drag & zoom adjust option
  const handleChangeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow access to your photos to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Let user adjust in dedicated modal with drag and zoom
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCandidateProfileUri(result.assets[0].uri);
        setAdjustProfileModalVisible(true);
      }
    } catch (e) {
      console.log('Error picking profile picture:', e);
    }
  };

  const handleAdjustProfileDone = (finalUri: string) => {
    setUser((prev) => ({ ...prev, avatarUrl: finalUri }));
    setAdjustProfileModalVisible(false);
    setCandidateProfileUri(null);
  };

  // Update Cover URL directly after adjust & upload
  const handleSelectCover = (newCoverUrl: string | undefined) => {
    setUser((prev) => ({ ...prev, coverUrl: newCoverUrl }));
  };

  // Update Profile details
  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  // Interactive mascot greeting
  const handleMascotPress = () => {
    Alert.alert(
      'Hi from Hubble!',
      `Welcome to ${user.name}'s cosmic space on Hi-Hubble! Explore hubs, hubclips, hubbers and hubbies.`
    );
  };

  // Stat item click -> Direct tab access for HUBS, HUBBERS, HUBBIES
  const handleStatPress = (type: TabType | 'likes') => {
    if (type === 'likes') {
      Alert.alert(
        'Cosmic Likes',
        `${user.name} has received ${stats.likes} total likes across hubs and clips.`
      );
    } else {
      setActiveTab(type);
    }
  };

  // Real-time update for Followers / Following counts from modal
  const handleUpdateFollowStats = (type: 'hubbers' | 'hubbies', delta: number) => {
    setStats((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  // Hubbers: Add & Remove with Automatic Count Updates
  const handleAddHubber = (person: MemberPerson) => {
    setHubbersList((prev) => [person, ...prev]);
    setStats((prev) => ({ ...prev, hubbers: prev.hubbers + 1 }));
  };

  const handleRemoveHubber = (id: string) => {
    setHubbersList((prev) => prev.filter((p) => p.id !== id));
    setStats((prev) => ({ ...prev, hubbers: Math.max(0, prev.hubbers - 1) }));
  };

  // Hubbies: Add & Remove with Automatic Count Updates
  const handleAddHubbie = (person: MemberPerson) => {
    setHubbiesList((prev) => [person, ...prev]);
    setStats((prev) => ({ ...prev, hubbies: prev.hubbies + 1 }));
  };

  const handleRemoveHubbie = (id: string) => {
    setHubbiesList((prev) => prev.filter((p) => p.id !== id));
    setStats((prev) => ({ ...prev, hubbies: Math.max(0, prev.hubbies - 1) }));
  };

  // Follow / Unfollow member with automatic count updates (Hubbers & Hubbies)
  const handleToggleFollow = (memberId: string) => {
    const hubber = hubbersList.find((m) => m.id === memberId);
    if (hubber) {
      const willFollow = !hubber.isFollowing;
      setHubbersList((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, isFollowing: willFollow } : m))
      );
      if (willFollow) {
        const alreadyInHubbies = hubbiesList.some((h) => h.id === memberId || h.handle === hubber.handle);
        if (!alreadyInHubbies) {
          setHubbiesList((prev) => [{ ...hubber, isFollowing: true }, ...prev]);
        }
        setStats((prev) => ({ ...prev, hubbies: prev.hubbies + 1 }));
      } else {
        setHubbiesList((prev) => prev.filter((h) => h.id !== memberId && h.handle !== hubber.handle));
        setStats((prev) => ({ ...prev, hubbies: Math.max(0, prev.hubbies - 1) }));
      }
      return;
    }

    const hubbie = hubbiesList.find((m) => m.id === memberId);
    if (hubbie) {
      const willFollow = !hubbie.isFollowing;
      if (!willFollow) {
        setHubbiesList((prev) => prev.filter((h) => h.id !== memberId));
        setHubbersList((prev) =>
          prev.map((m) => (m.id === memberId || m.handle === hubbie.handle ? { ...m, isFollowing: false } : m))
        );
        setStats((prev) => ({ ...prev, hubbies: Math.max(0, prev.hubbies - 1) }));
      } else {
        setHubbiesList((prev) =>
          prev.map((h) => (h.id === memberId ? { ...h, isFollowing: true } : h))
        );
        setStats((prev) => ({ ...prev, hubbies: prev.hubbies + 1 }));
      }
    }
  };

  // Tagged People: Add & Remove with Automatic Count Updates
  const handleAddTagged = (person: TaggedPerson) => {
    setTaggedList((prev) => [person, ...prev]);
    setStats((prev) => ({ ...prev, tagged: prev.tagged + 1 }));
  };

  const handleRemoveTagged = (id: string) => {
    setTaggedList((prev) => prev.filter((p) => p.id !== id));
    setStats((prev) => ({ ...prev, tagged: Math.max(0, prev.tagged - 1) }));
  };

  // Add Photos option in Your Hubs: directly opens the device gallery/picker
  const handleAddPhotos = async () => {
    setActiveTab('hubs');
    setCreateHubInitialFormat('photo');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access to select photos from your device.');
        setCreateHubInitialMedia(undefined);
        setCreateHubInitialAdditional(undefined);
        setCreateHubModalVisible(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUris = result.assets.map((a) => a.uri);
        setCreateHubInitialMedia(pickedUris[0]);
        setCreateHubInitialAdditional(pickedUris.slice(1));
        setCreateHubDeviceImages(pickedUris);
        setCreateHubModalVisible(true);
      } else {
        // If user canceled the picker, still open modal
        setCreateHubInitialMedia(undefined);
        setCreateHubInitialAdditional(undefined);
        setCreateHubModalVisible(true);
      }
    } catch (e) {
      console.log('Error opening device gallery:', e);
      setCreateHubInitialMedia(undefined);
      setCreateHubInitialAdditional(undefined);
      setCreateHubModalVisible(true);
    }
  };

  // Video Upload option: device video file picker or demo cosmic video in HubClips format
  const handleUploadVideo = async () => {
    setActiveTab('hubclips');
    setCreateHubInitialFormat('video');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow video access to select videos from your device.');
        setCreateHubInitialMedia(undefined);
        setCreateHubModalVisible(true);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoUri = result.assets[0].uri;
        setCreateHubInitialMedia(videoUri);
        setCreateHubDeviceImages([videoUri]);
        setCreateHubModalVisible(true);
      } else {
        setCreateHubInitialMedia(undefined);
        setCreateHubModalVisible(true);
      }
    } catch (e) {
      console.log('Error opening video library:', e);
      setCreateHubInitialMedia(undefined);
      setCreateHubModalVisible(true);
    }
  };

  // Long-press multi-selection handlers on profile grid (Item 2)
  const handleLongPressGridPost = (post: HubPost) => {
    setIsGridSelectMode(true);
    if (!selectedGridPostIds.includes(post.id)) {
      setSelectedGridPostIds((prev) => [...prev, post.id]);
    }
  };

  const handleSelectGridPost = (post: HubPost) => {
    if (selectedGridPostIds.includes(post.id)) {
      const next = selectedGridPostIds.filter((id) => id !== post.id);
      setSelectedGridPostIds(next);
      if (next.length === 0) {
        setIsGridSelectMode(false);
      }
    } else {
      setSelectedGridPostIds((prev) => [...prev, post.id]);
    }
  };

  const handleCancelGridSelection = () => {
    setIsGridSelectMode(false);
    setSelectedGridPostIds([]);
  };

  // Upload/Proceed with selected images together (Item 2 & 4)
  const handleUploadSelectedGrid = () => {
    const selectedPosts = hubsPosts.filter((p) => selectedGridPostIds.includes(p.id));
    if (selectedPosts.length === 0) return;

    const allImages: string[] = [];
    selectedPosts.forEach((p) => {
      if (p.imageUrl) allImages.push(p.imageUrl);
      if (p.additionalImages) {
        allImages.push(...p.additionalImages);
      }
    });

    const uniqueImages = Array.from(new Set(allImages));
    if (uniqueImages.length > 0) {
      setCreateHubInitialMedia(uniqueImages[0]);
      setCreateHubInitialAdditional(uniqueImages.slice(1));
      setCreateHubModalVisible(true);
    }
    handleCancelGridSelection();
  };

  // Active post ID for inline editing in the same section
  const [activeEditingPostId, setActiveEditingPostId] = useState<string | null>(null);

  // Edit Latest Hub option - opens in the SAME section (no different layout)
  const handleEditLatestHub = () => {
    if (hubsPosts.length > 0) {
      setActiveEditingPostId((prev) => (prev === hubsPosts[0].id ? null : hubsPosts[0].id));
    } else {
      Alert.alert('No Hubs Found', 'You do not have any hubs yet. Tap "Upload Photos" to create your first one.');
    }
  };

  // Create new Hub / Clip / Saved Post
  const handleCreatePost = (newPost: HubPost) => {
    const isVideo =
      newPost.mediaType === 'video' ||
      newPost.tabType === 'hubclips' ||
      (Boolean(newPost.imageUrl) &&
        (newPost.imageUrl.endsWith('.mp4') ||
          newPost.imageUrl.endsWith('.mov') ||
          newPost.imageUrl.includes('gtv-videos-bucket')));

    const postToAdd: HubPost = isVideo
      ? { ...newPost, mediaType: 'video', tabType: 'hubclips' }
      : { ...newPost, mediaType: 'image', tabType: 'hubs' };

    setPosts((prev) => [postToAdd, ...prev]);

    if (isVideo) {
      setActiveTab('hubclips');
    } else {
      setActiveTab('hubs');
      setStats((prev) => ({ ...prev, hubs: prev.hubs + 1 }));
    }
    if (postToAdd.likes) {
      setStats((prev) => ({ ...prev, likes: prev.likes + postToAdd.likes }));
    }

    // Immediately sync newly created hub with Home page feed!
    onPostCreated?.(postToAdd);
  };

  // Open Share Post Modal with unique Post ID, links, and in-app contacts
  const handleOpenSharePost = (post: HubPost) => {
    setSelectedSharePost(post);
    setShareModalVisible(true);
  };

  // Open Post in Detail Modal
  const handleOpenPost = (post: HubPost) => {
    setSelectedPost(post);
    setPostDetailModalVisible(true);
  };

  // Update post caption or details
  const handleUpdatePost = (updated: HubPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPost && selectedPost.id === updated.id) {
      setSelectedPost(updated);
    }
  };

  // Delete post with automatic Hubs count update
  const handleDeletePost = (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (postToDelete && postToDelete.tabType === 'hubs') {
      setStats((prev) => ({ ...prev, hubs: Math.max(0, prev.hubs - 1) }));
    }
    if (postToDelete && postToDelete.likes) {
      setStats((prev) => ({ ...prev, likes: Math.max(0, prev.likes - postToDelete.likes) }));
    }
    setPostDetailModalVisible(false);
    setSelectedPost(null);
    const isClip = postToDelete?.mediaType === 'video' || postToDelete?.tabType === 'hubclips';
    Alert.alert(
      isClip ? 'HubClip Deleted' : 'Deleted',
      isClip ? 'Video clip has been removed from HubClips.' : 'Post has been removed.'
    );
  };

  // Interactive like / unlike (increments / decrements counts in real-time)
  const handleToggleLike = (targetPost: HubPost) => {
    const isNowLiked = !targetPost.isLiked;
    const delta = isNowLiked ? 1 : -1;
    const updated: HubPost = {
      ...targetPost,
      isLiked: isNowLiked,
      likes: Math.max(0, targetPost.likes + delta),
    };
    handleUpdatePost(updated);

    // Update profile-wide total likes count
    setStats((prev) => ({
      ...prev,
      likes: Math.max(0, prev.likes + delta),
    }));
  };

  // Save / Bookmark video or post into Saved section
  const handleToggleSave = (targetPost: HubPost) => {
    const isNowSaved = !targetPost.isSaved;
    const updated: HubPost = {
      ...targetPost,
      isSaved: isNowSaved,
    };
    handleUpdatePost(updated);

    if (isNowSaved) {
      const alreadySaved = posts.some(
        (p) => p.tabType === 'saved' && (p.id === `saved_${targetPost.id}` || p.imageUrl === targetPost.imageUrl)
      );
      if (!alreadySaved && targetPost.tabType !== 'saved') {
        const savedCopy: HubPost = {
          ...targetPost,
          id: `saved_${targetPost.id}_${Date.now()}`,
          tabType: 'saved',
          isSaved: true,
        };
        setPosts((prev) => [savedCopy, ...prev]);
      }
      Alert.alert('Saved', `${targetPost.mediaType === 'video' ? 'Video clip' : 'Hub post'} added to your Saved section.`);
    } else {
      if (targetPost.tabType === 'saved') {
        setPosts((prev) => prev.filter((p) => p.id !== targetPost.id));
        setPostDetailModalVisible(false);
      }
      Alert.alert('Removed', 'Removed from your Saved section.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent', paddingTop: insets.top }]}>
      {/* Atmosphere Background Gradient matching Home Page */}
      <LinearGradient
        colors={
          themeMode === 'dark'
            ? ['#140C2C', '#1B0E3C', '#0A0518']
            : ['#E5F0FF', '#D8E8FC', '#C8DFFA']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Navigation Bar: Sun toggle (left), HiHubble Mascot (center), Notification Bell, Profile Avatar (right) */}
      {!hideTopBar && (
        <TopBar
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          avatarUrl={user.avatarUrl}
          onAvatarPress={handleChangeAvatar}
          onLogoPress={handleMascotPress}
          onNotificationPress={() => setNotificationsModalVisible(true)}
          hasUnreadNotifications={hasUnreadNotifications}
        />
      )}

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={BRAND_COLORS.purplePrimary}
            colors={[BRAND_COLORS.purplePrimary]}
          />
        }
      >
        {/* Main Profile Card Container matching screenshot */}
        <View style={[styles.mainCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {/* Card Header & Cover Banner: Settings Cog (Left), "Profile" Title, Mascot Badge (Right), and Adjust & Upload Cover */}
          <CoverBanner
            themeMode={themeMode}
            coverUrl={user.coverUrl}
            onSettingsPress={() => setSettingsModalVisible(true)}
            onEditCoverPress={() => setCoverModalVisible(true)}
            onMascotPress={handleMascotPress}
          />

          {/* Profile Info: Avatar on Left, Hymasri / @hymasri / Bio on Right in horizontal row */}
          <ProfileInfo
            user={user}
            themeMode={themeMode}
            onEditPress={() => {
              setOpenedEditFromSettings(false);
              setEditProfileModalVisible(true);
            }}
            onSharePress={handleShare}
            onMascotPress={handleMascotPress}
            onAvatarPress={handleChangeAvatar}
            onAvatarLongPress={() => setProfilePhotoModalVisible(true)}
          />

          {/* Stats Row: 3 Distinct Rounded Card Boxes: YOUR HUBS, HUBBERS, HUBBIES with click access */}
          <StatsRow
            stats={stats}
            themeMode={themeMode}
            onPressStat={handleStatPress}
          />

          {/* Interactive Tabs Row matching screenshot: YOUR HUBS, Hubclips, Saved Hubbs, Tagged, Hubbers, Hubbies */}
          <TabsRow
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            themeMode={themeMode}
            hubsCount={stats.hubs}
            hubbersCount={stats.hubbers}
            hubbiesCount={stats.hubbies}
            taggedCount={stats.tagged}
          />

          {/* ============================================================ */}
          {/* TAB 1: Hubclips (Default active in screenshot)              */}
          {/* ============================================================ */}
          {activeTab === 'hubclips' && (
            <View style={styles.tabContentContainer}>
              {/* Action Toolbar for HubClips: Upload Video Clip */}
              <View style={styles.hubsActionBar}>
                <View style={styles.hubsActionButtons}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleUploadVideo}
                    style={[styles.hubsActionBtn, { backgroundColor: '#0EA5E9' }]}
                  >
                    <Ionicons name="videocam" size={14} color="#FFFFFF" />
                    <Text style={styles.hubsActionBtnText}>Upload HubClip</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {clipsPosts.length > 0 ? (
                <ClipsGrid
                  clips={clipsPosts}
                  themeMode={themeMode}
                  user={user}
                  onPressClip={handleOpenPost}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                  onShareClip={handleOpenSharePost}
                  onUpdateClip={handleUpdatePost}
                  onEditClip={(clip, newCaption) =>
                    handleUpdatePost({ ...clip, caption: newCaption })
                  }
                  onDeleteClip={handleDeletePost}
                />
              ) : (
                <View
                  style={[
                    styles.cleanEmptyContainer,
                    {
                      backgroundColor: colors.statCardBg,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={[styles.emptyIconCircle, { backgroundColor: '#0EA5E9' }]}>
                    <Ionicons name="videocam" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.cleanEmptyTitle, { color: colors.textPrimary }]}>
                    No HubClips Uploaded Yet
                  </Text>
                  <Text style={[styles.cleanEmptyText, { color: colors.textSecondary }]}>
                    Upload short videos from your device to share in HubClips format with your cosmic community.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleUploadVideo}
                    style={styles.cleanEmptyActionBtnWrapper}
                  >
                    <LinearGradient
                      colors={['#0EA5E9', '#0284C7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cleanEmptyActionBtn}
                    >
                      <Ionicons name="videocam" size={15} color="#FFFFFF" />
                      <Text style={styles.cleanEmptyActionBtnText}>Upload HubClip</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 2: YOUR HUBS                                            */}
          {/* ============================================================ */}
          {activeTab === 'hubs' && (
            <View style={styles.tabContentContainer}>
              {/* Action Toolbar for Your Hubs: Upload Photos & Edit */}
              <View style={styles.hubsActionBar}>
                <View style={styles.hubsActionButtons}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleAddPhotos}
                    style={[styles.hubsActionBtn, { backgroundColor: BRAND_COLORS.purplePrimary }]}
                  >
                    <Feather name="upload-cloud" size={14} color="#FFFFFF" />
                    <Text style={styles.hubsActionBtnText}>Upload Photos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleEditLatestHub}
                    style={[
                      styles.hubsActionBtnOutline,
                      { borderColor: colors.border, backgroundColor: colors.statCardBg },
                    ]}
                  >
                    <Feather name="edit-3" size={14} color={colors.textPrimary} />
                    <Text style={[styles.hubsActionBtnOutlineText, { color: colors.textPrimary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>

                {isGridSelectMode && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCancelGridSelection}
                    style={styles.cancelSelectionChip}
                  >
                    <Ionicons name="close-circle" size={14} color="#FF4D6D" />
                    <Text style={styles.cancelSelectionText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Floating Multi-Select Toolbar (Item 2: Selected Count & Single-Tap Upload) */}
              {isGridSelectMode && selectedGridPostIds.length > 0 && (
                <View
                  style={[
                    styles.multiSelectFloatingBar,
                    { backgroundColor: colors.cardBg, borderColor: BRAND_COLORS.purplePrimary },
                  ]}
                >
                  <View style={styles.multiSelectCountBox}>
                    <View style={styles.multiSelectBadge}>
                      <Ionicons name="images" size={14} color="#FFFFFF" />
                      <Text style={styles.multiSelectBadgeText}>{selectedGridPostIds.length}</Text>
                    </View>
                    <Text style={[styles.multiSelectLabel, { color: colors.textPrimary }]}>
                      {selectedGridPostIds.length === 1
                        ? '1 image selected'
                        : `${selectedGridPostIds.length} images selected`}
                    </Text>
                  </View>

                  <View style={styles.multiSelectActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleUploadSelectedGrid}
                      style={styles.multiSelectProceedBtn}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.multiSelectGradient}
                      >
                        <Feather name="upload-cloud" size={13} color="#FFFFFF" />
                        <Text style={styles.multiSelectProceedText}>
                          Upload Together ({selectedGridPostIds.length})
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleCancelGridSelection}
                      style={[styles.multiSelectCancelBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Posts Grid with inline Edit & Comment sections */}
              {hubsPosts.length > 0 ? (
                <PostsGrid
                  posts={hubsPosts}
                  themeMode={themeMode}
                  user={user}
                  onPressPost={handleOpenPost}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                  onSharePost={handleOpenSharePost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  activeEditingPostId={activeEditingPostId}
                  onClearActiveEditing={() => setActiveEditingPostId(null)}
                  isSelectionMode={isGridSelectMode}
                  selectedPostIds={selectedGridPostIds}
                  onLongPressPost={handleLongPressGridPost}
                  onSelectPost={handleSelectGridPost}
                />
              ) : (
                <View
                  style={[
                    styles.cleanEmptyContainer,
                    {
                      backgroundColor: colors.statCardBg,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={styles.emptyIconCircle}>
                    <Feather name="upload-cloud" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.cleanEmptyTitle, { color: colors.textPrimary }]}>
                    No Posts in Your Hubs Yet
                  </Text>
                  <Text style={[styles.cleanEmptyText, { color: colors.textSecondary }]}>
                    Upload photos from your device to share with your cosmic community. Swipeable albums and Instagram filters included.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleAddPhotos}
                    style={styles.cleanEmptyActionBtnWrapper}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cleanEmptyActionBtn}
                    >
                      <Feather name="folder-plus" size={15} color="#FFFFFF" />
                      <Text style={styles.cleanEmptyActionBtnText}>Upload Photos</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 3: Saved Hubbs                                          */}
          {/* ============================================================ */}
          {activeTab === 'saved' && (
            <View style={styles.savedSectionWrapper}>
              <View style={styles.savedFilterRow}>
                {(['all', 'videos', 'photos'] as const).map((filter) => {
                  const isSelected = savedFilter === filter;
                  const label = filter === 'all' ? 'All' : filter === 'videos' ? 'Videos' : 'Photos';
                  return (
                    <TouchableOpacity
                      key={filter}
                      activeOpacity={0.8}
                      onPress={() => setSavedFilter(filter)}
                      style={[
                        styles.savedFilterChip,
                        isSelected
                          ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                          : { backgroundColor: colors.statCardBg, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.savedFilterText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {savedPosts.length > 0 ? (
                <PostsGrid
                  posts={savedPosts}
                  themeMode={themeMode}
                  onPressPost={handleOpenPost}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                  onSharePost={handleOpenSharePost}
                />
              ) : (
                <View style={styles.cleanEmptyContainer}>
                  <Text style={[styles.cleanEmptyText, { color: colors.textSecondary }]}>
                    No saved Hubs yet.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* TAB 4: Tagged People                                         */}
          {/* ============================================================ */}
          {activeTab === 'tagged' && (
            <TaggedSection
              taggedList={taggedList}
              taggedPosts={hubsPosts}
              themeMode={themeMode}
              onAddTagged={handleAddTagged}
              onRemoveTagged={handleRemoveTagged}
              onPressPost={handleOpenPost}
            />
          )}

          {/* ============================================================ */}
          {/* TAB 5: Hubbers                                               */}
          {/* ============================================================ */}
          {activeTab === 'hubbers' && (
            <MembersListSection
              type="hubbers"
              members={hubbersList}
              themeMode={themeMode}
              onAddMember={handleAddHubber}
              onRemoveMember={handleRemoveHubber}
              onToggleFollow={handleToggleFollow}
              onRestrictMember={handleRestrictUser}
              onBlockMember={handleBlockUser}
            />
          )}

          {/* ============================================================ */}
          {/* TAB 6: Hubbies                                               */}
          {/* ============================================================ */}
          {activeTab === 'hubbies' && (
            <MembersListSection
              type="hubbies"
              members={hubbiesList}
              themeMode={themeMode}
              onAddMember={handleAddHubbie}
              onRemoveMember={handleRemoveHubbie}
              onToggleFollow={handleToggleFollow}
              onRestrictMember={handleRestrictUser}
              onBlockMember={handleBlockUser}
            />
          )}
        </View>
      </ScrollView>

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}

      {/* 1. Edit Cover Modal (Adjust First -> Then Upload) */}
      <EditCoverModal
        visible={coverModalVisible}
        themeMode={themeMode}
        currentCoverUrl={user.coverUrl}
        onClose={() => setCoverModalVisible(false)}
        onSelectCover={handleSelectCover}
      />

      {/* 2. Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        themeMode={themeMode}
        user={user}
        onClose={() => {
          setEditProfileModalVisible(false);
          if (openedEditFromSettings) {
            setOpenedEditFromSettings(false);
            setSettingsModalVisible(true);
          }
        }}
        onSave={(updated) => {
          handleSaveProfile(updated);
          setEditProfileModalVisible(false);
          if (openedEditFromSettings) {
            setOpenedEditFromSettings(false);
            setSettingsModalVisible(true);
          }
        }}
      />

      {/* 3. Hubbers & Hubbies Modal */}
      <FollowersModal
        visible={followersModalVisible}
        type={followersModalType}
        themeMode={themeMode}
        onClose={() => setFollowersModalVisible(false)}
        onUpdateStats={handleUpdateFollowStats}
      />

      {/* 4. Settings Preferences Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        themeMode={themeMode}
        userAvatarUrl={user.avatarUrl}
        onUploadAvatar={handleChangeAvatar}
        onToggleTheme={handleToggleTheme}
        onEditProfile={() => {
          setOpenedEditFromSettings(true);
          setSettingsModalVisible(false);
          setEditProfileModalVisible(true);
        }}
        onEditCover={() => setCoverModalVisible(true)}
        onLogout={onLogout || (() => Alert.alert('Logged Out', 'You have been successfully logged out.'))}
        onDeleteAccount={() => {
          setPosts([]);
          setStats({ hubs: 0, hubbers: 0, hubbies: 0, tagged: 0, likes: 0 });
        }}
        onClose={() => {
          setOpenedEditFromSettings(false);
          setSettingsModalVisible(false);
        }}
        restrictedUsers={restrictedUsers}
        onAddRestricted={handleRestrictUser}
        onRemoveRestricted={handleUnrestrictUser}
        blockedUsers={blockedUsers}
        onAddBlocked={handleBlockUser}
        onRemoveBlocked={handleUnblockUser}
      />

      {/* 5. Create Hub Modal */}
      <CreateHubModal
        visible={createHubModalVisible}
        activeTab={activeTab}
        themeMode={themeMode}
        initialMediaUri={createHubInitialMedia}
        initialAdditionalImages={createHubInitialAdditional}
        initialDeviceImages={createHubDeviceImages}
        initialFormat={createHubInitialFormat}
        user={user}
        onClose={() => {
          setCreateHubModalVisible(false);
          setCreateHubInitialMedia(undefined);
          setCreateHubInitialAdditional(undefined);
        }}
        onCreatePost={handleCreatePost}
      />

      {/* 6. Post Detail Modal */}
      <PostDetailModal
        visible={postDetailModalVisible}
        post={selectedPost}
        user={user}
        themeMode={themeMode}
        onClose={() => {
          setPostDetailModalVisible(false);
          setSelectedPost(null);
        }}
        onUpdatePost={handleUpdatePost}
        onDeletePost={handleDeletePost}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onSharePost={handleOpenSharePost}
      />

      {/* 7. Profile Photo Adjust Modal (Drag with finger, Zoom In/Out, Rotate) */}
      {candidateProfileUri ? (
        <CropAvatarModal
          visible={adjustProfileModalVisible}
          imageUri={candidateProfileUri}
          themeMode={themeMode}
          onClose={() => setAdjustProfileModalVisible(false)}
          onCropDone={handleAdjustProfileDone}
        />
      ) : null}

      {/* 8. Notifications Activity Modal */}
      <NotificationsModal
        visible={notificationsModalVisible}
        themeMode={themeMode}
        onClose={() => setNotificationsModalVisible(false)}
        onClearBadge={() => setHasUnreadNotifications(false)}
      />

      {/* 9. Share Post Modal (Share through ID, Copy Link, Direct Send) */}
      <SharePostModal
        visible={shareModalVisible}
        post={selectedSharePost}
        user={user}
        themeMode={themeMode}
        onClose={() => {
          setShareModalVisible(false);
          setSelectedSharePost(null);
        }}
      />

      {/* 10. Profile Photo Full View Modal on Long Press */}
      <ProfilePhotoViewModal
        visible={profilePhotoModalVisible}
        user={user}
        themeMode={themeMode}
        onClose={() => setProfilePhotoModalVisible(false)}
        onChangePhoto={handleChangeAvatar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  mainCard: {
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabContentContainer: {
    width: '100%',
  },
  cleanEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND_COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cleanEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  cleanEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  cleanEmptyActionBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cleanEmptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
  },
  cleanEmptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hubsActionBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  hubsActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hubsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  hubsActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hubsActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 10,
    borderWidth: 1.2,
    gap: 5,
  },
  hubsActionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  savedSectionWrapper: {
    width: '100%',
  },
  savedFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  savedFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  savedFilterText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cancelSelectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 109, 0.12)',
  },
  cancelSelectionText: {
    color: '#FF4D6D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  multiSelectFloatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  multiSelectCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiSelectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  multiSelectBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  multiSelectLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  multiSelectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  multiSelectProceedBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  multiSelectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  multiSelectProceedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  multiSelectCancelBtn: {
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
});

export default ProfileScreen;
