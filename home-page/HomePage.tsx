import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './components/Header';
import StoriesBar, { StoryItemData } from './components/StoriesBar';
import MoodPills, { MOODS } from './components/MoodPills';
import PostCard, { PostData } from './components/PostCard';
import ArcBottomNav, { TabKey } from './components/ArcBottomNav';
import SearchBarModal from './components/SearchBarModal';
import NotificationsModal from './components/NotificationsModal';
import ShareHubbModal from './components/ShareHubbModal';
import SharePostModal from './components/SharePostModal';
import StoryViewerModal, { StoryData, StoryUserGroup, isStoryNotExpired } from './components/StoryViewerModal';
import ChatsView, { DEFAULT_CONVERSATIONS, ChatItem, ChatMessage } from './components/ChatsView';
import HubbingView, { ReelData } from './components/HubbingView';
import ProfileView from './components/ProfileView';

const HOUR_MS = 60 * 60 * 1000;
export const STORY_EXPIRATION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_USER_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

// Structured multi-story groups per person (Instagram-style sequence)
const OTHER_STORY_GROUPS: StoryUserGroup[] = [
  {
    id: 'alex',
    name: 'Alex Rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    stories: [
      {
        id: 'alex-1',
        authorName: 'Alex Rivers',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        mediaUri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        caption: 'The view from our team offsite was incredible! 🏔️✨',
        timeAgo: '1h ago',
        createdAt: Date.now() - 1 * HOUR_MS,
        expiresAt: Date.now() + 23 * HOUR_MS,
        music: {
          id: '1445949267',
          title: 'Sunflower (Spider-Man: Into the S...',
          artist: 'Post Malone & Swae Lee',
          artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4b/30/2c/4b302cb6-7a14-5464-4e97-0577e9d0be49/18UMGIM82277.rgb.jpg/600x600bb.jpg',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/98/f0/d6/98f0d67e-f8bf-762d-cac7-1c6b3b6b35dd/mzaf_4543283896248560946.plus.aac.p.m4a',
        },
        location: {
          id: 'loc_hit_1',
          name: 'Hitech City',
          subtitle: 'Hyderabad, Telangana, India',
        },
      },
      {
        id: 'alex-2',
        authorName: 'Alex Rivers',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        mediaUri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80',
        caption: 'Sunset hike in the mountains 🌄',
        timeAgo: '45m ago',
        createdAt: Date.now() - 45 * 60 * 1000,
        expiresAt: Date.now() + 23 * HOUR_MS,
      },
    ],
  },
  {
    id: 'jamie',
    name: 'Jamie Sun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    stories: [
      {
        id: 'jamie-1',
        authorName: 'Jamie Sun',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        mediaUri: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
        caption: 'Live coding session with the team 🚀💻',
        timeAgo: '3h ago',
        createdAt: Date.now() - 3 * HOUR_MS,
        expiresAt: Date.now() + 21 * HOUR_MS,
      },
    ],
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    stories: [
      {
        id: 'sarah-1',
        authorName: 'Sarah Chen',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        mediaUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        caption: 'Weekend vibes in the city ☕🌸',
        timeAgo: '5h ago',
        createdAt: Date.now() - 5 * HOUR_MS,
        expiresAt: Date.now() + 19 * HOUR_MS,
        music: {
          id: '1624932774',
          title: 'POP!',
          artist: 'NAYEON',
          artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3f/49/ec/3f49ecb2-cb91-dd28-45b9-a31326d7e63b/738676859614_Cover.jpg/600x600bb.jpg',
          previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cc/74/22/cc7422df-1686-77ff-d3b0-2a2eb093fd76/mzaf_17159235851286493668.plus.aac.p.m4a',
        },
        location: {
          id: 'loc_ban_1',
          name: 'Banjara Hills',
          subtitle: 'Hyderabad, Telangana, India',
        },
      },
      {
        id: 'sarah-2',
        authorName: 'Sarah Chen',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        mediaUri: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
        caption: 'Matcha latte art at my favorite spot 🍵✨',
        timeAgo: '4h ago',
        createdAt: Date.now() - 4 * HOUR_MS,
        expiresAt: Date.now() + 20 * HOUR_MS,
      },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    stories: [
      {
        id: 'marcus-1',
        authorName: 'Marcus',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        mediaUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
        caption: 'Exploring new trails today 🌲🚵',
        timeAgo: '8h ago',
        createdAt: Date.now() - 8 * HOUR_MS,
        expiresAt: Date.now() + 16 * HOUR_MS,
      },
    ],
  },
];

// Single preview representation for StoriesBar
const OTHER_STORIES: StoryItemData[] = OTHER_STORY_GROUPS.map((g) => ({
  id: g.id,
  name: g.name,
  avatar: g.avatar,
  hasPlus: false,
  mediaUri: g.stories[0].mediaUri,
  caption: g.stories[0].caption,
  timeAgo: g.stories[0].timeAgo,
  createdAt: g.stories[0].createdAt,
  expiresAt: g.stories[0].expiresAt,
}));

const POSTS: PostData[] = [
  {
    id: 'post-1',
    authorName: 'Alex Rivers',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    timeAgo: '10:30 AM',
    caption: 'The view from our team offsite was incredible! 🏔️',
    mediaUri:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    isVideo: false,
    likes: '12.4K',
    comments: '342',
    shares: '1.2K',
    bookmarks: '980',
  },
  {
    id: 'post-2',
    authorName: 'Jamie Sun',
    authorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    timeAgo: 'Yesterday at 8:45 PM',
    caption: 'Live coding session with the team 🚀',
    mediaUri:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
    isVideo: true,
    likes: '8.2K',
    comments: '268',
    shares: '980',
    bookmarks: '980',
  },
];

export interface HomePageProps {
  onLogout?: () => void;
  currentUser?: { email: string; name?: string } | null;
}

export default function HomePage({ onLogout, currentUser }: HomePageProps = {}) {
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShareHubbOpen, setIsShareHubbOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);
  // Story viewer state: active user groups sequence (Instagram-style)
  const [activeStoryGroups, setActiveStoryGroups] = useState<StoryUserGroup[] | null>(null);
  const [initialUserGroupIndex, setInitialUserGroupIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState('trending');
  const [activeSharePost, setActiveSharePost] = useState<PostData | null>(null);

  // Dynamic posts feed state so uploaded Hubs from Profile appear in Home feed
  const [feedPosts, setFeedPosts] = useState<PostData[]>(POSTS);

  const handleHubPostCreated = useCallback((newHub: any) => {
    const newPost: PostData = {
      id: newHub.id || `hub_post_${Date.now()}`,
      author: currentUser?.name || 'Hymasri',
      handle: currentUser?.name ? `@${currentUser.name.toLowerCase().replace(/\s+/g, '_')}` : '@hymasri',
      avatar: DEFAULT_USER_AVATAR,
      timeAgo: 'Just now',
      caption: newHub.caption || (newHub.hashtags ? newHub.hashtags.join(' ') : 'New Hub shared ✨'),
      mediaUri: newHub.imageUrl,
      additionalImages: newHub.additionalImages,
      likesCount: newHub.likes || 0,
      commentsCount: newHub.comments || 0,
      sharesCount: 0,
      tags: newHub.hashtags || ['#Hubbing'],
    };
    setFeedPosts((prev) => [newPost, ...prev]);
  }, [currentUser]);

  const displayedPosts = useMemo(() => {
    if (selectedMood === 'trending') return feedPosts;
    const moodObj = MOODS.find((m: { id: string; tags: string[] }) => m.id === selectedMood);
    if (!moodObj || moodObj.tags.length === 0) return feedPosts;
    const filtered = feedPosts.filter((p) =>
      p.tags?.some((t) => moodObj.tags.includes(t))
    );
    return filtered.length > 0 ? filtered : feedPosts;
  }, [feedPosts, selectedMood]);

  // User's active stories list — supports multiple stories posted by user, 24h expiration
  const [userStories, setUserStories] = useState<StoryItemData[]>([]);
  const userStory = userStories.filter(isStoryNotExpired).slice(-1)[0] || null;
  const setUserStory = useCallback((story: StoryItemData | null) => {
    if (!story) {
      setUserStories([]);
    } else {
      setUserStories((prev) => [...prev.filter(isStoryNotExpired), story]);
    }
  }, []);

  // Chat conversations state (lifted to HomePage so stories can be shared directly into chats)
  const [conversations, setConversations] = useState<ChatItem[]>(DEFAULT_CONVERSATIONS);

  const handleShareStoryToChat = useCallback(
    (contactId: string, story: StoryData, comment?: string) => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${hours}:${minutes} ${ampm}`;

      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        sender: 'user',
        text: comment || 'Shared a story',
        time: formattedTime,
        read: true,
        sharedStory: {
          id: story.id,
          authorName: story.authorName,
          authorAvatar: story.authorAvatar,
          mediaUri: story.mediaUri,
          thumbnailUri: story.thumbnailUri,
          caption: story.caption,
          timeAgo: story.timeAgo || 'Just now',
        },
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === contactId) {
            return {
              ...c,
              lastMessage: comment || `Shared ${story.authorName}'s story`,
              time: formattedTime,
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        })
      );
    },
    []
  );

  // Convert a StoryItemData to StoryData for the viewer
  const toStoryData = useCallback(
    (item: StoryItemData, isUser: boolean): StoryData => ({
      id: item.id,
      authorName: isUser ? 'Your Story' : item.name,
      authorAvatar: item.avatar,
      mediaUri:
        item.mediaUri ||
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      thumbnailUri: item.thumbnailUri,
      mediaType: (item as any).mediaType as 'image' | 'video' | undefined,
      caption: item.caption,
      timeAgo: item.timeAgo || 'Just now',
      createdAt: item.createdAt || Date.now(),
      expiresAt: item.expiresAt,
      isUserStory: isUser,
      filter: item.filter,
      crop: item.crop,
      rotation: item.rotation,
      adjustments: item.adjustments,
      stickers: item.stickers,
      texts: item.texts,
      music: item.music,
      location: item.location,
    }),
    []
  );

  // Add a Reel directly to the user's story (called from "Add to Story" in Share Hub sheet)
  const handleAddReelToStory = useCallback((reel: ReelData) => {
    const newStory: StoryItemData = {
      id: 'user-story-' + Date.now(),
      name: 'Your Story',
      avatar:
        reel.posterUri ||
        reel.avatar ||
        DEFAULT_USER_AVATAR,
      mediaUri: reel.posterUri || reel.videoUri, // use poster image as the story media
      thumbnailUri: reel.posterUri,
      caption: reel.caption,
      timeAgo: 'Just now',
      createdAt: Date.now(),
      isUserStory: true,
    };
    setUserStory(newStory);
    // Auto-open the viewer in sequence so user sees it right away!
    setTimeout(() => {
      const validUserStories = [...userStories.filter(isStoryNotExpired), newStory];
      const userGroup: StoryUserGroup = {
        id: 'user',
        name: 'Your Story',
        avatar: newStory.avatar || DEFAULT_USER_AVATAR,
        isUserStory: true,
        stories: validUserStories.map((item) => toStoryData(item, true)),
      };
      setActiveStoryGroups([userGroup, ...OTHER_STORY_GROUPS]);
      setInitialUserGroupIndex(0);
    }, 150);
  }, [userStories, toStoryData, setUserStory]);

  // Add a Feed Post directly to user's story (called from Share Hub modal in Home)
  const handleAddPostToStory = useCallback((post: PostData) => {
    const newStory: StoryItemData = {
      id: 'user-story-' + Date.now(),
      name: 'Your Story',
      avatar:
        post.mediaUri ||
        post.authorAvatar ||
        DEFAULT_USER_AVATAR,
      mediaUri: post.mediaUri,
      thumbnailUri: post.mediaUri,
      caption: post.caption,
      timeAgo: 'Just now',
      createdAt: Date.now(),
      isUserStory: true,
      mediaType: post.isVideo ? 'video' : 'image',
    } as any;
    setUserStory(newStory);
    setTimeout(() => {
      const validUserStories = [...userStories.filter(isStoryNotExpired), newStory];
      const userGroup: StoryUserGroup = {
        id: 'user',
        name: 'Your Story',
        avatar: newStory.avatar || DEFAULT_USER_AVATAR,
        isUserStory: true,
        stories: validUserStories.map((item) => toStoryData(item, true)),
      };
      setActiveStoryGroups([userGroup, ...OTHER_STORY_GROUPS]);
      setInitialUserGroupIndex(0);
    }, 150);
  }, [userStories, toStoryData, setUserStory]);

  const handleSharePostToChat = useCallback(
    (contactId: string, post: PostData) => {
      let hours = new Date().getHours();
      const minutes = new Date().getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${hours}:${minutes} ${ampm}`;

      const authorName = post.authorName || post.author || 'Hubber';
      const authorAvatar = post.authorAvatar || post.avatar;
      const newMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        sender: 'user',
        text: `Shared ${authorName}'s post`,
        time: formattedTime,
        read: true,
        sharedStory: {
          id: post.id,
          authorName,
          authorAvatar,
          mediaUri: post.mediaUri,
          caption: post.caption,
          timeAgo: post.timeAgo || 'Just now',
        },
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === contactId) {
            return {
              ...c,
              lastMessage: `Shared ${authorName}'s post`,
              time: formattedTime,
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        })
      );
    },
    []
  );

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Open user's own story in the viewer (flows seamlessly through user's stories then all friends)
  const handleOpenUserStory = useCallback(() => {
    const validUserStories = userStories.filter(isStoryNotExpired);
    if (validUserStories.length === 0) {
      setIsShareHubbOpen(true);
      return;
    }
    const userGroup: StoryUserGroup = {
      id: 'user',
      name: 'Your Story',
      avatar: validUserStories[validUserStories.length - 1].avatar || DEFAULT_USER_AVATAR,
      isUserStory: true,
      stories: validUserStories.map((item) => toStoryData(item, true)),
    };
    setActiveStoryGroups([userGroup, ...OTHER_STORY_GROUPS]);
    setInitialUserGroupIndex(0);
  }, [userStories, toStoryData]);

  // Open mock stories (opens tapped person's stories, then continues through the rest of the sequence)
  const handleOpenMockStory = useCallback((story: StoryItemData) => {
    const validUserStories = userStories.filter(isStoryNotExpired);
    const userGroup: StoryUserGroup | null = validUserStories.length > 0 ? {
      id: 'user',
      name: 'Your Story',
      avatar: validUserStories[validUserStories.length - 1].avatar || DEFAULT_USER_AVATAR,
      isUserStory: true,
      stories: validUserStories.map((item) => toStoryData(item, true)),
    } : null;

    const fullGroups: StoryUserGroup[] = userGroup
      ? [userGroup, ...OTHER_STORY_GROUPS]
      : [...OTHER_STORY_GROUPS];

    const targetIdx = fullGroups.findIndex((g) => g.id === story.id);
    setActiveStoryGroups(fullGroups);
    setInitialUserGroupIndex(targetIdx >= 0 ? targetIdx : 0);
  }, [userStories, toStoryData]);

  const handleCloseStoryViewer = useCallback(() => {
    setActiveStoryGroups(null);
    setInitialUserGroupIndex(0);
  }, []);

  // Android Mobile Back Button handler — 1 step back!
  // If viewing a story -> closes story viewer.
  // If share HUBB is open -> closes share HUBB modal.
  // If notifications is open -> closes notifications.
  // If search is open -> closes search.
  // If on another tab (Chats, Hubbing, Profile) -> returns to Home.
  useEffect(() => {
    const onBackPress = () => {
      if (activeStoryGroups !== null) {
        handleCloseStoryViewer();
        return true;
      }
      if (isShareHubbOpen) {
        setIsShareHubbOpen(false);
        return true;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return true;
      }
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return true;
      }
      if (activeTab === 'chats' && activeChatId) {
        setActiveChatId(null);
        return true; // 1 step back to Chat Inbox!
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true; // 1 step back to home!
      }
      return false; // at home with nothing open: normal system exit
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeStoryGroups, isShareHubbOpen, isNotificationsOpen, isSearchOpen, activeTab, activeChatId, handleCloseStoryViewer]);

  return (
    <View style={[styles.root, isDark && styles.rootDark]}>
      {/* Atmosphere Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#140C2C', '#1B0E3C', '#0A0518']
            : ['#E5F0FF', '#D8E8FC', '#C8DFFA']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.safeArea}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* ── Top Header (shown on Home, Chats, Profile) ── */}
        {activeTab !== 'hubbing' && (
          <Header
            isDark={isDark}
            onToggleTheme={toggleTheme}
            hasNotification={hasNotification}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
            rightType={activeTab === 'chats' ? 'profile' : 'notification'}
            userAvatar={userStory?.avatar || DEFAULT_USER_AVATAR}
          />
        )}

        {/* ── Screen Body (switches when clicking categories) ── */}
        {activeTab === 'home' && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stories Bar with Squircle Avatars & Gradient Ring */}
            <StoriesBar
              isDark={isDark}
              userStory={userStory}
              stories={OTHER_STORIES}
              onOpenUserStory={handleOpenUserStory}
              onOpenMockStory={handleOpenMockStory}
              onOpenCreateStory={() => setIsShareHubbOpen(true)}
            />

            {/* Mood Filter Pills */}
            <MoodPills
              isDark={isDark}
              selectedMood={selectedMood}
              onMoodChange={setSelectedMood}
            />

            {/* Posts Feed */}
            {displayedPosts.map((post: PostData) => (
              <PostCard
                key={post.id}
                post={post}
                isDark={isDark}
                onShare={setActiveSharePost}
              />
            ))}

            {/* Extra bottom spacing so content scrolls past mascot */}
            <View style={{ height: 160 }} />
          </ScrollView>
        )}

        {activeTab === 'chats' && (
          <ChatsView
            isDark={isDark}
            activeChatId={activeChatId}
            onSelectChat={setActiveChatId}
            conversations={conversations}
            onUpdateConversations={setConversations}
          />
        )}

        {activeTab === 'hubbing' && (
          <HubbingView
            isDark={isDark}
            selectedMood={selectedMood}
            onMoodChange={setSelectedMood}
            onOpenCreateStory={() => setIsShareHubbOpen(true)}
            onAddReelToStory={handleAddReelToStory}
            conversations={conversations}
            onShareToChat={handleShareStoryToChat}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            isDark={isDark}
            onLogout={onLogout}
            currentUser={currentUser}
            onToggleTheme={toggleTheme}
            hideTopBar={true}
            onPostCreated={handleHubPostCreated}
          />
        )}

        {/* Search Modal Overlay */}
        {isSearchOpen && (
          <SearchBarModal
            isDark={isDark}
            onClose={() => setIsSearchOpen(false)}
          />
        )}

        {/* Notifications Modal Overlay */}
        {isNotificationsOpen && (
          <NotificationsModal
            isDark={isDark}
            onClose={() => setIsNotificationsOpen(false)}
            onMarkAllRead={() => setHasNotification(false)}
          />
        )}

        {/* Share HUBBs / Create Story Modal ("the above content") */}
        {isShareHubbOpen && (
          <ShareHubbModal
            isDark={isDark}
            onClose={() => setIsShareHubbOpen(false)}
            onPublishStory={(data) => {
              const isVideoStory = data.mediaType === 'video';
              const newStory: StoryItemData = {
                id: 'user-story-' + Date.now(),
                name: 'Your Story',
                // For videos use the video thumbnail; for images use the full mediaUri
                avatar: isVideoStory
                  ? (data.thumbnailUri || data.mediaUri)
                  : data.mediaUri,
                mediaUri: data.mediaUri,
                // thumbnailUri is only meaningful for videos
                thumbnailUri: isVideoStory ? data.thumbnailUri : undefined,
                caption: data.caption,
                timeAgo: 'Just now',
                createdAt: Date.now(),
                isUserStory: true,
                filter: data.filter,
                crop: data.crop,
                rotation: data.rotation,
                adjustments: data.adjustments,
                stickers: data.stickers,
                texts: data.texts,
                music: data.music,
                location: data.location,
                ...(data.mediaType ? { mediaType: data.mediaType } : {}),
              } as any;
              setUserStory(newStory);
              setIsShareHubbOpen(false);
              setTimeout(() => {
                const validUserStories = [...userStories.filter(isStoryNotExpired), newStory];
                const userGroup: StoryUserGroup = {
                  id: 'user',
                  name: 'Your Story',
                  avatar: newStory.avatar || DEFAULT_USER_AVATAR,
                  isUserStory: true,
                  stories: validUserStories.map((item) => toStoryData(item, true)),
                };
                setActiveStoryGroups([userGroup, ...OTHER_STORY_GROUPS]);
                setInitialUserGroupIndex(0);
              }, 120);
            }}
          />
        )}

        {/* Story Viewer Modal — full-screen Instagram-style multi-user & multi-story sequence */}
        {activeStoryGroups !== null && (
          <StoryViewerModal
            userGroups={activeStoryGroups}
            initialUserIndex={initialUserGroupIndex}
            initialStoryIndex={0}
            isDark={isDark}
            onClose={handleCloseStoryViewer}
            onAddStory={() => {
              handleCloseStoryViewer();
              setIsShareHubbOpen(true);
            }}
            onDeleteStory={(storyId) => {
              if (storyId) {
                setUserStories((prev) => prev.filter((s) => s.id !== storyId));
              } else {
                setUserStories([]);
              }
              handleCloseStoryViewer();
            }}
            onOpenChatSection={(chatId) => {
              handleCloseStoryViewer();
              setActiveTab('chats');
              if (chatId) setActiveChatId(chatId);
            }}
            onShareStoryToChat={handleShareStoryToChat}
          />
        )}

        {/* Share Post Bottom Sheet Modal (from Home feed) */}
        <SharePostModal
          visible={activeSharePost !== null}
          post={activeSharePost}
          isDark={isDark}
          selectedMood={selectedMood}
          conversations={conversations}
          onClose={() => setActiveSharePost(null)}
          onAddToStory={handleAddPostToStory}
          onShareToChat={handleSharePostToChat}
        />

        {/* ── Movable Mascot & Radial Navigation (Visible in all screens and modals, EXCEPT inside direct message conversation) ── */}
        {!(activeTab === 'chats' && activeChatId) && (
          <ArcBottomNav
            isDark={isDark}
            activeTab={
              isSearchOpen
                ? 'search'
                : isShareHubbOpen
                ? undefined
                : activeStoryGroups !== null
                ? undefined
                : activeTab
            }
            onSelectTab={(tab) => {
              // Immediately close all modals and overlays so the selected category displays
              setIsShareHubbOpen(false);
              handleCloseStoryViewer();
              setIsNotificationsOpen(false);

              if (tab === 'search') {
                setIsSearchOpen(true);
              } else {
                setIsSearchOpen(false);
                setActiveTab(tab);
                setActiveChatId(null);
              }
            }}
            onOpenSearch={() => {
              setIsShareHubbOpen(false);
              handleCloseStoryViewer();
              setIsNotificationsOpen(false);
              setIsSearchOpen(true);
            }}
          />
        )}


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5F0FF',
  },
  rootDark: {
    backgroundColor: '#100824',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
