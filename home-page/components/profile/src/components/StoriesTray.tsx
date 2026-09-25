import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { StoryItem, ThemeMode, UserProfile } from '../types/profile';

export interface StoriesTrayProps {
  user?: UserProfile;
  userAvatar?: string;
  userName?: string;
  stories?: StoryItem[];
  themeMode: ThemeMode;
  onPressAddStory: () => void;
  onPressStory: (index: number) => void;
}

export const StoriesTray: React.FC<StoriesTrayProps> = ({
  user,
  userAvatar,
  userName,
  stories = [],
  themeMode,
  onPressAddStory,
  onPressStory,
}) => {
  const colors = THEME[themeMode as 'light' | 'dark'] || THEME.light;

  const safeStories = Array.isArray(stories) ? stories : [];
  const currentUserId = user?.id || 'usr_hymasri';
  const currentUserName = user?.name || userName || 'Hymasri';
  const currentUserAvatar =
    user?.avatarUrl ||
    userAvatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop';

  const userStories = safeStories.filter(
    (s) => s && (s.userId === currentUserId || s.userName === currentUserName)
  );
  const otherStories = safeStories.filter(
    (s) => s && s.userId !== currentUserId && s.userName !== currentUserName
  );
  const hasUserStory = userStories.length > 0;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. YOUR STORY ITEM */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (hasUserStory) {
              const firstUserIdx = safeStories.findIndex(
                (s) => s && (s.userId === currentUserId || s.userName === currentUserName)
              );
              onPressStory(firstUserIdx >= 0 ? firstUserIdx : 0);
            } else {
              onPressAddStory();
            }
          }}
          style={styles.storyItem}
        >
          <View style={styles.avatarWrapper}>
            {hasUserStory ? (
              <LinearGradient
                colors={['#8B5CF6', '#6535EA', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View style={[styles.avatarInnerContainer, { backgroundColor: colors.cardBg }]}>
                  <Image source={{ uri: currentUserAvatar }} style={styles.avatarImage} />
                </View>
              </LinearGradient>
            ) : (
              <View style={[styles.plainRing, { borderColor: colors.border }]}>
                <Image source={{ uri: currentUserAvatar }} style={styles.avatarImage} />
              </View>
            )}

            {/* Plus badge to add story */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={(e) => {
                // @ts-ignore
                e?.stopPropagation?.();
                onPressAddStory();
              }}
              style={styles.addBadgeBtn}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text
            style={[styles.storyUserName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            Your Story
          </Text>
        </TouchableOpacity>

        {/* 2. FRIENDS' ACTIVE STORIES */}
        {otherStories.map((story) => {
          if (!story) return null;
          const globalIdx = safeStories.findIndex((s) => s && s.id === story.id);
          const isSeen = story.isSeen || (story as any).isViewed;
          return (
            <TouchableOpacity
              key={story.id}
              activeOpacity={0.8}
              onPress={() => onPressStory(globalIdx >= 0 ? globalIdx : 0)}
              style={styles.storyItem}
            >
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={
                    isSeen
                      ? ['#9CA3AF', '#D1D5DB']
                      : ['#8B5CF6', '#6535EA', '#F59E0B']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientRing}
                >
                  <View style={[styles.avatarInnerContainer, { backgroundColor: colors.cardBg }]}>
                    <Image source={{ uri: story.userAvatar }} style={styles.avatarImage} />
                  </View>
                </LinearGradient>

                {story.mediaType === 'video' && (
                  <View style={styles.videoIndicatorBadge}>
                    <Ionicons name="play" size={8} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.storyUserName,
                  { color: isSeen ? colors.textMuted : colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {story.userName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  avatarWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gradientRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plainRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    padding: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  addBadgeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: BRAND_COLORS.purplePrimary,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIndicatorBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    backgroundColor: '#7C3AED',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyUserName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
});

export default StoriesTray;
