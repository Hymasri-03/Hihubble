import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HubbingViewProps {
  isDark?: boolean;
}

const REELS = [
  {
    id: 'r1',
    author: 'Alex Rivers',
    handle: '@alex_rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    caption: 'Golden hour drone shots over the mountain ridge 🌄✨ #NatureVibe #Hubbing',
    mediaUri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    music: 'Original Audio - Alex Rivers',
    likes: '24.8K',
    comments: '1,240',
    shares: '3.1K',
  },
  {
    id: 'r2',
    author: 'Jamie Sun',
    handle: '@jamie_tech',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    caption: 'Building a new mobile navigation fan in 30 seconds! ⚡💻 #CodeHub #Developer',
    mediaUri: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
    music: 'Lofi Beats - Late Night Session',
    likes: '18.4K',
    comments: '890',
    shares: '2.5K',
  },
];

export default function HubbingView({ isDark }: HubbingViewProps) {
  const { height } = useWindowDimensions();
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      pagingEnabled
      decelerationRate="fast"
    >
      {REELS.map((reel) => {
        const isLiked = !!likedMap[reel.id];
        return (
          <View key={reel.id} style={[styles.reelCard, { height: height - 110 }]}>
            {/* Background Media Image */}
            <Image source={{ uri: reel.mediaUri }} style={styles.media} resizeMode="cover" />

            {/* Gradient Overlays */}
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Top Bar */}
            <View style={styles.topBar}>
              <Text style={styles.headerTitle}>Hubbing</Text>
              <TouchableOpacity style={styles.cameraBtn}>
                <Feather name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Bottom Info & Side Actions */}
            <View style={styles.bottomSection}>
              {/* Creator Info & Caption */}
              <View style={styles.leftInfo}>
                <View style={styles.authorRow}>
                  <Image source={{ uri: reel.avatar }} style={styles.avatar} />
                  <View style={styles.nameWrap}>
                    <Text style={styles.authorName}>{reel.author}</Text>
                    <Text style={styles.handle}>{reel.handle}</Text>
                  </View>
                  <TouchableOpacity style={styles.followBtn}>
                    <Text style={styles.followText}>Follow</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.caption} numberOfLines={3}>
                  {reel.caption}
                </Text>

                <View style={styles.musicRow}>
                  <Ionicons name="musical-notes" size={14} color="#EDE7FF" />
                  <Text style={styles.musicText} numberOfLines={1}>
                    {reel.music}
                  </Text>
                </View>
              </View>

              {/* Right Side Actions */}
              <View style={styles.rightActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => toggleLike(reel.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={28}
                    color={isLiked ? '#FF2D6C' : '#FFFFFF'}
                  />
                  <Text style={[styles.actionLabel, isLiked && { color: '#FF2D6C' }]}>
                    {reel.likes}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
                  <Text style={styles.actionLabel}>{reel.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
                  <Text style={styles.actionLabel}>{reel.shares}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                  <Ionicons name="bookmark-outline" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  reelCard: {
    width: '100%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  media: {
    ...StyleSheet.absoluteFill,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  cameraBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 40,
    zIndex: 10,
  },
  leftInfo: {
    flex: 1,
    marginRight: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13, // squircle matching others
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameWrap: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  handle: {
    fontSize: 11,
    color: '#D8CCFF',
  },
  followBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#6535EA',
  },
  followText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicText: {
    color: '#EDE7FF',
    fontSize: 12,
  },
  rightActions: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 6,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
});
