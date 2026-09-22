import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, RadialGradient, Stop } from 'react-native-svg';

export type PostData = {
  id: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  caption: string;
  mediaUri: string;
  isVideo?: boolean;
  likes: string;
  comments: string;
  shares: string;
  bookmarks: string;
};

function GlowHeart({
  id,
  size,
  opacity = 0.95,
  rotation = 0,
}: {
  id: string;
  size: number;
  opacity?: number;
  rotation?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        transform: [{ rotate: `${rotation}deg` }],
        opacity,
      }}
    >
      <Svg viewBox="0 0 32 29" width="100%" height="100%">
        <Defs>
          <RadialGradient id={`hg-${id}`} cx="40%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFA6D5" stopOpacity={1} />
            <Stop offset="60%" stopColor="#FF4A9A" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#E01B78" stopOpacity={0.9} />
          </RadialGradient>
        </Defs>
        <Path
          fill={`url(#hg-${id})`}
          d="M16 28.2C7.4 22.4 1.2 16.7 1.2 9.6 1.2 4.9 4.8 1.2 9.2 1.2c2.8 0 5.2 1.5 6.8 3.8 1.6-2.3 4-3.8 6.8-3.8 4.4 0 8 3.7 8 8.4 0 7.1-6.2 12.8-14.8 18.6z"
        />
      </Svg>
    </View>
  );
}

interface HeartParticle {
  id: number;
  anim: Animated.Value;
  x: number;
  rot: number;
}

export default function PostCard({
  post,
  isDark,
}: {
  post: PostData;
  isDark?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [heartPops, setHeartPops] = useState<HeartParticle[]>([]);

  // Comments list state for this specific post
  const [commentsList, setCommentsList] = useState([
    {
      id: 'c1',
      author: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: 'Where was this taken? Looks absolutely surreal! 🏔️✨',
      time: '1h ago',
    },
    {
      id: 'c2',
      author: 'Marcus',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      text: 'Need to visit next time! Great vibes 🔥',
      time: '35m ago',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // Handle like button press with floating hearts burst
  const handleLikePress = () => {
    const nextState = !liked;
    setLiked(nextState);

    if (nextState) {
      // Spawn floating hearts popup from like button
      const newHearts: HeartParticle[] = Array.from({ length: 6 }).map((_, idx) => ({
        id: Date.now() + idx,
        anim: new Animated.Value(0),
        x: (Math.random() - 0.5) * 36,
        rot: (Math.random() - 0.5) * 28,
      }));

      setHeartPops((prev) => [...prev, ...newHearts]);

      newHearts.forEach((h, i) => {
        Animated.timing(h.anim, {
          toValue: 1,
          duration: 900 + i * 80,
          useNativeDriver: true,
        }).start(() => {
          setHeartPops((prev) => prev.filter((item) => item.id !== h.id));
        });
      });
    }
  };

  const handleAddComment = () => {
    if (newCommentText.trim()) {
      setCommentsList((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          author: 'You',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          text: newCommentText.trim(),
          time: 'Just now',
        },
      ]);
      setNewCommentText('');
    }
  };

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {/* Author Header */}
      <View style={styles.headerRow}>
        <View style={styles.authorGroup}>
          <Image source={{ uri: post.authorAvatar }} style={styles.authorAvatar} />
          <View style={styles.authorText}>
            <Text style={[styles.authorName, isDark && styles.textLight]}>
              {post.authorName}
            </Text>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                {post.timeAgo}
              </Text>
              <Text style={[styles.dotSeparator, isDark && styles.timeTextDark]}>·</Text>
              <Ionicons
                name="globe-outline"
                size={11}
                color={isDark ? '#A99BD1' : '#6D5F96'}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton} activeOpacity={0.6}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={isDark ? '#D8CCFF' : '#30235C'}
          />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <Text style={[styles.caption, isDark && styles.textLight]}>
        {post.caption}
      </Text>

      {/* ── Media Container with Overlaid Actions (ON the post, as in user image) ── */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: post.mediaUri }}
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Video Play Button in Center */}
        {post.isVideo && (
          <View style={styles.playOverlay}>
            <View style={styles.playButtonCircle}>
              <Ionicons name="play" size={28} color="#1E143B" style={{ marginLeft: 3 }} />
            </View>
          </View>
        )}

        {/* ── Overlaid Right Action Bar (ON the post) ── */}
        <View style={styles.onPostActions}>
          {/* Like Button with Popups */}
          <View style={styles.actionItemWrap}>
            {/* Animated heart popups bursting from like button */}
            {heartPops.map((h) => {
              const translateY = h.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -120],
              });
              const scale = h.anim.interpolate({
                inputRange: [0, 0.2, 0.7, 1],
                outputRange: [0.4, 1.3, 1.1, 0],
              });
              const opacity = h.anim.interpolate({
                inputRange: [0, 0.1, 0.7, 1],
                outputRange: [0, 1, 0.9, 0],
              });

              return (
                <Animated.View
                  key={h.id}
                  pointerEvents="none"
                  style={[
                    styles.heartPopupItem,
                    {
                      transform: [
                        { translateY },
                        { translateX: h.x },
                        { scale },
                        { rotate: `${h.rot}deg` },
                      ],
                      opacity,
                    },
                  ]}
                >
                  <GlowHeart id={`pop-${h.id}`} size={28} />
                </Animated.View>
              );
            })}

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={handleLikePress}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={27}
                color={liked ? '#FF2D6C' : '#FFFFFF'}
              />
              {/* Color of likes count matches others */}
              <Text style={[styles.actionCount, liked && { color: '#FF4A9A' }]}>
                {post.likes}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comment Button (Toggles comments bottom drawer) */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setShowComments((prev) => !prev)}
          >
            <Ionicons name="chatbubble-outline" size={25} color="#FFFFFF" />
            <Text style={styles.actionCount}>{commentsList.length}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Feather
              name="send"
              size={23}
              color="#FFFFFF"
              style={{ transform: [{ rotate: '15deg' }] }}
            />
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setSaved(!saved)}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved ? '#A855F7' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Video progress/control footer overlay when isVideo is true */}
        {post.isVideo && (
          <View style={styles.videoFooterOverlay}>
            <View style={styles.videoControlsRow}>
              <View style={styles.videoLeftControls}>
                <Ionicons name="volume-medium-outline" size={18} color="#FFFFFF" />
                <Text style={styles.videoTimeText}>0:00 / 0:10</Text>
              </View>
              <View style={styles.videoRightControls}>
                <Ionicons name="volume-mute-outline" size={16} color="#FFFFFF" />
                <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
                <Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.videoProgressBarTrack}>
              <View style={styles.videoProgressBarFill} />
            </View>
          </View>
        )}
      </View>

      {/* ── Expandable Comments Drawer at bottom of the related post ── */}
      {showComments && (
        <View style={[styles.commentsSection, isDark && styles.commentsSectionDark]}>
          <View style={styles.commentsHeader}>
            <Text style={[styles.commentsTitle, isDark && styles.commentsTitleDark]}>
              Comments ({commentsList.length})
            </Text>
            <TouchableOpacity onPress={() => setShowComments(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={isDark ? '#FFFFFF' : '#55477B'} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {commentsList.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                <View style={[styles.commentBody, isDark && styles.commentBodyDark]}>
                  <View style={styles.commentTop}>
                    <Text style={[styles.commentAuthor, isDark && styles.commentAuthorDark]}>
                      {c.author}
                    </Text>
                    <Text style={[styles.commentTime, isDark && styles.commentTimeDark]}>
                      {c.time}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, isDark && styles.commentTextDark]}>
                    {c.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Add Comment Input Row */}
          <View style={[styles.commentInputRow, isDark && styles.commentInputRowDark]}>
            <TextInput
              placeholder="Add a comment..."
              placeholderTextColor={isDark ? '#8E80B4' : '#9E92BD'}
              value={newCommentText}
              onChangeText={setNewCommentText}
              style={[styles.commentInput, isDark && styles.commentInputDark]}
            />
            <TouchableOpacity
              style={styles.sendCommentBtn}
              onPress={handleAddComment}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  cardDark: {
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
  },
  authorText: {
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1245',
  },
  textLight: {
    color: '#EDE7FF',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6D5F96',
  },
  timeTextDark: {
    color: '#A99BD1',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#6D5F96',
  },
  moreButton: {
    padding: 6,
  },
  caption: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#1E1449',
    lineHeight: 20,
    marginBottom: 12,
  },

  // Full-width media container
  mediaContainer: {
    width: '100%',
    height: 290,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1B143B',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Overlaid actions ON the right side of the post media
  onPostActions: {
    position: 'absolute',
    right: 14,
    bottom: 36,
    alignItems: 'center',
    gap: 16,
    zIndex: 15,
  },
  actionItemWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Floating heart burst item from like button
  heartPopupItem: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    zIndex: 20,
  },

  // Video progress footer overlay
  videoFooterOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 10,
    zIndex: 10,
  },
  videoControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  videoLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  videoRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoProgressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  videoProgressBarFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },

  // Expandable Comments Section at bottom of related post
  commentsSection: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#5234A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  commentsSectionDark: {
    backgroundColor: 'rgba(26, 17, 50, 0.88)',
    borderColor: 'rgba(120, 80, 210, 0.28)',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B1245',
  },
  commentsTitleDark: {
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  commentsList: {
    gap: 10,
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  commentBody: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 12,
    padding: 8,
  },
  commentBodyDark: {
    backgroundColor: 'rgba(101, 53, 234, 0.28)', // Light tint of the logo color
    borderWidth: 1,
    borderColor: 'rgba(157, 107, 255, 0.35)',
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B1245',
  },
  commentAuthorDark: {
    color: '#FFFFFF', // Pure white
  },
  commentTime: {
    fontSize: 10,
    color: '#8A7BAE',
  },
  commentTimeDark: {
    color: '#D8CCFF',
  },
  commentText: {
    fontSize: 12,
    color: '#342363',
    lineHeight: 16,
  },
  commentTextDark: {
    color: '#FFFFFF', // Pure white
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: '#E8E1F7',
  },
  commentInputRowDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  commentInput: {
    flex: 1,
    fontSize: 12,
    color: '#211054',
  },
  commentInputDark: {
    color: '#EDE7FF',
  },
  sendCommentBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6535EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
