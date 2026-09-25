import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  FILTER_STYLES,
  TextOverlay,
  StickerOverlay,
  ImageAdjustments,
  getFontFamilyStyle,
  StoryMusicTrack,
  StoryLocation,
  playAudioPreview,
  pauseAudioPreview,
  stopAudioPreview,
  getAdjustmentsFilterStyle,
  MediaAdjustmentsOverlay,
} from './ShareHubbModal';

export interface StoryData {
  id: string;
  authorName: string;
  authorAvatar: string;
  mediaUri: string;
  thumbnailUri?: string;
  mediaType?: 'image' | 'video';   // explicit type — prevents misdetection
  caption?: string;
  timeAgo: string;
  createdAt?: number;
  expiresAt?: number;
  isUserStory?: boolean;
  filter?: string;
  crop?: { aspect: string; zoom: number };
  rotation?: number;
  adjustments?: ImageAdjustments;
  stickers?: StickerOverlay[];
  texts?: TextOverlay[];
  music?: StoryMusicTrack;
  location?: StoryLocation;
}

export function getStoryTimeRemaining(createdAt?: number): string {
  if (!createdAt) return '24h story';
  const elapsed = Date.now() - createdAt;
  const remaining = 24 * 60 * 60 * 1000 - elapsed;
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / (3600 * 1000));
  if (hours > 0) return `${hours}h left`;
  const mins = Math.max(1, Math.floor(remaining / (60 * 1000)));
  return `${mins}m left`;
}

const getAspectRatioValue = (ratio: string): number | undefined => {
  switch (ratio) {
    case '1:1': return 1;
    case '4:5': return 4 / 5;
    case '3:4': return 3 / 4;
    case '16:9': return 16 / 9;
    case '9:16': return 9 / 16;
    case 'Story': return 9 / 16;
    default: return undefined;
  }
};

export interface StoryUserGroup {
  id: string;
  name: string;
  avatar: string;
  isUserStory?: boolean;
  stories: StoryData[];
}

export function isStoryNotExpired(story: StoryData | { createdAt?: number }): boolean {
  if (!story.createdAt) return true;
  return Date.now() - story.createdAt < 24 * 60 * 60 * 1000;
}

export interface StoryViewerModalProps {
  /** Legacy single-story support */
  story?: StoryData;
  /** Index of current story in legacy single list (0-based) */
  storyIndex?: number;
  /** Total number of stories in legacy single list */
  storyCount?: number;

  /** Multi-user & Multi-story sequence (Instagram-style) */
  userGroups?: StoryUserGroup[];
  initialUserIndex?: number;
  initialStoryIndex?: number;

  isDark?: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onAddStory?: () => void;
  onDeleteStory?: (storyId?: string) => void;
  onOpenChatSection?: (chatId?: string) => void;
  onShareStoryToChat?: (contactId: string, story: StoryData, text?: string) => void;
}

const { width, height } = Dimensions.get('window');

// Story duration in ms
const STORY_DURATION = 5000;

function StoryVideoPlayer({
  uri,
  thumbnailUri,
  scale = 1,
  rotation = 0,
  adjustments,
  contentFit = 'contain',
  isPaused = false,
}: {
  uri: string;
  thumbnailUri?: string;
  scale?: number;
  rotation?: number;
  adjustments?: ImageAdjustments | null;
  contentFit?: 'contain' | 'cover';
  isPaused?: boolean;
}) {
  const player = useVideoPlayer(uri, (p) => {
    try {
      p.loop = true;
      p.muted = false;
      p.play();
    } catch (e) {
      console.log('Story video play error:', e);
    }
  });

  useEffect(() => {
    try {
      if (isPaused) {
        player.pause();
      } else {
        player.play();
      }
    } catch (e) {
      // safe ignore
    }
  }, [player, isPaused]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        style={[
          styles.backgroundImage,
          {
            width: '100%',
            height: '100%',
            opacity: adjustments ? adjustments.opacity / 100 : 1,
            transform: [{ scale }, { rotate: `${rotation}deg` }],
            ...getAdjustmentsFilterStyle(adjustments),
          },
        ]}
        player={player}
        contentFit={contentFit}
        nativeControls={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

export interface StoryViewerUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  timeAgo: string;
  hasLiked: boolean;
  isFollowing?: boolean;
}

const DEFAULT_STORY_VIEWERS: StoryViewerUser[] = [
  {
    id: 'usr_1',
    name: 'Sarah Chen',
    username: '@sarah.c',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    timeAgo: '4m ago',
    hasLiked: true,
    isFollowing: true,
  },
  {
    id: 'usr_2',
    name: 'Alex Rivers',
    username: '@alex_rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    timeAgo: '12m ago',
    hasLiked: true,
    isFollowing: false,
  },
  {
    id: 'usr_3',
    name: 'Jamie Sun',
    username: '@jamie_sun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    timeAgo: '26m ago',
    hasLiked: true,
    isFollowing: true,
  },
  {
    id: 'usr_4',
    name: 'Marcus Vance',
    username: '@marcus.v',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    timeAgo: '45m ago',
    hasLiked: false,
    isFollowing: false,
  },
  {
    id: 'usr_5',
    name: 'Elena Rostova',
    username: '@elena_r',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    timeAgo: '1h ago',
    hasLiked: true,
    isFollowing: true,
  },
  {
    id: 'usr_6',
    name: 'Maya Lin',
    username: '@maya_create',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    timeAgo: '1h ago',
    hasLiked: false,
    isFollowing: true,
  },
  {
    id: 'usr_7',
    name: 'Jordan Blake',
    username: '@jordan_b',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    timeAgo: '2h ago',
    hasLiked: true,
    isFollowing: false,
  },
  {
    id: 'usr_8',
    name: 'Chloe Kim',
    username: '@chloe.art',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    timeAgo: '3h ago',
    hasLiked: false,
    isFollowing: true,
  },
];

const STORY_SHARE_CONTACTS = [
  { id: 'c1', name: 'VARMA', username: '@varma', isSpecialIcon: true },
  { id: 'c2', name: 'Musireddy Anjali', username: '@anjali_m', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: 'c3', name: 'Alex Rivers', username: '@alex_rivers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'c4', name: 'Jamie Sun', username: '@jamiesun', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'c5', name: 'Sarah Chen', username: '@sarahchen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'c6', name: 'Marcus', username: '@marcus_trails', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

export default function StoryViewerModal({
  story: initialStory,
  storyIndex,
  storyCount,
  userGroups,
  initialUserIndex = 0,
  initialStoryIndex = 0,
  isDark = false,
  onClose,
  onNext,
  onPrev,
  onAddStory,
  onDeleteStory,
  onOpenChatSection,
  onShareStoryToChat,
}: StoryViewerModalProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex ?? 0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex ?? 0);

  useEffect(() => {
    if (initialUserIndex !== undefined) setCurrentUserIndex(initialUserIndex);
  }, [initialUserIndex]);

  useEffect(() => {
    if (initialStoryIndex !== undefined) setCurrentStoryIndex(initialStoryIndex);
  }, [initialStoryIndex]);

  const effectiveGroups: StoryUserGroup[] = useMemo(() => {
    if (userGroups && userGroups.length > 0) return userGroups;
    if (initialStory) {
      return [
        {
          id: initialStory.id,
          name: initialStory.authorName,
          avatar: initialStory.authorAvatar,
          isUserStory: initialStory.isUserStory,
          stories: [initialStory],
        },
      ];
    }
    return [];
  }, [userGroups, initialStory]);

  const currentUserGroup = effectiveGroups[currentUserIndex] || effectiveGroups[0];
  const userStories: StoryData[] = useMemo(() => {
    return currentUserGroup ? currentUserGroup.stories.filter(isStoryNotExpired) : [];
  }, [currentUserGroup]);

  const activeStory: StoryData = userStories[currentStoryIndex] || userStories[0] || initialStory;
  const story = activeStory; // alias for the rest of JSX
  const currentStoryCount = userStories.length;
  const activeStoryCount = (userGroups && userGroups.length > 0) ? currentStoryCount : (storyCount || 1);
  const activeStoryIndex = (userGroups && userGroups.length > 0) ? currentStoryIndex : (storyIndex || 0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isStoryMuted, setIsStoryMuted] = useState(false);

  // Reply Input & Notification States
  const [replyText, setReplyText] = useState('');
  const [replyToast, setReplyToast] = useState<string | null>(null);

  // Press & Hold and Reply Typing Pause States
  const [isHolding, setIsHolding] = useState(false);
  const [isTypingReply, setIsTypingReply] = useState(false);
  const isPausedRef = useRef(false);
  const pressStartTimeRef = useRef(0);

  // Share to Chat Modal States
  const [isShareChatModalOpen, setIsShareChatModalOpen] = useState(false);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [sentShareMap, setSentShareMap] = useState<Record<string, boolean>>({});
  const [lastSharedContactId, setLastSharedContactId] = useState<string | null>(null);

  // Story Activity Bottom Sheet States (Views & Likes)
  const [isActivitySheetOpen, setIsActivitySheetOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'views' | 'likes'>('views');
  const [viewerSearchQuery, setViewerSearchQuery] = useState('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    usr_1: true,
    usr_3: true,
    usr_5: true,
    usr_6: true,
    usr_8: true,
  });
  const savedProgressRef = useRef(0);

  // Background music preview playback
  useEffect(() => {
    if (story?.music?.previewUrl && !isStoryMuted) {
      playAudioPreview(story.music.previewUrl, true);
    } else {
      pauseAudioPreview();
    }

    return () => {
      stopAudioPreview();
    };
  }, [story?.id, story?.music?.previewUrl, isStoryMuted]);

  const toggleStoryAudioMute = () => {
    setIsStoryMuted((prev) => !prev);
  };

  // Update refs INLINE during render (synchronous, never stale)
  const onNextRef = useRef(onNext);
  const onCloseRef = useRef(onClose);
  const onPrevRef = useRef(onPrev);
  onNextRef.current = onNext;
  onCloseRef.current = onClose;
  onPrevRef.current = onPrev;

  // Guard against ghost tap / mouse event bleed-through on mount
  const mountTimeRef = useRef(Date.now());
  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, [currentUserIndex, currentStoryIndex]);

  // Handle advancing to next story / next person / close
  const handleNext = useCallback(() => {
    if (Date.now() - mountTimeRef.current < 250) {
      return;
    }
    animationRef.current?.stop();

    if (userGroups && userGroups.length > 0) {
      // 1. If a person has multiple stories, play all their stories one after another
      if (currentStoryIndex < userStories.length - 1) {
        setCurrentStoryIndex((prev) => prev + 1);
      } else if (currentUserIndex < effectiveGroups.length - 1) {
        // 2. After one person's story is completed, automatically continue to the next person's story without returning to the Home screen
        setCurrentUserIndex((prev) => prev + 1);
        setCurrentStoryIndex(0);
      } else {
        // 3. After all available stories have been viewed, automatically navigate back to the Home screen
        stopAudioPreview();
        onCloseRef.current();
      }
    } else {
      if (storyIndex !== undefined && storyCount !== undefined && storyIndex < storyCount - 1) {
        onNextRef.current ? onNextRef.current() : onCloseRef.current();
      } else {
        stopAudioPreview();
        onCloseRef.current();
      }
    }
  }, [userGroups, currentStoryIndex, userStories.length, currentUserIndex, effectiveGroups.length, storyIndex, storyCount]);

  // Handle navigating to previous story / previous person
  const handlePrev = useCallback(() => {
    if (Date.now() - mountTimeRef.current < 250) {
      return;
    }
    animationRef.current?.stop();

    if (userGroups && userGroups.length > 0) {
      if (currentStoryIndex > 0) {
        // Previous story of the same person
        setCurrentStoryIndex((prev) => prev - 1);
      } else if (currentUserIndex > 0) {
        // Go back to the previous person, on their last story!
        const prevGroup = effectiveGroups[currentUserIndex - 1];
        const prevStories = (prevGroup?.stories || []).filter(isStoryNotExpired);
        setCurrentUserIndex((prev) => prev - 1);
        setCurrentStoryIndex(Math.max(0, prevStories.length - 1));
      } else {
        // First story of first person — restart it from 0
        progressAnim.setValue(0);
        savedProgressRef.current = 0;
        const animation = Animated.timing(progressAnim, {
          toValue: 1,
          duration: STORY_DURATION,
          useNativeDriver: false,
        });
        animationRef.current = animation;
        animation.start(({ finished }) => {
          if (finished) {
            handleNext();
          }
        });
      }
    } else {
      if (storyIndex !== undefined && storyIndex > 0 && onPrevRef.current) {
        onPrevRef.current();
      } else {
        progressAnim.setValue(0);
        savedProgressRef.current = 0;
        const animation = Animated.timing(progressAnim, {
          toValue: 1,
          duration: STORY_DURATION,
          useNativeDriver: false,
        });
        animationRef.current = animation;
        animation.start(({ finished }) => {
          if (finished) {
            handleNext();
          }
        });
      }
    }
  }, [userGroups, currentStoryIndex, currentUserIndex, effectiveGroups, storyIndex, handleNext, progressAnim]);

  // Restart progress animation whenever user or story changes
  useEffect(() => {
    if (!story) return;
    progressAnim.setValue(0);
    savedProgressRef.current = 0;
    setIsLiked(false);
    isPausedRef.current = false;

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animationRef.current = animation;

    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => {
      animation.stop();
    };
  }, [currentUserIndex, currentStoryIndex, story?.id, handleNext, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isVideo =
    story?.mediaType === 'video' ||
    (
      story?.mediaType !== 'image' &&
      Boolean(
        story?.mediaUri?.endsWith('.mp4') ||
        story?.mediaUri?.endsWith('.mov') ||
        story?.mediaUri?.includes('/video/') ||
        (story?.mediaUri && /\.(mp4|mov|m4v|3gp|mkv|webm)($|\?)/i.test(story.mediaUri))
      )
    );

  const pauseStory = useCallback(() => {
    if (isPausedRef.current) return;
    isPausedRef.current = true;
    // @ts-ignore
    progressAnim.stopAnimation((val) => {
      savedProgressRef.current = typeof val === 'number' ? val : 0;
    });
    pauseAudioPreview();
  }, [progressAnim]);

  const resumeStory = useCallback(() => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    if (story?.music?.previewUrl && !isStoryMuted) {
      playAudioPreview(story.music.previewUrl, true);
    }
    const remainingRatio = Math.max(0.05, 1 - (savedProgressRef.current || 0));
    const remainingTime = Math.max(250, Math.round(STORY_DURATION * remainingRatio));
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    });
    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });
  }, [progressAnim, story?.music?.previewUrl, isStoryMuted, handleNext]);

  const handleOpenActivitySheet = (tab: 'views' | 'likes' = 'views') => {
    setActiveActivityTab(tab);
    setViewerSearchQuery('');
    pauseStory();
    setIsActivitySheetOpen(true);
  };

  const handleCloseActivitySheet = () => {
    setIsActivitySheetOpen(false);
    resumeStory();
  };

  const handleOpenShareChatModal = () => {
    pauseStory();
    setShareSearchQuery('');
    setIsShareChatModalOpen(true);
  };

  const handleCloseShareChatModal = () => {
    setIsShareChatModalOpen(false);
    resumeStory();
  };

  const handleSendReply = () => {
    const text = replyText.trim();
    if (!text) return;
    // Find contact that matches story author or default to 'c1'
    const matchedContact = STORY_SHARE_CONTACTS.find(
      (c) =>
        c.name.toLowerCase() === story.authorName.toLowerCase() ||
        story.authorName.toLowerCase().includes(c.name.toLowerCase())
    );
    const targetContactId = matchedContact ? matchedContact.id : 'c1';
    setLastSharedContactId(targetContactId);
    setSentShareMap((prev) => ({ ...prev, [targetContactId]: true }));
    onShareStoryToChat?.(targetContactId, story, text);
    setReplyToast(`Reply sent to ${story.authorName}!`);
    setReplyText('');
    setIsTypingReply(false);
    resumeStory();
    setTimeout(() => {
      setReplyToast(null);
    }, 2800);
  };

  const handleShareToContact = (contactId: string, contactName: string) => {
    setSentShareMap((prev) => ({ ...prev, [contactId]: true }));
    setLastSharedContactId(contactId);
    onShareStoryToChat?.(contactId, story);
    setReplyToast(`Story shared with ${contactName}!`);
    setTimeout(() => {
      setReplyToast(null);
    }, 2500);
  };

  const toggleFollowUser = (userId: string) => {
    setFollowingMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Base viewers combined with currentUser if liked
  const currentUserViewer: StoryViewerUser = {
    id: 'current_user',
    name: 'You',
    username: '@you',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    timeAgo: 'Just now',
    hasLiked: isLiked,
    isFollowing: true,
  };

  const allViewers: StoryViewerUser[] = [
    ...(isLiked ? [currentUserViewer] : []),
    ...DEFAULT_STORY_VIEWERS,
  ];

  const totalViewsCount = allViewers.length;
  const totalLikesCount = allViewers.filter((v) => v.hasLiked).length;

  const filteredViewers = allViewers.filter((v) => {
    if (activeActivityTab === 'likes' && !v.hasLiked) return false;
    if (viewerSearchQuery.trim()) {
      const q = viewerSearchQuery.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.username.toLowerCase().includes(q);
    }
    return true;
  });

  const renderActivitySheetModal = () => (
    <Modal
      visible={isActivitySheetOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseActivitySheet}
    >
      <View style={[styles.activityModalBackdrop, isDark && styles.activityModalBackdropDark]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCloseActivitySheet}
        />
        <View style={[styles.activitySheetContent, isDark && styles.activitySheetContentDark]}>
          {/* Top Drag Handle */}
          <View style={styles.activitySheetHandleWrap}>
            <View style={[styles.activitySheetHandle, isDark && styles.activitySheetHandleDark]} />
          </View>

          {/* Header Row */}
          <View style={[styles.activityHeaderRow, isDark && styles.activityHeaderRowDark]}>
            <View style={styles.activityHeaderLeft}>
              <Image
                source={{ uri: story.thumbnailUri || story.mediaUri }}
                style={[styles.activityStoryThumb, isDark && styles.activityStoryThumbDark]}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.activityHeaderTitle, isDark && styles.activityHeaderTitleDark]}>Story Activity</Text>
                <Text style={[styles.activityHeaderSub, isDark && styles.activityHeaderSubDark]}>
                  {story.authorName} • {story.timeAgo || 'Just now'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.activityCloseBtn, isDark && styles.activityCloseBtnDark]}
              activeOpacity={0.8}
              onPress={handleCloseActivitySheet}
              accessibilityLabel="Close activity sheet"
            >
              <Feather name="x" size={17} color={isDark ? '#FFFFFF' : '#1A112A'} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.activityTabsRow}>
            <TouchableOpacity
              style={[
                styles.activityTabPill,
                isDark && styles.activityTabPillDark,
                activeActivityTab === 'views' && (isDark ? styles.activityTabPillActiveDark : styles.activityTabPillActive),
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveActivityTab('views')}
            >
              <Feather
                name="eye"
                size={14}
                color={activeActivityTab === 'views' ? '#FFFFFF' : (isDark ? '#A594C4' : '#6E6187')}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.activityTabPillText,
                  isDark && styles.activityTabPillTextDark,
                  activeActivityTab === 'views' && styles.activityTabPillTextActive,
                ]}
              >
                Viewers ({totalViewsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.activityTabPill,
                isDark && styles.activityTabPillDark,
                activeActivityTab === 'likes' && (isDark ? styles.activityTabPillActiveDark : styles.activityTabPillActive),
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveActivityTab('likes')}
            >
              <Ionicons
                name="heart"
                size={14}
                color={activeActivityTab === 'likes' ? '#FFFFFF' : '#FF2A85'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.activityTabPillText,
                  isDark && styles.activityTabPillTextDark,
                  activeActivityTab === 'likes' && styles.activityTabPillTextActive,
                ]}
              >
                Likes ({totalLikesCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={[styles.activitySearchBox, isDark && styles.activitySearchBoxDark]}>
            <Feather name="search" size={16} color={isDark ? '#8E7EA8' : '#8E7EA8'} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.activitySearchInput, isDark && styles.activitySearchInputDark]}
              placeholder={activeActivityTab === 'views' ? 'Search viewers...' : 'Search likes...'}
              placeholderTextColor={isDark ? '#8E7EA8' : '#9A8EB3'}
              value={viewerSearchQuery}
              onChangeText={setViewerSearchQuery}
              autoCorrect={false}
            />
            {viewerSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setViewerSearchQuery('')}>
                <Feather name="x-circle" size={16} color={isDark ? '#8E7EA8' : '#8E7EA8'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Scrollable Viewers / Likers List */}
          <ScrollView
            style={styles.activityScrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          >
            {filteredViewers.length === 0 ? (
              <View style={styles.activityEmptyContainer}>
                <Feather
                  name={activeActivityTab === 'views' ? 'users' : 'heart'}
                  size={32}
                  color={isDark ? '#7A669B' : '#9E8EB8'}
                  style={{ marginBottom: 10 }}
                />
                <Text style={[styles.activityEmptyTitle, isDark && styles.activityEmptyTitleDark]}>
                  {viewerSearchQuery.trim()
                    ? 'No results found'
                    : activeActivityTab === 'views'
                    ? 'No viewers yet'
                    : 'No likes yet'}
                </Text>
                <Text style={[styles.activityEmptySub, isDark && styles.activityEmptySubDark]}>
                  {viewerSearchQuery.trim()
                    ? `We couldn't find "${viewerSearchQuery}"`
                    : activeActivityTab === 'views'
                    ? 'People who view this story will appear here.'
                    : 'When people like this story, they will appear here.'}
                </Text>
              </View>
            ) : (
              filteredViewers.map((viewer) => {
                const isFollowing = followingMap[viewer.id];
                const isCurrentUser = viewer.id === 'current_user';
                return (
                  <View key={viewer.id} style={[styles.activityUserRow, isDark && styles.activityUserRowDark]}>
                    <View style={styles.activityUserAvatarWrap}>
                      <Image source={{ uri: viewer.avatar }} style={[styles.activityUserAvatar, isDark && styles.activityUserAvatarDark]} />
                      {viewer.hasLiked && (
                        <View style={[styles.activityUserHeartBadge, isDark && styles.activityUserHeartBadgeDark]}>
                          <Ionicons name="heart" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    <View style={styles.activityUserInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.activityUserName, isDark && styles.activityUserNameDark]}>{viewer.name}</Text>
                        {isCurrentUser && (
                          <View style={[styles.activityYouTag, isDark && styles.activityYouTagDark]}>
                            <Text style={[styles.activityYouTagText, isDark && styles.activityYouTagTextDark]}>YOU</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.activityUserHandle, isDark && styles.activityUserHandleDark]}>
                        {viewer.username} • {viewer.timeAgo}
                      </Text>
                    </View>

                    <View style={styles.activityUserActions}>
                      {viewer.hasLiked && (
                        <View style={[styles.activityLikedPill, isDark && styles.activityLikedPillDark]}>
                          <Ionicons name="heart" size={13} color="#FF2A85" />
                        </View>
                      )}
                      {!isCurrentUser && (
                        <TouchableOpacity
                          style={[
                            styles.activityFollowBtn,
                            isFollowing && (isDark ? styles.activityFollowingBtnDark : styles.activityFollowingBtn),
                          ]}
                          activeOpacity={0.8}
                          onPress={() => toggleFollowUser(viewer.id)}
                        >
                          <Text
                            style={[
                              styles.activityFollowBtnText,
                              isFollowing && (isDark ? styles.activityFollowingBtnTextDark : styles.activityFollowingBtnText),
                            ]}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const filteredShareContacts = STORY_SHARE_CONTACTS.filter((c) => {
    if (!shareSearchQuery.trim()) return true;
    const q = shareSearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q);
  });

  const renderShareChatModal = () => (
    <Modal
      visible={isShareChatModalOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCloseShareChatModal}
    >
      <View style={[styles.activityModalBackdrop, isDark && styles.activityModalBackdropDark]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCloseShareChatModal}
        />
        <View style={[styles.shareChatSheetContent, isDark && styles.shareChatSheetContentDark]}>
          {/* Top Drag Handle */}
          <View style={styles.activitySheetHandleWrap}>
            <View style={[styles.activitySheetHandle, isDark && styles.activitySheetHandleDark]} />
          </View>

          {/* Header Row */}
          <View style={[styles.activityHeaderRow, isDark && styles.activityHeaderRowDark]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.activityStatIconWrapPurple, { width: 36, height: 36, borderRadius: 18, marginRight: 10 }]}>
                <Feather name="send" size={16} color={isDark ? '#C4A8FF' : '#7C3AED'} />
              </View>
              <View>
                <Text style={[styles.activityHeaderTitle, isDark && styles.activityHeaderTitleDark]}>
                  Share to Chat
                </Text>
                <Text style={[styles.activityHeaderSub, isDark && styles.activityHeaderSubDark]}>
                  Send story to friends or start chatting
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.activityCloseBtn, isDark && styles.activityCloseBtnDark]}
              activeOpacity={0.8}
              onPress={handleCloseShareChatModal}
              accessibilityLabel="Close share sheet"
            >
              <Feather name="x" size={17} color={isDark ? '#FFFFFF' : '#1A112A'} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={[styles.activitySearchBox, isDark && styles.activitySearchBoxDark, { marginTop: 12 }]}>
            <Feather name="search" size={16} color="#8E7EA8" style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.activitySearchInput, isDark && styles.activitySearchInputDark]}
              placeholder="Search contacts & chats..."
              placeholderTextColor={isDark ? '#8E7EA8' : '#9A8EB3'}
              value={shareSearchQuery}
              onChangeText={setShareSearchQuery}
              autoCorrect={false}
            />
            {shareSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setShareSearchQuery('')}>
                <Feather name="x-circle" size={16} color="#8E7EA8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Contacts List */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 16 }}
          >
            {filteredShareContacts.map((contact) => {
              const isSent = !!sentShareMap[contact.id];
              return (
                <TouchableOpacity
                  key={contact.id}
                  style={[styles.activityUserRow, isDark && styles.activityUserRowDark]}
                  activeOpacity={0.7}
                  onPress={() => {
                    handleShareToContact(contact.id, contact.name);
                    setIsShareChatModalOpen(false);
                    stopAudioPreview();
                    onClose();
                    onOpenChatSection?.(contact.id);
                  }}
                >
                  <View style={styles.activityUserAvatarWrap}>
                    {contact.isSpecialIcon ? (
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? '#3D2A70' : '#1A112A', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="eye-off" size={18} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Image source={{ uri: contact.avatar }} style={[styles.activityUserAvatar, isDark && styles.activityUserAvatarDark]} />
                    )}
                  </View>

                  <View style={styles.activityUserInfo}>
                    <Text style={[styles.activityUserName, isDark && styles.activityUserNameDark]}>{contact.name}</Text>
                    <Text style={[styles.activityUserHandle, isDark && styles.activityUserHandleDark]}>{contact.username}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.shareSendActionBtn,
                      isSent && styles.shareSendActionBtnSent,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleShareToContact(contact.id, contact.name)}
                  >
                    <Feather
                      name={isSent ? 'check' : 'send'}
                      size={13}
                      color={isSent ? '#10B981' : '#FFFFFF'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.shareSendActionBtnText, isSent && styles.shareSendActionBtnTextSent]}>
                      {isSent ? 'Sent' : 'Send'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Open Full Chat Section Button */}
          <View style={[styles.openDirectMessagesRow, isDark && styles.openDirectMessagesRowDark]}>
            <TouchableOpacity
              style={styles.openDirectMessagesBtn}
              activeOpacity={0.85}
              onPress={() => {
                const targetId = lastSharedContactId || 'c1';
                if (!lastSharedContactId) {
                  handleShareToContact('c1', 'VARMA');
                }
                setIsShareChatModalOpen(false);
                stopAudioPreview();
                onClose();
                onOpenChatSection?.(targetId);
              }}
            >
              <LinearGradient
                colors={['#7C3AED', '#9D4EDD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.openDirectMessagesGradient}
              >
                <Feather name="message-circle" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.openDirectMessagesText}>Open Chat Section</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <LinearGradient 
        colors={['#423455', '#100B1A', '#2E2240']} 
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient Blurred Background (fills the screen with ambient colors so images & videos are NEVER cut off) */}
      <Image
        source={{ uri: story?.thumbnailUri || story?.mediaUri }}
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            height: '100%',
            opacity: 0.38,
            transform: [{ scale: 1.2 }],
            ...(Platform.OS === 'web' ? { filter: 'blur(35px)' } : {}),
          },
        ]}
        blurRadius={28}
        resizeMode="cover"
      />

      {/* Main Story Image or Video presentation */}
      <View style={[
        StyleSheet.absoluteFill,
        { alignItems: 'center', justifyContent: 'center' }
      ]}>
        <View style={[
          styles.mediaContainer, 
          story?.crop?.aspect && story.crop.aspect !== 'Free' && story.crop.aspect !== 'Story'
            ? { width: '100%', maxHeight: '100%', aspectRatio: getAspectRatioValue(story.crop.aspect) }
            : { width: '100%', height: '100%' }
        ]}>
          {isVideo ? (
            <StoryVideoPlayer 
              uri={story?.mediaUri || ''} 
              thumbnailUri={story?.thumbnailUri} 
              scale={story?.crop?.zoom ? story.crop.zoom / 100 : 1} 
              rotation={story?.rotation || 0}
              adjustments={story?.adjustments}
              contentFit={story?.crop?.aspect === 'Story' ? 'cover' : 'contain'}
              isPaused={isHolding || isTypingReply || isActivitySheetOpen || isShareChatModalOpen}
            />
          ) : (
            <Image
              source={{ uri: story?.mediaUri }}
              style={[
                styles.backgroundImage, 
                {
                  width: '100%',
                  height: '100%',
                  opacity: (story?.adjustments?.opacity ?? 100) / 100,
                  transform: [
                    { scale: story?.crop?.zoom ? story.crop.zoom / 100 : 1 },
                    { rotate: `${story?.rotation || 0}deg` }
                  ],
                  ...getAdjustmentsFilterStyle(story?.adjustments),
                }
              ]}
              blurRadius={story?.adjustments?.blur || 0}
              resizeMode={story?.crop?.aspect === 'Story' ? 'cover' : 'contain'}
            />
          )}

          {/* Temperature, Tint & Filter Overlay applied to story */}
          <MediaAdjustmentsOverlay
            adjustments={story?.adjustments}
            filter={story?.filter}
          />

          {/* Applied Stickers on Story */}
          {story?.stickers?.map((stk) => (
            <View
              key={stk.id}
              style={{
                position: 'absolute',
                left: `${stk.x}%`,
                top: `${stk.y}%`,
                transform: [
                  { translateX: -24 },
                  { translateY: -24 },
                  { rotate: `${stk.rotation || 0}deg` },
                  { scale: stk.scale || 1 },
                ],
                zIndex: 50,
              }}
              pointerEvents="none"
            >
              <Text style={{ fontSize: 36 }}>{stk.emoji}</Text>
            </View>
          ))}

          {/* Applied Texts on Story */}
          {story?.texts?.map((txt) => (
            <View
              key={txt.id}
              style={{
                position: 'absolute',
                left: `${txt.x}%`,
                top: `${txt.y}%`,
                transform: [
                  { translateX: -50 },
                  { translateY: -16 },
                  { rotate: `${txt.rotation || 0}deg` },
                  { scale: txt.scale || 1 },
                ],
                zIndex: 55,
              }}
              pointerEvents="none"
            >
              <Text
                style={{
                  color: txt.color || '#FFFFFF',
                  fontSize: txt.fontSize || 26,
                  fontFamily: getFontFamilyStyle(txt.fontFamily || 'Default'),
                  fontWeight: txt.fontFamily === 'Bebas Neue' ? '900' : '700',
                  textShadowColor: txt.color === '#FFFFFF' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)',
                  textShadowOffset: { width: 0, height: 1.5 },
                  textShadowRadius: 3,
                  textAlign: 'center',
                }}
              >
                {txt.text}
              </Text>
            </View>
          ))}
          {/* Applied Location Tag on Media */}
          {story?.location && (story.location.placedOnMedia || story.location.x !== undefined) && (
            <View
              style={{
                position: 'absolute',
                left: `${story.location.x ?? 50}%`,
                top: `${story.location.y ?? 25}%`,
                transform: [{ translateX: -40 }, { translateY: -12 }],
                backgroundColor: 'rgba(0, 0, 0, 0.68)',
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.35)',
                zIndex: 60,
              }}
              pointerEvents="none"
            >
              <Text style={{ fontSize: 13, marginRight: 5 }}>📍</Text>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                {story.location.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Top & Bottom Vignette Gradients */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Segmented Progress Bar (one segment per story in current person) ── */}
        <View style={[styles.progressBarContainer, { opacity: isHolding ? 0 : 1 }]}>
          {Array.from({ length: activeStoryCount }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i < activeStoryCount - 1 && { marginRight: 4 }]}
            >
              <View style={styles.progressTrack}>
                {i < activeStoryIndex ? (
                  // Already watched — fully filled
                  <View style={[styles.progressFill, { width: '100%' }]} />
                ) : i === activeStoryIndex ? (
                  // Currently playing — animated fill
                  <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                ) : null /* Future stories — empty track */}
              </View>
            </View>
          ))}
        </View>

        {/* Top Header: Author info & Close */}
        <View style={[styles.topHeader, { opacity: isHolding ? 0 : 1 }]}>
          <View style={styles.authorRow}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: story?.authorAvatar }} style={styles.avatar} />
            </View>
            <View style={styles.authorTextGroup}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{story?.authorName}</Text>
                {story?.isUserStory && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Text style={styles.timeAgo}>{story?.timeAgo}</Text>
                <View style={styles.expiryBadge}>
                  <Feather name="clock" size={9} color="#D8B4FE" style={{ marginRight: 3 }} />
                  <Text style={styles.expiryBadgeText}>{getStoryTimeRemaining(story?.createdAt)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            {story?.music && (
              <TouchableOpacity
                style={styles.iconCircleBtn}
                activeOpacity={0.8}
                onPress={toggleStoryAudioMute}
              >
                <Feather
                  name={isStoryMuted ? 'volume-x' : 'volume-2'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconCircleBtn} activeOpacity={0.8}>
              <Feather name="more-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              activeOpacity={0.8}
              onPress={() => {
                stopAudioPreview();
                onClose();
              }}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Story Music Pill */}
        {story?.music && (
          <View style={[styles.storyMusicBadgeContainer, { opacity: isHolding ? 0 : 1 }]}>
            <TouchableOpacity
              style={styles.storyMusicBadge}
              activeOpacity={0.8}
              onPress={toggleStoryAudioMute}
            >
              <Feather
                name={isStoryMuted ? 'volume-x' : 'music'}
                size={12}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.storyMusicBadgeText} numberOfLines={1}>
                {story.music.title} • {story.music.artist}
              </Text>
              {!isStoryMuted && (
                <View style={styles.storyMusicWaveContainer}>
                  <View style={styles.miniWaveBar} />
                  <View style={[styles.miniWaveBar, { height: 11 }]} />
                  <View style={styles.miniWaveBar} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Story Location Pill (when not placed directly on media) */}
        {story?.location && !story.location.placedOnMedia && (
          <View style={[styles.storyLocBadgeContainer, { opacity: isHolding ? 0 : 1 }]}>
            <View style={styles.storyLocBadge}>
              <Text style={{ fontSize: 12, marginRight: 5 }}>📍</Text>
              <Text style={styles.storyLocBadgeText} numberOfLines={1}>
                {story.location.name}
                {story.location.city && story.location.city !== story.location.name ? `, ${story.location.city}` : ''}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.tapArea}>
          <TouchableOpacity
            style={styles.tapHalf}
            activeOpacity={1}
            onPressIn={() => {
              pressStartTimeRef.current = Date.now();
              setIsHolding(true);
              pauseStory();
            }}
            onPressOut={() => {
              setIsHolding(false);
              resumeStory();
            }}
            onPress={() => {
              const pressDuration = Date.now() - pressStartTimeRef.current;
              if (pressDuration < 280) {
                handlePrev();
              }
            }}
          />
          <TouchableOpacity
            style={styles.tapHalf}
            activeOpacity={1}
            onPressIn={() => {
              pressStartTimeRef.current = Date.now();
              setIsHolding(true);
              pauseStory();
            }}
            onPressOut={() => {
              setIsHolding(false);
              resumeStory();
            }}
            onPress={() => {
              const pressDuration = Date.now() - pressStartTimeRef.current;
              if (pressDuration < 280) {
                handleNext();
              }
            }}
          />
        </View>

        {/* Bottom Area: Caption & Actions */}
        <View style={[styles.bottomArea, { opacity: isHolding ? 0 : 1 }]}>
          {story?.caption && (
            <View style={styles.captionCard}>
              <Text style={styles.captionText}>{story.caption}</Text>
            </View>
          )}

          {/* Floating Toast Notification */}
          {replyToast && (
            <View style={styles.floatingToastWrap} pointerEvents="none">
              <View style={styles.floatingToast}>
                <Feather name="check-circle" size={14} color="#A78BFA" style={{ marginRight: 6 }} />
                <Text style={styles.floatingToastText}>{replyToast}</Text>
              </View>
            </View>
          )}

          <View style={styles.replyRow}>
            {/* View count capsule */}
            <TouchableOpacity
              style={[styles.statCapsule, styles.statCapsuleInteractive]}
              activeOpacity={0.75}
              onPress={() => handleOpenActivitySheet('views')}
              accessibilityLabel="View story views and likes"
            >
              <Feather name="eye" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.statCapsuleText}>{totalViewsCount}</Text>
            </TouchableOpacity>

            {/* Input capsule (Real TextInput with visible text, no redundant share option) */}
            <View style={styles.replyInputWrap}>
              <TextInput
                style={styles.replyTextInput}
                placeholder="Send a reply..."
                placeholderTextColor="rgba(255, 255, 255, 0.65)"
                value={replyText}
                onFocus={() => {
                  setIsTypingReply(true);
                  pauseStory();
                }}
                onBlur={() => {
                  setIsTypingReply(false);
                  if (!isActivitySheetOpen && !isShareChatModalOpen && !isHolding) {
                    resumeStory();
                  }
                }}
                onChangeText={(text) => {
                  setReplyText(text);
                  pauseStory();
                }}
                onSubmitEditing={handleSendReply}
                returnKeyType="send"
              />
              {replyText.trim().length > 0 ? (
                <TouchableOpacity onPress={handleSendReply} activeOpacity={0.8} style={styles.replySendBtn}>
                  <Ionicons name="send" size={13} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <Feather name="smile" size={16} color="rgba(255, 255, 255, 0.6)" />
              )}
            </View>

            {/* Heart count capsule (Height decreased to equal Views capsule!) */}
            <View style={[styles.statCapsule, styles.statCapsuleInteractive, styles.likesStatCapsule]}>
              <TouchableOpacity
                style={styles.likesHeartBtn}
                onPress={() => setIsLiked((prev) => !prev)}
                activeOpacity={0.7}
                accessibilityLabel="Like story"
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={15}
                  color={isLiked ? '#FF2A85' : '#FFFFFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.likesCountBtn}
                onPress={() => handleOpenActivitySheet('likes')}
                activeOpacity={0.7}
                accessibilityLabel="View story likes"
              >
                <Text style={styles.statCapsuleText}>{totalLikesCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Share circle button */}
            <TouchableOpacity
              style={styles.shareCircleBtn}
              activeOpacity={0.75}
              onPress={handleOpenShareChatModal}
              accessibilityLabel="Share story to chat"
            >
              <Feather name="share-2" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>

    {/* Activity Bottom Sheet Modal (Views & Likes) */}
    {renderActivitySheetModal()}

    {/* Share to Chat Sheet Modal */}
    {renderShareChatModal()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    zIndex: 101,
  },
  mediaContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Segmented Progress Bar
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  progressSegment: {
    flex: 1,
  },
  progressTrack: {
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FF2A85',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  authorTextGroup: {},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  youBadge: {
    backgroundColor: '#6535EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  timeAgo: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mid Tap Area
  tapArea: {
    flex: 1,
    flexDirection: 'row',
  },
  tapHalf: {
    flex: 1,
  },

  // Bottom Area
  bottomArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  captionCard: {
    backgroundColor: 'rgba(18, 11, 38, 0.75)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // User Story Actions
  userStoryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  viewsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  viewsCountText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  userButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6535EA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  addMoreText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteStoryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 59, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 138, 0.4)',
  },

  // Other User Actions
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 38,
    paddingHorizontal: 11,
    borderRadius: 19,
  },
  statCapsuleInteractive: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  statCapsuleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  replyInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
  },
  replyTextInput: {
    flex: 1,
    height: 38,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  replySendBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  likesStatCapsule: {
    paddingHorizontal: 0,
    height: 38,
  },
  likesHeartBtn: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 4,
  },
  likesCountBtn: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 10,
  },
  shareCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Story Music Badge
  storyMusicBadgeContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
    zIndex: 60,
  },
  storyMusicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: '85%',
  },
  storyMusicBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  storyMusicWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 6,
    height: 12,
  },
  miniWaveBar: {
    width: 2.5,
    height: 6,
    backgroundColor: '#A78BFA',
    borderRadius: 1.5,
  },

  // Story Location Badge
  storyLocBadgeContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    zIndex: 60,
  },
  storyLocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: '85%',
  },
  storyLocBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },

  // Story 24h Expiry Badge
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  expiryBadgeText: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '600',
  },

  // Story Activity Bottom Sheet Pop-up (Light Mood)
  activityModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  activitySheetContent: {
    width: '100%',
    height: '84%',
    maxHeight: '88%',
    minHeight: 460,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#ECE7F6',
    shadowColor: '#302060',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  activitySheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  activitySheetHandle: {
    width: 42,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#DCD4EA',
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBF8',
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityStoryThumb: {
    width: 42,
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2D9F3',
    backgroundColor: '#F3EEFA',
  },
  activityHeaderTitle: {
    color: '#1A112A',
    fontSize: 17,
    fontWeight: '700',
  },
  activityHeaderSub: {
    color: '#7A6E94',
    fontSize: 12,
    marginTop: 2,
  },
  activityCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EEFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activityStatCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 12,
  },
  activityStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F7FD',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#EFEAFF',
  },
  activityStatCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F4EEFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  activityStatIconWrapPurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityStatIconWrapPink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE8F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityStatNumber: {
    color: '#1A112A',
    fontSize: 18,
    fontWeight: '700',
  },
  activityStatLabel: {
    color: '#7A6E94',
    fontSize: 11,
    fontWeight: '500',
  },
  activityTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 12,
  },
  activityTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F5F1FC',
    borderWidth: 1,
    borderColor: '#EBE4F6',
  },
  activityTabPillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activityTabPillText: {
    color: '#6E6187',
    fontSize: 13,
    fontWeight: '600',
  },
  activityTabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activitySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
    backgroundColor: '#F5F1FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#EBE4F6',
  },
  activitySearchInput: {
    flex: 1,
    color: '#1A112A',
    fontSize: 14,
    paddingVertical: 0,
  },
  activityScrollArea: {
    flex: 1,
  },
  activityEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  activityEmptyTitle: {
    color: '#1A112A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  activityEmptySub: {
    color: '#7A6E94',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  activityUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EDFA',
  },
  activityUserAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  activityUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAE4F4',
  },
  activityUserHeartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF2A85',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  activityUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  activityUserName: {
    color: '#1A112A',
    fontSize: 14,
    fontWeight: '600',
  },
  activityYouTag: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#EDE4FF',
  },
  activityYouTagText: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activityUserHandle: {
    color: '#7A6E94',
    fontSize: 12,
    marginTop: 2,
  },
  activityUserActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityLikedPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE8F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD1E6',
  },
  activityFollowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  activityFollowingBtn: {
    backgroundColor: '#F0EBF8',
    borderWidth: 1,
    borderColor: '#D8CCE8',
    shadowOpacity: 0,
    elevation: 0,
  },
  activityFollowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  activityFollowingBtnText: {
    color: '#6535EA',
    fontWeight: '600',
  },

  // ── STORY ACTIVITY DARK MOOD VARIANTS ──
  activityModalBackdropDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  activitySheetContentDark: {
    backgroundColor: '#190E2D',
    borderColor: 'rgba(167, 139, 250, 0.3)',
    shadowColor: '#000000',
    shadowOpacity: 0.55,
  },
  activitySheetHandleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  activityHeaderRowDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  activityStoryThumbDark: {
    borderColor: 'rgba(167, 139, 250, 0.4)',
    backgroundColor: '#2D1B4E',
  },
  activityHeaderTitleDark: {
    color: '#FFFFFF',
  },
  activityHeaderSubDark: {
    color: '#A594C4',
  },
  activityCloseBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  activityStatCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activityStatCardActiveDark: {
    borderColor: 'rgba(167, 139, 250, 0.7)',
    backgroundColor: 'rgba(167, 139, 250, 0.16)',
  },
  activityStatIconWrapPurpleDark: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  activityStatIconWrapPinkDark: {
    backgroundColor: 'rgba(255, 42, 133, 0.2)',
  },
  activityStatNumberDark: {
    color: '#FFFFFF',
  },
  activityStatLabelDark: {
    color: '#A594C4',
  },
  activityTabPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activityTabPillActiveDark: {
    backgroundColor: '#7C3AED',
    borderColor: '#9061F9',
  },
  activityTabPillTextDark: {
    color: '#A594C4',
  },
  activitySearchBoxDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activitySearchInputDark: {
    color: '#FFFFFF',
  },
  activityEmptyTitleDark: {
    color: '#FFFFFF',
  },
  activityEmptySubDark: {
    color: '#8E7EA8',
  },
  activityUserRowDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityUserAvatarDark: {
    backgroundColor: '#2D1B4E',
  },
  activityUserHeartBadgeDark: {
    borderColor: '#190E2D',
  },
  activityUserNameDark: {
    color: '#FFFFFF',
  },
  activityYouTagDark: {
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
  },
  activityYouTagTextDark: {
    color: '#D8B4FE',
  },
  activityUserHandleDark: {
    color: '#8E7EA8',
  },
  activityLikedPillDark: {
    backgroundColor: 'rgba(255, 42, 133, 0.15)',
    borderColor: 'rgba(255, 42, 133, 0.3)',
  },
  activityFollowingBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activityFollowingBtnTextDark: {
    color: '#D8B4FE',
  },

  // Floating Toast
  floatingToastWrap: {
    position: 'absolute',
    top: -46,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 11, 38, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Share to Chat Sheet
  shareChatSheetContent: {
    width: '100%',
    height: '62%',
    maxHeight: '70%',
    minHeight: 380,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#ECE7F6',
    shadowColor: '#302060',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  shareChatSheetContentDark: {
    backgroundColor: '#1E1235',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shareSendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
  },
  shareSendActionBtnSent: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  shareSendActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  shareSendActionBtnTextSent: {
    color: '#10B981',
  },
  openDirectMessagesRow: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBF8',
  },
  openDirectMessagesRowDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  openDirectMessagesBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  openDirectMessagesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  openDirectMessagesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
