import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  TextInput,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ViewToken,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { ChatItem } from './ChatsView';
import type { StoryData } from './StoryViewerModal';
import { MOODS } from './MoodPills';

export interface ReelComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
}

export interface ReelData {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  isVerified?: boolean;
  isFollowing?: boolean;
  caption: string;
  tags: string[];
  videoUri: string;
  posterUri: string;
  musicTitle: string;
  musicAuthor: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  comments: ReelComment[];
  isFollowedFeed?: boolean;
}

interface HubbingViewProps {
  isDark?: boolean;
  selectedMood?: string;
  onMoodChange?: (id: string) => void;
  onOpenCreateStory?: () => void;
  onAddReelToStory?: (reel: ReelData) => void;
  conversations?: ChatItem[];
  onShareToChat?: (contactId: string, story: StoryData, comment?: string) => void;
}

// Format numbers like 24.8K, 1.2M
function formatCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Initial realistic Hubs / Reels data
const INITIAL_REELS: ReelData[] = [
  {
    id: 'hub-1',
    author: 'Alex Rivers',
    handle: '@alex_rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isFollowing: true,
    caption: 'Golden hour drone shots over the mountain ridge 🌄✨ Nature is the greatest artist. Wait for the final peak reveal!',
    tags: ['#Hubbing', '#NatureVibe', '#Drone', '#Mountains', '#Sunset'],
    videoUri: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    posterUri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80',
    musicTitle: 'Mountain Echoes',
    musicAuthor: 'Alex Rivers Original Audio',
    likesCount: 28420,
    commentsCount: 1420,
    sharesCount: 3120,
    savesCount: 980,
    isFollowedFeed: true,
    comments: [
      {
        id: 'c1',
        author: 'Sarah Connor',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'This shot is completely unreal!! 🤯 Which drone model?',
        timeAgo: '2h ago',
        likes: 142,
      },
      {
        id: 'c2',
        author: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'The lighting gradient at 0:04 is 10/10 🔥',
        timeAgo: '4h ago',
        likes: 89,
      },
      {
        id: 'c3',
        author: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'Pure tranquility. Need this vibe today ✨',
        timeAgo: '5h ago',
        likes: 64,
      },
    ],
  },
  {
    id: 'hub-2',
    author: 'Jamie Sun',
    handle: '@jamie_tech',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isFollowing: false,
    caption: 'Building full-motion gestures in 30 seconds! ⚡💻 React Native + Expo is superpower. Drop your favorite tech stack below 👇',
    tags: ['#CodeHub', '#Tech', '#Developer', '#CodingVibe', '#React'],
    videoUri: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    posterUri: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&auto=format&fit=crop&q=80',
    musicTitle: 'Lofi Beats - Late Night Session',
    musicAuthor: 'Jamie Sun Beats',
    likesCount: 42150,
    commentsCount: 2180,
    sharesCount: 8430,
    savesCount: 4310,
    isFollowedFeed: false,
    comments: [
      {
        id: 'c4',
        author: 'Marcus Chen',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        text: 'Clean architecture! What gesture library did you use? 🚀',
        timeAgo: '1h ago',
        likes: 95,
      },
      {
        id: 'c5',
        author: 'Maya Patel',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        text: 'That fan navigation is insane! 💫',
        timeAgo: '3h ago',
        likes: 47,
      },
    ],
  },
  {
    id: 'hub-3',
    author: 'Maya Patel',
    handle: '@maya_travels',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isFollowing: true,
    caption: 'Tokyo night walk in the rain 🌧️✨ Neon lights reflecting off the asphalt. Best walking city in the world? 🗼',
    tags: ['#Tokyo', '#NightWalk', '#Cyberpunk', '#Hubbing', '#RainVibes'],
    videoUri: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
    posterUri: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1080&auto=format&fit=crop&q=80',
    musicTitle: 'Midnight Rain - Tokyo Soundscapes',
    musicAuthor: 'Synthwave Odyssey',
    likesCount: 89430,
    commentsCount: 3410,
    sharesCount: 15200,
    savesCount: 7650,
    isFollowedFeed: true,
    comments: [
      {
        id: 'c6',
        author: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'The colors in Shinjuku are like a sci-fi movie! 🌌',
        timeAgo: '30m ago',
        likes: 210,
      },
      {
        id: 'c7',
        author: 'David Kim',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        text: 'Sound of rain with lofi is unmatched 🎧',
        timeAgo: '2h ago',
        likes: 114,
      },
    ],
  },
  {
    id: 'hub-4',
    author: 'Leo Bennett',
    handle: '@leo_visuals',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isFollowing: false,
    caption: 'Slow motion artisan coffee pour at 240fps ☕📽️ Lighting is everything in cinematography. Behind the scenes tutorial coming soon!',
    tags: ['#CoffeeArt', '#SlowMo', '#Cinematography', '#Hubs', '#Aesthetic'],
    videoUri: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4',
    posterUri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&auto=format&fit=crop&q=80',
    musicTitle: 'Acoustic Morning - Gentle Guitar',
    musicAuthor: 'Leo B Studio',
    likesCount: 18230,
    commentsCount: 890,
    sharesCount: 2150,
    savesCount: 1420,
    isFollowedFeed: false,
    comments: [
      {
        id: 'c8',
        author: 'Sarah Connor',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'That foam texture looks velvety smooth ☕😋',
        timeAgo: '1d ago',
        likes: 58,
      },
    ],
  },
  {
    id: 'hub-5',
    author: 'Elena Rostova',
    handle: '@elena_design',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isFollowing: true,
    caption: 'Glassmorphism & kinetic typography in 3D 🔮✨ Experimenting with real-time caustics and fluid dynamics. What vibe does this give you?',
    tags: ['#MotionDesign', '#3D', '#Blender', '#CreativeHub', '#Hubbing'],
    videoUri: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking-and-pause.mp4',
    posterUri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80',
    musicTitle: 'Synthwave Pulse - Neon Dreams',
    musicAuthor: 'Future Frequency',
    likesCount: 55700,
    commentsCount: 1640,
    sharesCount: 6920,
    savesCount: 5830,
    isFollowedFeed: true,
    comments: [
      {
        id: 'c9',
        author: 'Marcus Chen',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        text: 'Render engine? Octane or Cycles? Insane caustics! 🔥',
        timeAgo: '4h ago',
        likes: 122,
      },
    ],
  },
  {
    id: 'hub-6',
    author: 'David Kim',
    handle: '@david_fitness',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isFollowing: false,
    caption: '5 AM consistency over motivation 💪🌅 One day or day one. You decide. Drop a 🔥 if you got your workout in today!',
    tags: ['#FitnessMotivation', '#MorningRoutine', '#Hubbing', '#Grind'],
    videoUri: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4',
    posterUri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&auto=format&fit=crop&q=80',
    musicTitle: 'Bass Heavy - Beast Mode Workout',
    musicAuthor: 'Titan Beats',
    likesCount: 31900,
    commentsCount: 1020,
    sharesCount: 4890,
    savesCount: 2150,
    isFollowedFeed: false,
    comments: [
      {
        id: 'c10',
        author: 'Alex Rivers',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        text: 'No days off!! 🔥👊',
        timeAgo: '6h ago',
        likes: 80,
      },
    ],
  },
];

// Contacts fallback for sharing
const DEFAULT_CONTACTS = [
  { id: 'u1', name: 'Alex Rivers', handle: '@alex_rivers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'u2', name: 'Sarah Connor', handle: '@sarah_c', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'u3', name: 'David Kim', handle: '@david_kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'u4', name: 'Elena Rostova', handle: '@elena_r', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'u5', name: 'Marcus Chen', handle: '@marcus_c', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
];

// Single Reel Item Component
function ReelItem({
  reel,
  isActive,
  isMuted,
  height,
  isLiked,
  isSaved,
  isFollowing,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onToggleMute,
  onOpenComments,
  onOpenShare,
}: {
  reel: ReelData;
  isActive: boolean;
  isMuted: boolean;
  height: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowing: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleFollow: () => void;
  onToggleMute: () => void;
  onOpenComments: () => void;
  onOpenShare: () => void;
}) {
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // Animated elements
  const discRotation = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const playPauseAnim = useRef(new Animated.Value(0)).current;
  const [playPauseState, setPlayPauseState] = useState<'play' | 'pause'>('play');
  const lastTapRef = useRef<number>(0);

  // Initialize expo-video player
  const player = useVideoPlayer(reel.videoUri, (p) => {
    try {
      p.loop = true;
      p.muted = isMuted;
      if (isActive && !isManuallyPaused) {
        p.play();
      } else {
        p.pause();
      }
    } catch (e) {
      console.log('Hubbing reel player init error:', e);
    }
  });

  // Control playback when active state changes
  useEffect(() => {
    try {
      if (player) {
        player.muted = isMuted;
        if (isActive && !isManuallyPaused) {
          player.play();
        } else {
          player.pause();
        }
      }
    } catch (e) {
      console.log('Player state sync error:', e);
    }
  }, [isActive, isManuallyPaused, isMuted, player]);

  // Vinyl disc spinning animation
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isActive && !isManuallyPaused) {
      anim = Animated.loop(
        Animated.timing(discRotation, {
          toValue: 1,
          duration: 3800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      anim.start();
    } else {
      discRotation.stopAnimation();
    }
    return () => {
      anim?.stop();
    };
  }, [isActive, isManuallyPaused, discRotation]);

  const spinInterpolate = discRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Handle single tap (Play/Pause) vs double tap (Like with heart burst)
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      // Double tap detected!
      lastTapRef.current = 0;
      triggerDoubleTapLike();
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= 280 && lastTapRef.current !== 0) {
          togglePlayPause();
          lastTapRef.current = 0;
        }
      }, 290);
    }
  };

  const togglePlayPause = () => {
    const willPause = !isManuallyPaused;
    setIsManuallyPaused(willPause);
    setPlayPauseState(willPause ? 'pause' : 'play');

    playPauseAnim.setValue(1);
    Animated.timing(playPauseAnim, {
      toValue: 0,
      duration: 650,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const triggerDoubleTapLike = () => {
    if (!isLiked) {
      onToggleLike();
    }

    heartScale.setValue(0.3);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(heartScale, {
        toValue: 1.3,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  return (
    <View style={[styles.reelContainer, { height }]}>
      {/* Background Poster Image (prevents black flash while buffering) */}
      <Image
        source={{ uri: reel.posterUri }}
        style={styles.mediaBackground}
        resizeMode="cover"
      />

      {/* Video View */}
      <VideoView
        player={player}
        style={styles.mediaVideo}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Tap Overlay for Play/Pause and Double Tap */}
      <Pressable style={styles.tapSurface} onPress={handleTap}>
        {/* Double Tap Floating Heart Animation */}
        <Animated.View
          style={[
            styles.doubleTapHeart,
            {
              opacity: heartOpacity,
              transform: [{ scale: heartScale }],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#FF1475', '#FF4E8D']}
            style={styles.heartCircleGlow}
          >
            <Ionicons name="heart" size={68} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Play / Pause Animated Icon */}
        <Animated.View
          style={[
            styles.playPauseOverlay,
            {
              opacity: playPauseAnim,
              transform: [
                {
                  scale: playPauseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.playPauseCircle}>
            <Ionicons
              name={playPauseState === 'pause' ? 'pause' : 'play'}
              size={36}
              color="#FFFFFF"
              style={{ marginLeft: playPauseState === 'play' ? 4 : 0 }}
            />
          </View>
        </Animated.View>
      </Pressable>

      {/* Gradients for UI clarity */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Bottom Content Section & Right Actions */}
      <View style={styles.contentOverlay} pointerEvents="box-none">
        {/* Left Information Area */}
        <View style={styles.leftInfo} pointerEvents="box-none">
          {/* Creator Profile Row */}
          <View style={styles.authorRow}>
            <View style={styles.avatarBorder}>
              <Image source={{ uri: reel.avatar }} style={styles.avatar} />
            </View>

            <View style={styles.authorDetails}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.authorName}>{reel.author}</Text>
                {reel.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-sharp" size={9} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.handleText}>{reel.handle}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing && styles.followingBtn,
              ]}
              onPress={onToggleFollow}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.followBtnText,
                  isFollowing && styles.followingBtnText,
                ]}
              >
                {isFollowing ? 'Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caption with Hashtags */}
          <View style={styles.captionContainer}>
            <Text
              style={styles.captionText}
              numberOfLines={isCaptionExpanded ? undefined : 2}
            >
              {reel.caption}{' '}
              {reel.tags.map((tag, idx) => (
                <Text key={idx} style={styles.hashtagText}>
                  {tag}{' '}
                </Text>
              ))}
            </Text>
            {reel.caption.length > 70 && (
              <TouchableOpacity
                onPress={() => setIsCaptionExpanded(!isCaptionExpanded)}
                style={styles.moreButton}
              >
                <Text style={styles.moreText}>
                  {isCaptionExpanded ? 'less' : 'more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Audio / Music Row */}
          <TouchableOpacity
            style={styles.musicRow}
            onPress={onToggleMute}
            activeOpacity={0.7}
          >
            <View style={styles.musicIconWrap}>
              <Ionicons name="musical-notes" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.musicTitle} numberOfLines={1}>
              {reel.musicTitle} • {reel.musicAuthor}
            </Text>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={13}
              color="#D8CCFF"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>

        {/* Right Vertical Action Rail (Reels sidebar) */}
        <View style={styles.rightActions} pointerEvents="box-none">
          {/* Like Action */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onToggleLike}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconWrap,
                isLiked && styles.actionIconWrapLiked,
              ]}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={27}
                color={isLiked ? '#FF2D6C' : '#FFFFFF'}
              />
            </View>
            <Text style={[styles.actionCount, isLiked && { color: '#FF4E8D' }]}>
              {formatCount(reel.likesCount + (isLiked ? 1 : 0))}
            </Text>
          </TouchableOpacity>

          {/* Comment Action */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenComments}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={25} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>
              {formatCount(reel.commentsCount)}
            </Text>
          </TouchableOpacity>

          {/* Share Action */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onOpenShare}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="paper-plane-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>
              {formatCount(reel.sharesCount)}
            </Text>
          </TouchableOpacity>

          {/* Save / Bookmark Action */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onToggleSave}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIconWrap,
                isSaved && styles.actionIconWrapSaved,
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isSaved ? '#FFD700' : '#FFFFFF'}
              />
            </View>
            <Text style={[styles.actionCount, isSaved && { color: '#FFD700' }]}>
              {formatCount(reel.savesCount + (isSaved ? 1 : 0))}
            </Text>
          </TouchableOpacity>

          {/* Rotating Vinyl Record / Audio Disc */}
          <TouchableOpacity
            style={styles.vinylContainer}
            onPress={onToggleMute}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.vinylDisc,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              <LinearGradient
                colors={['#2A2A38', '#111116', '#2A2A38']}
                style={styles.vinylGrooves}
              >
                <Image
                  source={{ uri: reel.avatar }}
                  style={styles.vinylAvatar}
                />
              </LinearGradient>
            </Animated.View>
            {/* Note badge */}
            <View style={styles.vinylNoteBadge}>
              <Ionicons name="musical-note" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function HubbingView({
  isDark = true,
  selectedMood = 'trending',
  onMoodChange,
  onOpenCreateStory,
  onAddReelToStory,
  conversations = [],
  onShareToChat,
}: HubbingViewProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [containerHeight, setContainerHeight] = useState<number>(0);

  // Tab switcher state: 'foryou' | 'following'
  const [activeFeedTab, setActiveFeedTab] = useState<'foryou' | 'following'>('foryou');

  // Reels feed state
  const [reels, setReels] = useState<ReelData[]>(INITIAL_REELS);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    'Alex Rivers': true,
    'Maya Patel': true,
    'Elena Rostova': true,
  });

  // Active playing index
  const [activeIndex, setActiveIndex] = useState(0);

  // Sound toggle (shared for all reels)
  const [isMuted, setIsMuted] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Comments bottom sheet state
  const [activeCommentsReel, setActiveCommentsReel] = useState<ReelData | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Share bottom sheet state
  const [activeShareReel, setActiveShareReel] = useState<ReelData | null>(null);
  const [sentContacts, setSentContacts] = useState<Record<string, boolean>>({});

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  }, [toastAnim]);

  // Resolve active mood metadata
  const activeMood = useMemo(
    () => MOODS.find((m) => m.id === selectedMood) ?? MOODS[0],
    [selectedMood]
  );
  const moodColor = activeMood.color;

  // Filter reels based on feed tab AND mood
  const displayedReels = useMemo(() => {
    let filtered = reels;

    // Mood filter: 'trending' shows all, others match tags
    if (selectedMood !== 'trending') {
      const moodTags = activeMood.tags;
      if (moodTags.length > 0) {
        filtered = filtered.filter((r) =>
          r.tags.some((t) => moodTags.includes(t))
        );
      }
      // If no match, show all so screen is never empty
      if (filtered.length === 0) filtered = reels;
    }

    if (activeFeedTab === 'following') {
      const followed = filtered.filter(
        (r) => followingMap[r.author] || r.isFollowedFeed
      );
      return followed.length > 0 ? followed : filtered;
    }
    return filtered;
  }, [activeFeedTab, reels, followingMap, selectedMood, activeMood]);

  // Like Toggle
  const handleToggleLike = useCallback((id: string) => {
    setLikedMap((prev) => {
      const next = !prev[id];
      if (next) {
        showToast('Added to liked Hubs ❤️');
      }
      return { ...prev, [id]: next };
    });
  }, [showToast]);

  // Save Toggle
  const handleToggleSave = useCallback((id: string) => {
    setSavedMap((prev) => {
      const next = !prev[id];
      showToast(next ? 'Saved to collection 🔖' : 'Removed from collection');
      return { ...prev, [id]: next };
    });
  }, [showToast]);

  // Follow Toggle
  const handleToggleFollow = useCallback((author: string) => {
    setFollowingMap((prev) => {
      const next = !prev[author];
      showToast(next ? `Following ${author} ✨` : `Unfollowed ${author}`);
      return { ...prev, [author]: next };
    });
  }, [showToast]);

  // Global Mute Toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      showToast(next ? 'Audio muted 🔇' : 'Audio unmuted 🔊');
      return next;
    });
  }, [showToast]);

  // Add Comment
  const handleAddComment = () => {
    if (!commentInput.trim() || !activeCommentsReel) return;

    const newComment: ReelComment = {
      id: 'c-user-' + Date.now(),
      author: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: commentInput.trim(),
      timeAgo: 'Just now',
      likes: 0,
    };

    setReels((prev) =>
      prev.map((r) => {
        if (r.id === activeCommentsReel.id) {
          return {
            ...r,
            commentsCount: r.commentsCount + 1,
            comments: [newComment, ...r.comments],
          };
        }
        return r;
      })
    );

    setActiveCommentsReel((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [newComment, ...prev.comments],
          }
        : null
    );

    setCommentInput('');
    showToast('Comment posted! 💬');
  };

  // Like individual comment
  const handleLikeComment = (commentId: string) => {
    if (!activeCommentsReel) return;

    setActiveCommentsReel((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        comments: prev.comments.map((c) => {
          if (c.id === commentId) {
            const isLiked = !c.isLiked;
            return {
              ...c,
              isLiked,
              likes: c.likes + (isLiked ? 1 : -1),
            };
          }
          return c;
        }),
      };
    });
  };

  // Share to a contact
  const handleSendToContact = (contact: { id: string; name: string; avatar?: string }) => {
    if (!activeShareReel) return;

    setSentContacts((prev) => ({ ...prev, [contact.id]: true }));

    // Send to Chat if handler is present
    if (onShareToChat) {
      const storyData: StoryData = {
        id: activeShareReel.id,
        authorName: activeShareReel.author,
        authorAvatar: activeShareReel.avatar,
        mediaUri: activeShareReel.videoUri,
        thumbnailUri: activeShareReel.posterUri,
        caption: activeShareReel.caption,
        timeAgo: 'Just now',
      };
      onShareToChat(contact.id, storyData, `Shared ${activeShareReel.author}'s Hub reel`);
    }

    showToast(`Shared to ${contact.name}! 🚀`);
  };

  // Viewability config for vertical scroll snap
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const reelItemHeight = containerHeight || screenHeight - 65;

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== containerHeight) {
          setContainerHeight(h);
        }
      }}
    >
      {/* ── Top Bar Header (Reels Style) ── */}
      <View style={styles.topHeader}>
        {/* Brand title */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Hubbing</Text>
          <View style={styles.brandDot} />
        </View>

        {/* Tab switchers: For You / Following */}
        <View style={styles.feedTabs}>
          <TouchableOpacity
            style={[
              styles.feedTabBtn,
              activeFeedTab === 'foryou' && styles.feedTabBtnActive,
            ]}
            onPress={() => setActiveFeedTab('foryou')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.feedTabText,
                activeFeedTab === 'foryou' && styles.feedTabTextActive,
              ]}
            >
              For You
            </Text>
            {activeFeedTab === 'foryou' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedTabBtn,
              activeFeedTab === 'following' && styles.feedTabBtnActive,
            ]}
            onPress={() => setActiveFeedTab('following')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.feedTabText,
                activeFeedTab === 'following' && styles.feedTabTextActive,
              ]}
            >
              Following
            </Text>
            {activeFeedTab === 'following' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Action icons: Sound & Camera */}
        <View style={styles.topRightIcons}>
          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={handleToggleMute}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topIconBtn, styles.createHubBtn]}
            onPress={onOpenCreateStory}
            activeOpacity={0.7}
          >
            <Feather name="camera" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mood Filter Strip (floats below top header, hidden when sheets are open) ── */}
      {activeCommentsReel === null && activeShareReel === null && (
      <View style={styles.moodStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodStripContent}
        >
          {MOODS.map((mood) => {
            const isActive = mood.id === selectedMood;
            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => onMoodChange?.(mood.id)}
                activeOpacity={0.75}
                style={[
                  styles.moodPill,
                  isActive
                    ? { backgroundColor: mood.color, borderColor: '#FFFFFF' }
                    : { backgroundColor: 'rgba(15, 10, 32, 0.75)', borderColor: 'rgba(255, 255, 255, 0.3)' },
                ]}
              >
                <Text
                  style={[
                    styles.moodPillText,
                    isActive && styles.moodPillTextActive,
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      )}


      {/* ── Vertical Snap Reels Feed ── */}
      <FlatList
        data={displayedReels}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === activeIndex}
            isMuted={isMuted}
            height={reelItemHeight}
            isLiked={!!likedMap[item.id]}
            isSaved={!!savedMap[item.id]}
            isFollowing={followingMap[item.author] ?? !!item.isFollowing}
            onToggleLike={() => handleToggleLike(item.id)}
            onToggleSave={() => handleToggleSave(item.id)}
            onToggleFollow={() => handleToggleFollow(item.author)}
            onToggleMute={handleToggleMute}
            onOpenComments={() => setActiveCommentsReel(item)}
            onOpenShare={() => {
              setSentContacts({});
              setActiveShareReel(item);
            }}
          />
        )}
        pagingEnabled
        snapToInterval={reelItemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: reelItemHeight,
          offset: reelItemHeight * index,
          index,
        })}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
      />

      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-18, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Comments Bottom Sheet Modal ── */}
      <Modal
        visible={activeCommentsReel !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCommentsReel(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActiveCommentsReel(null)}
        >
          <Pressable
            style={[
              styles.commentsSheet,
              !isDark && { backgroundColor: '#F0EEFF', borderColor: 'rgba(100,60,220,0.15)' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, !isDark && { backgroundColor: 'rgba(100,60,220,0.25)' }]} />
            </View>

            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: moodColor + '55' }]}>
              <View style={styles.sheetTitleRow}>
                <Text style={[styles.sheetTitle, !isDark && { color: '#1A0A3C' }]}>Comments</Text>
                <View style={[styles.commentCountPill, { backgroundColor: moodColor + '33', borderColor: moodColor + '66' }]}>
                  <Text style={[styles.commentCountText, { color: moodColor }]}>
                    {activeCommentsReel?.commentsCount || 0}
                  </Text>
                </View>
                {/* Active mood badge */}
                <View style={[styles.moodBadge, { backgroundColor: moodColor + '22', borderColor: moodColor + '55' }]}>
                  <Text style={[styles.moodBadgeText, { color: moodColor }]}>{activeMood.label}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveCommentsReel(null)}
                style={[styles.sheetCloseBtn, !isDark && { backgroundColor: 'rgba(100,60,220,0.12)' }]}
              >
                <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#4C2CE6'} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <FlatList
              data={activeCommentsReel?.comments || []}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.commentsListContent}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
                  <View style={styles.commentBody}>
                    <View style={styles.commentAuthorRow}>
                      <Text style={[styles.commentAuthor, !isDark && { color: '#1A0A3C' }]}>{item.author}</Text>
                      <Text style={styles.commentTime}>{item.timeAgo}</Text>
                    </View>
                    <Text style={[styles.commentText, !isDark && { color: '#2C1B58' }]}>{item.text}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.commentLikeBtn}
                    onPress={() => handleLikeComment(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.isLiked ? 'heart' : 'heart-outline'}
                      size={16}
                      color={item.isLiked ? '#FF2D6C' : '#8E8E9F'}
                    />
                    {item.likes > 0 && (
                      <Text
                        style={[
                          styles.commentLikeCount,
                          item.isLiked && { color: '#FF2D6C' },
                        ]}
                      >
                        {item.likes}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyCommentsWrap}>
                  <Ionicons name="chatbubbles-outline" size={44} color={isDark ? '#6B658A' : '#9B8EC4'} />
                  <Text style={[styles.emptyCommentsText, !isDark && { color: '#7A6BAB' }]}>
                    No comments yet. Be the first to share your thoughts!
                  </Text>
                </View>
              }
            />

            {/* Quick Emoji Reaction Row */}
            <View style={[styles.quickEmojiRow, !isDark && { borderTopColor: 'rgba(100,60,220,0.12)' }]}>
              {['❤️', '🔥', '👏', '🙌', '😍', '🚀', '💯'].map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.emojiPill}
                  onPress={() => setCommentInput((prev) => prev + emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Input Footer */}
            <View style={styles.commentInputRow}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                }}
                style={styles.inputUserAvatar}
              />
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder={`Add a comment for ${activeCommentsReel?.author}...`}
                placeholderTextColor={isDark ? '#7E78A0' : '#9B8EC4'}
                style={[
                  styles.commentTextInput,
                  !isDark && { backgroundColor: 'rgba(100,60,220,0.08)', color: '#1A0A3C' },
                ]}
                returnKeyType="send"
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                style={[
                  styles.sendCommentBtn,
                  !commentInput.trim() && styles.sendCommentBtnDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!commentInput.trim()}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={32}
                  color={commentInput.trim() ? '#8F5BFE' : (isDark ? '#4E4870' : '#C4B0FF')}
                />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Share Bottom Sheet Modal ── */}
      <Modal
        visible={activeShareReel !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveShareReel(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActiveShareReel(null)}
        >
          <Pressable
            style={[
              styles.shareSheet,
              !isDark && { backgroundColor: '#F0EEFF', borderColor: 'rgba(100,60,220,0.15)' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, !isDark && { backgroundColor: 'rgba(100,60,220,0.25)' }]} />
            </View>

            <View style={[styles.sheetHeader, { borderBottomColor: moodColor + '55' }]}>
              <View style={styles.sheetTitleRow}>
                <Text style={[styles.sheetTitle, !isDark && { color: '#1A0A3C' }]}>Share Hub</Text>
                <View style={[styles.moodBadge, { backgroundColor: moodColor + '22', borderColor: moodColor + '55' }]}>
                  <Text style={[styles.moodBadgeText, { color: moodColor }]}>{activeMood.label}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setActiveShareReel(null)}
                style={[styles.sheetCloseBtn, !isDark && { backgroundColor: 'rgba(100,60,220,0.12)' }]}
              >
                <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#4C2CE6'} />
              </TouchableOpacity>
            </View>

            {/* Direct Contacts to Send to */}
            <Text style={[styles.shareSectionSubtitle, !isDark && { color: moodColor }]}>Send to Friends</Text>
            <View style={styles.contactsList}>
              {(conversations.length > 0 ? conversations : DEFAULT_CONTACTS).slice(0, 5).map((contact) => {
                const isSent = !!sentContacts[contact.id];
                return (
                  <View key={contact.id} style={styles.shareContactRow}>
                    <Image
                      source={{
                        uri:
                          contact.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                      }}
                      style={styles.shareAvatar}
                    />
                    <View style={styles.shareContactInfo}>
                      <Text style={[styles.shareContactName, !isDark && { color: '#1A0A3C' }]}>{contact.name}</Text>
                      <Text style={styles.shareContactSub}>
                        {contact.id.startsWith('u') ? '@' + contact.name.toLowerCase().replace(' ', '_') : 'Online'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.sendShareBtn,
                        isSent && styles.sendShareBtnSent,
                        !isDark && !isSent && { backgroundColor: moodColor },
                      ]}
                      onPress={() => handleSendToContact(contact)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sendShareBtnText,
                          isSent && styles.sendShareBtnTextSent,
                        ]}
                      >
                        {isSent ? 'Sent ✓' : 'Send'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Quick Actions (Copy Link, Add to Story, Save) */}
            <View style={[styles.quickActionRow, !isDark && { borderTopColor: 'rgba(100,60,220,0.12)' }]}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  showToast('Hub link copied to clipboard! 📋');
                  setActiveShareReel(null);
                }}
              >
                <View style={[styles.quickActionIcon, !isDark && { backgroundColor: moodColor + '22' }]}>
                  <Feather name="link-2" size={20} color={isDark ? '#FFFFFF' : moodColor} />
                </View>
                <Text style={[styles.quickActionText, !isDark && { color: '#2C1B58' }]}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  if (activeShareReel) {
                    onAddReelToStory?.(activeShareReel);
                  }
                  setActiveShareReel(null);
                  showToast('Reel added to your story! ✨');
                }}
              >
                <View style={[styles.quickActionIcon, !isDark && { backgroundColor: moodColor + '22' }]}>
                  <Ionicons name="add-circle-outline" size={22} color={isDark ? '#FFFFFF' : moodColor} />
                </View>
                <Text style={[styles.quickActionText, !isDark && { color: '#2C1B58' }]}>Add to Story</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  showToast('Hub saved to camera roll! 📥');
                  setActiveShareReel(null);
                }}
              >
                <View style={[styles.quickActionIcon, !isDark && { backgroundColor: moodColor + '22' }]}>
                  <Feather name="download" size={20} color={isDark ? '#FFFFFF' : moodColor} />
                </View>
                <Text style={[styles.quickActionText, !isDark && { color: '#2C1B58' }]}>Save Video</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Top Reels Header
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 8 : 12,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
    marginTop: 2,
  },
  feedTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  feedTabBtn: {
    paddingVertical: 6,
    position: 'relative',
    alignItems: 'center',
  },
  feedTabBtnActive: {},
  feedTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  feedTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#A855F7',
  },
  topRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20, 15, 35, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  createHubBtn: {
    backgroundColor: 'rgba(147, 51, 234, 0.6)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },

  // Reel Container
  reelContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  mediaBackground: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  mediaVideo: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  tapSurface: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleTapHeart: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartCircleGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF1475',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 12,
  },
  playPauseOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Gradients
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 12,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 12,
  },

  // Content Overlays
  contentOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 20,
  },
  leftInfo: {
    flex: 1,
    marginRight: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 16,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  authorDetails: {
    marginLeft: 10,
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleText: {
    fontSize: 12,
    color: '#D8CCFF',
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
  },
  followingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#EDE7FF',
  },

  // Caption
  captionContainer: {
    marginBottom: 12,
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '400',
  },
  hashtagText: {
    color: '#93C5FD',
    fontWeight: '600',
  },
  moreButton: {
    marginTop: 2,
  },
  moreText: {
    color: '#C4B5FD',
    fontSize: 12,
    fontWeight: '700',
  },

  // Music row
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 15, 35, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  musicIconWrap: {
    marginRight: 6,
  },
  musicTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 180,
  },

  // Right vertical action rail
  rightActions: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 4,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 15, 35, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionIconWrapLiked: {
    backgroundColor: 'rgba(255, 45, 108, 0.2)',
    borderColor: '#FF2D6C',
  },
  actionIconWrapSaved: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // Vinyl disc
  vinylContainer: {
    marginTop: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylDisc: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E1B2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  vinylGrooves: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  vinylNoteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    zIndex: 99,
  },
  toastCard: {
    backgroundColor: 'rgba(30, 20, 50, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal / Bottom Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  commentsSheet: {
    height: '68%',
    backgroundColor: '#161129',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  commentCountPill: {
    backgroundColor: 'rgba(147, 51, 234, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  commentCountText: {
    color: '#D8B4FE',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsListContent: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 14,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  commentAuthor: {
    color: '#EDE7FF',
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    color: '#7E78A0',
    fontSize: 11,
  },
  commentText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  commentLikeBtn: {
    alignItems: 'center',
    paddingTop: 4,
  },
  commentLikeCount: {
    color: '#8E8E9F',
    fontSize: 10,
    marginTop: 2,
  },
  emptyCommentsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCommentsText: {
    color: '#8E88B0',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
  quickEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  emojiPill: {
    padding: 6,
  },
  emojiText: {
    fontSize: 20,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
  },
  inputUserAvatar: {
    width: 34,
    height: 34,
    borderRadius: 13,
  },
  commentTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 21,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendCommentBtn: {
    padding: 2,
  },
  sendCommentBtnDisabled: {
    opacity: 0.5,
  },

  // Share Sheet
  shareSheet: {
    backgroundColor: '#161129',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
  },
  shareSectionSubtitle: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contactsList: {
    gap: 12,
    marginBottom: 18,
  },
  shareContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  shareAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  shareContactInfo: {
    flex: 1,
  },
  shareContactName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  shareContactSub: {
    color: '#8E88B0',
    fontSize: 12,
    marginTop: 1,
  },
  sendShareBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  sendShareBtnSent: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  sendShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sendShareBtnTextSent: {
    color: '#4ADE80',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#D8CCFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  // ── Mood Strip ──────────────────────────────────────
  moodStrip: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 58 : 62,
    left: 0,
    right: 0,
    zIndex: 51,
    paddingHorizontal: 12,
  },
  moodStripContent: {
    gap: 7,
    paddingVertical: 4,
  },
  moodPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  moodPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  // ── Mood Badge (inside sheet headers) ───────────────
  moodBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
    alignSelf: 'center',
  },
  moodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

