import { useState, useEffect } from 'react';
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
import MoodPills from './components/MoodPills';
import PostCard, { PostData } from './components/PostCard';
import ArcBottomNav, { TabKey } from './components/ArcBottomNav';
import SearchBarModal from './components/SearchBarModal';
import NotificationsModal from './components/NotificationsModal';
import ShareHubbModal from './components/ShareHubbModal';
import StoryViewerModal, { StoryData } from './components/StoryViewerModal';
import ChatsView from './components/ChatsView';
import HubbingView from './components/HubbingView';
import ProfileView from './components/ProfileView';

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
  const [viewingStory, setViewingStory] = useState<StoryData | null>(null);
  const [hasNotification, setHasNotification] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // User's active story state
  // Default to an active story so the user can immediately see and tap the + icon or story!
  const [userStory, setUserStory] = useState<StoryItemData | null>({
    id: 'user-story-active',
    name: 'Your Story',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mediaUri:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    caption: 'Chilling at the studio today! 🎧✨ Having an amazing time!',
    timeAgo: 'Just now',
    isUserStory: true,
  });

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Android Mobile Back Button handler — 1 step back!
  // If viewing a story -> closes story viewer.
  // If share HUBB is open -> closes share HUBB modal.
  // If notifications is open -> closes notifications.
  // If search is open -> closes search.
  // If on another tab (Chats, Hubbing, Profile) -> returns to Home.
  useEffect(() => {
    const onBackPress = () => {
      if (viewingStory) {
        setViewingStory(null);
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
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true; // 1 step back to home!
      }
      return false; // at home with nothing open: normal system exit
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [viewingStory, isShareHubbOpen, isNotificationsOpen, isSearchOpen, activeTab]);

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
              onOpenStory={(story) => {
                setViewingStory({
                  id: story.id,
                  authorName: story.id === userStory?.id ? 'Your Story' : story.name,
                  authorAvatar: story.avatar,
                  mediaUri:
                    story.mediaUri ||
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
                  thumbnailUri: story.thumbnailUri,
                  caption: story.caption,
                  timeAgo: story.timeAgo || 'Just now',
                  isUserStory: story.id === userStory?.id,
                });
              }}
              onOpenCreateStory={() => setIsShareHubbOpen(true)}
            />

            {/* Mood Filter Pills */}
            <MoodPills isDark={isDark} />

            {/* Posts Feed */}
            {POSTS.map((post) => (
              <PostCard key={post.id} post={post} isDark={isDark} />
            ))}

            {/* Extra bottom spacing so content scrolls past mascot */}
            <View style={{ height: 160 }} />
          </ScrollView>
        )}

        {activeTab === 'chats' && <ChatsView isDark={isDark} />}

        {activeTab === 'hubbing' && <HubbingView isDark={isDark} />}

        {activeTab === 'profile' && <ProfileView isDark={isDark} onLogout={onLogout} />}

        {/* ── Movable Mascot & Radial Navigation (Visible in ALL screens!) ── */}
        <ArcBottomNav
          isDark={isDark}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'search') {
              setIsSearchOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

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
              setUserStory({
                id: 'user-story-' + Date.now(),
                name: 'Your Story',
                avatar:
                  data.thumbnailUri ||
                  data.mediaUri ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                mediaUri: data.mediaUri,
                thumbnailUri: data.thumbnailUri,
                caption: data.caption,
                timeAgo: 'Just now',
                isUserStory: true,
              });
              setIsShareHubbOpen(false);
            }}
          />
        )}

        {/* Story Viewer Modal (shows active story when clicking on the story) */}
        {viewingStory && (
          <StoryViewerModal
            story={viewingStory}
            onClose={() => setViewingStory(null)}
            onAddStory={() => setIsShareHubbOpen(true)}
            onDeleteStory={() => {
              setUserStory(null);
              setViewingStory(null);
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
