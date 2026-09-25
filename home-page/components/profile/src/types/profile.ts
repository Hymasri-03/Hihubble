export type TabType = 'hubs' | 'hubclips' | 'saved' | 'hubbers' | 'hubbies' | 'tagged';

export type ThemeMode = 'light' | 'dark';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  isVerified?: boolean;
  roleBadge?: string;
  joinedDate?: string;
  location?: string;
  phoneNumber?: string;
  preferredOtpMethod?: 'SMS' | 'WhatsApp' | 'Email';
}

export interface ProfileStats {
  hubs: number;
  hubbers: number;
  hubbies: number;
  tagged: number;
  likes: number;
}

export interface MemberPerson {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isFollowing: boolean;
  roleBadge?: string;
  joinedDate?: string;
}

export interface TaggedPerson {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  taggedInTitle?: string;
  taggedDate?: string;
  roleBadge?: string;
}

export interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isPinned?: boolean;
}

export interface HubPost {
  id: string;
  shareId?: string;
  imageUrl: string;
  additionalImages?: string[];
  mediaType?: 'image' | 'video';
  tabType?: TabType;
  postType?: 'post' | 'story';
  isStory?: boolean;
  storyExpiresAt?: string;
  caption?: string;
  hashtags?: string[];
  filter?: string;
  aspectRatio?: number;
  aspectRatioLabel?: string;
  likes: number;
  comments: number;
  commentsList?: CommentItem[];
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
  allowComments?: boolean;
}

export interface StoryItem {
  id: string;
  shareId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  filter?: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  isSeen?: boolean;
  originalPostId?: string;
}

export interface Hubclip {
  id: string;
  thumbnailUrl: string;
  title: string;
  views: number;
  duration: string;
}

export interface ProfileScreenProps {
  initialUser?: UserProfile;
  initialStats?: ProfileStats;
  themeMode?: ThemeMode;
  isDark?: boolean;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onSettingsPress?: () => void;
  onThemeToggle?: (mode: ThemeMode) => void;
  hideTopBar?: boolean;
  onLogout?: () => void;
  onPostCreated?: (post: HubPost) => void;
}
