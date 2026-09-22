import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';

export interface StoryData {
  id: string;
  authorName: string;
  authorAvatar: string;
  mediaUri: string;
  thumbnailUri?: string;
  caption?: string;
  timeAgo: string;
  isUserStory?: boolean;
}

interface StoryViewerModalProps {
  story: StoryData;
  onClose: () => void;
  onAddStory?: () => void;
  onDeleteStory?: () => void;
}

const { width, height } = Dimensions.get('window');

function StoryVideoPlayer({ uri, thumbnailUri }: { uri: string; thumbnailUri?: string }) {
  const player = useVideoPlayer(uri, (p) => {
    try {
      p.loop = true;
      p.muted = false;
      p.play();
    } catch (e) {
      console.log('Story video play error:', e);
    }
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

export default function StoryViewerModal({
  story,
  onClose,
  onAddStory,
  onDeleteStory,
}: StoryViewerModalProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });

    return () => {
      animation.stop();
    };
  }, [story]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isVideo =
    story.mediaUri.endsWith('.mp4') ||
    story.mediaUri.endsWith('.mov') ||
    story.mediaUri.includes('video') ||
    Boolean(story.thumbnailUri);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Main Story Image or Video presentation */}
      {isVideo ? (
        <StoryVideoPlayer uri={story.mediaUri} thumbnailUri={story.thumbnailUri} />
      ) : (
        <Image
          source={{ uri: story.mediaUri }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

      {/* Top & Bottom Vignette Gradients */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Segmented Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[styles.progressBarFill, { width: progressWidth }]}
            />
          </View>
        </View>

        {/* Top Header: Author info & Close */}
        <View style={styles.topHeader}>
          <View style={styles.authorRow}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: story.authorAvatar }} style={styles.avatar} />
            </View>
            <View style={styles.authorTextGroup}>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{story.authorName}</Text>
                {story.isUserStory && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                )}
              </View>
              <Text style={styles.timeAgo}>{story.timeAgo}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityLabel="Close story"
          >
            <Feather name="x" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Mid area tap gestures: left half / right half */}
        <View style={styles.tapArea}>
          <TouchableOpacity
            style={styles.tapHalf}
            activeOpacity={1}
            onPress={onClose}
          />
          <TouchableOpacity
            style={styles.tapHalf}
            activeOpacity={1}
            onPress={onClose}
          />
        </View>

        {/* Bottom Area: Caption & Actions */}
        <View style={styles.bottomArea}>
          {story.caption && (
            <View style={styles.captionCard}>
              <Text style={styles.captionText}>{story.caption}</Text>
            </View>
          )}

          {story.isUserStory ? (
            /* User's Story Actions: Views count + Add More / Delete */
            <View style={styles.userStoryActionsRow}>
              <View style={styles.viewsCounter}>
                <Feather name="eye" size={16} color="#FFFFFF" />
                <Text style={styles.viewsCountText}>42 views</Text>
              </View>

              <View style={styles.userButtonsGroup}>
                {onAddStory && (
                  <TouchableOpacity
                    style={styles.addMoreBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      onAddStory();
                    }}
                  >
                    <Feather name="plus" size={15} color="#FFFFFF" />
                    <Text style={styles.addMoreText}>Add HUBB</Text>
                  </TouchableOpacity>
                )}

                {onDeleteStory && (
                  <TouchableOpacity
                    style={styles.deleteStoryBtn}
                    activeOpacity={0.8}
                    onPress={onDeleteStory}
                  >
                    <Feather name="trash-2" size={16} color="#FF6B8B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* Other User's Story Actions: Reply & Like */
            <View style={styles.replyRow}>
              <View style={styles.replyInputWrap}>
                <Text style={styles.replyPlaceholder}>Send a message...</Text>
              </View>

              <TouchableOpacity
                style={styles.likeBtn}
                activeOpacity={0.7}
                onPress={() => setIsLiked((prev) => !prev)}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isLiked ? '#FF2A85' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
                <Feather name="send" size={21} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    zIndex: 101,
  },
  backgroundImage: {
    width,
    height,
    position: 'absolute',
  },
  videoBackground: {
    width,
    height,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCenterBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(101, 53, 234, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  videoPlayingText: {
    color: '#EDE7FF',
    fontSize: 14,
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Progress Bar
  progressBarContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  progressBarTrack: {
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
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
    gap: 12,
  },
  replyInputWrap: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  replyPlaceholder: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
  },
  likeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
