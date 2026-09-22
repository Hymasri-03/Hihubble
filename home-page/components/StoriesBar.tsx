import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export interface StoryItemData {
  id: string;
  name: string;
  avatar: string;
  hasPlus?: boolean;
  mediaUri?: string;
  thumbnailUri?: string;
  caption?: string;
  timeAgo?: string;
  isUserStory?: boolean;
}

const DEFAULT_USER_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

const STORIES: StoryItemData[] = [
  {
    id: 'alex',
    name: 'Alex Rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    hasPlus: true,
    mediaUri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'The view from our team offsite was incredible! 🏔️✨',
    timeAgo: '1h ago',
  },
  {
    id: 'jamie',
    name: 'Jamie Sun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    hasPlus: false,
    mediaUri: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
    caption: 'Live coding session with the team 🚀💻',
    timeAgo: '3h ago',
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    hasPlus: false,
    mediaUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    caption: 'Weekend vibes in the city ☕🌸',
    timeAgo: '5h ago',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    hasPlus: false,
    mediaUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    caption: 'Exploring new trails today 🌲🚵',
    timeAgo: '8h ago',
  },
];

interface StoriesBarProps {
  isDark?: boolean;
  userStory?: StoryItemData | null;
  onOpenStory?: (story: StoryItemData) => void;
  onOpenCreateStory?: () => void;
}

export default function StoriesBar({
  isDark,
  userStory,
  onOpenStory,
  onOpenCreateStory,
}: StoriesBarProps) {
  const hasStory = !!userStory;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Your Story (Profile) ── */}
        <View style={styles.storyItem}>
          <TouchableOpacity
            style={styles.ringWrapper}
            activeOpacity={0.8}
            onPress={() => {
              if (hasStory && userStory) {
                // If there is a story -> show it!
                onOpenStory?.(userStory);
              } else {
                // No story yet -> show the Share HUBBs screen!
                onOpenCreateStory?.();
              }
            }}
          >
            {hasStory ? (
              /* Active Story Ring (Vibrant gradient squircle) */
              <LinearGradient
                colors={['#8338EC', '#C724B1', '#FF2A85']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientSquircleRing}
              >
                <View
                  style={[
                    styles.innerGap,
                    { borderColor: isDark ? '#140C2C' : '#E5F0FF' },
                  ]}
                >
                  <Image
                    source={{ uri: userStory.avatar || DEFAULT_USER_AVATAR }}
                    style={styles.storyAvatar}
                  />
                </View>
              </LinearGradient>
            ) : (
              /* Default State when no story yet: Avatar in soft dashed border */
              <View
                style={[
                  styles.emptyStorySquircle,
                  { borderColor: isDark ? '#3D2A70' : '#C7B9F4' },
                ]}
              >
                <Image
                  source={{ uri: DEFAULT_USER_AVATAR }}
                  style={styles.storyAvatar}
                />
              </View>
            )}

            {/* Small + icon badge placed on right side bottom */}
            <TouchableOpacity
              style={[
                styles.yourStoryPlusBadge,
                isDark && styles.yourStoryPlusBadgeDark,
              ]}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                // When clicking on the + small icon -> show the Share HUBBs screen!
                onOpenCreateStory?.();
              }}
              accessibilityLabel="Add to Your Story"
            >
              <Feather name="plus" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>

          <Text
            style={[styles.nameLabel, isDark && styles.nameLabelDark]}
            numberOfLines={1}
          >
            Your Story
          </Text>
        </View>

        {/* ── Stories of Others ── */}
        {STORIES.map((story) => (
          <View key={story.id} style={styles.storyItem}>
            <TouchableOpacity
              style={styles.ringWrapper}
              activeOpacity={0.8}
              onPress={() => onOpenStory?.(story)}
            >
              <LinearGradient
                colors={['#8338EC', '#C724B1', '#FF2A85']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientSquircleRing}
              >
                <View
                  style={[
                    styles.innerGap,
                    { borderColor: isDark ? '#140C2C' : '#E5F0FF' },
                  ]}
                >
                  <Image source={{ uri: story.avatar }} style={styles.storyAvatar} />
                </View>
              </LinearGradient>

              {story.hasPlus && (
                <View style={styles.miniBadge}>
                  <Feather name="plus" size={10} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <Text
              style={[styles.nameLabel, isDark && styles.nameLabelDark]}
              numberOfLines={1}
            >
              {story.name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  ringWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  // Active story gradient ring
  gradientSquircleRing: {
    width: 64,
    height: 64,
    borderRadius: 20,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2A85',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  // Empty story squircle (when user has no story)
  emptyStorySquircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Dark/light gap between gradient ring and photo
  innerGap: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  // Small + icon badge placed on right side bottom of "Your Story"
  yourStoryPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6535EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  yourStoryPlusBadgeDark: {
    borderColor: '#140C2C',
  },
  miniBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6535EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#281B5E',
    textAlign: 'center',
  },
  nameLabelDark: {
    color: '#D8CCFF',
  },
});
