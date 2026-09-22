import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';

interface ProfileViewProps {
  isDark?: boolean;
  onLogout?: () => void;
}

const GALLERY_POSTS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&auto=format&fit=crop&q=80',
];

export default function ProfileView({ isDark, onLogout }: ProfileViewProps) {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'liked'>('posts');

  const itemSize = (width - 32 - 12) / 3;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header Card */}
      <View style={[styles.headerCard, isDark && styles.headerCardDark]}>
        {/* Top actions */}
        <View style={styles.topRow}>
          <Text style={[styles.userName, isDark && styles.userNameDark]}>hyma_works</Text>
          <View style={styles.topIcons}>
            {onLogout && (
              <TouchableOpacity
                style={[styles.circleBtn, isDark && styles.circleBtnDark]}
                onPress={() => {
                  Alert.alert(
                    'Log Out',
                    'Are you sure you want to log out of HiHubble?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Log Out', style: 'destructive', onPress: onLogout },
                    ]
                  );
                }}
                accessibilityLabel="Log out"
              >
                <Feather name="log-out" size={17} color="#FF4D6D" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.circleBtn, isDark && styles.circleBtnDark]}>
              <Feather name="settings" size={18} color={isDark ? '#D8CCFF' : '#6535EA'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar & Stats */}
        <View style={styles.avatarStatsRow}>
          {/* Squircle gradient ring avatar */}
          <LinearGradient
            colors={['#8338EC', '#C724B1', '#FF2A85']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradientRing}
          >
            <View style={[styles.avatarGap, { backgroundColor: isDark ? '#140C2C' : '#FFFFFF' }]}>
              <Image
                source={require('../../HiHubbleSplash/assets/splash/mascot.png')}
                style={styles.avatarImg}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>32</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>2.4K</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>380</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Following</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioContainer}>
          <Text style={[styles.displayName, isDark && styles.displayNameDark]}>Hyma ✨</Text>
          <Text style={[styles.bioText, isDark && styles.bioTextDark]}>
            Explorer & Creator 🚀 | Sharing daily vibes, moods & code on HiHubble 💜
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareBtn, isDark && styles.shareBtnDark]}>
            <Text style={[styles.shareBtnText, isDark && styles.shareBtnTextDark]}>
              Share Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Gallery Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'posts' && styles.tabBtnActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="grid-outline"
            size={20}
            color={activeTab === 'posts' ? '#6535EA' : isDark ? '#8A7BAE' : '#998BBF'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons
            name="bookmark-outline"
            size={20}
            color={activeTab === 'saved' ? '#6535EA' : isDark ? '#8A7BAE' : '#998BBF'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'liked' && styles.tabBtnActive]}
          onPress={() => setActiveTab('liked')}
        >
          <Ionicons
            name="heart-outline"
            size={20}
            color={activeTab === 'liked' ? '#6535EA' : isDark ? '#8A7BAE' : '#998BBF'}
          />
        </TouchableOpacity>
      </View>

      {/* Grid of Posts */}
      <View style={styles.grid}>
        {GALLERY_POSTS.map((uri, idx) => (
          <Image
            key={idx}
            source={{ uri }}
            style={[styles.gridImg, { width: itemSize, height: itemSize }]}
          />
        ))}
      </View>

      {/* Bottom padding */}
      <View style={{ height: 160 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  headerCardDark: {
    backgroundColor: 'rgba(28, 18, 54, 0.78)',
    borderColor: 'rgba(120, 80, 200, 0.28)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#211054',
  },
  userNameDark: {
    color: '#EDE7FF',
  },
  topIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E1F7',
  },
  circleBtnDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarGradientRing: {
    width: 72,
    height: 72,
    borderRadius: 22, // squircle matching story shape
    padding: 2.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGap: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 50,
    height: 58,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211054',
  },
  statNumberDark: {
    color: '#EDE7FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#766799',
    marginTop: 2,
  },
  statLabelDark: {
    color: '#A99CD0',
  },
  bioContainer: {
    marginBottom: 14,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1245',
  },
  displayNameDark: {
    color: '#EDE7FF',
  },
  bioText: {
    fontSize: 13,
    color: '#55477B',
    lineHeight: 18,
    marginTop: 3,
  },
  bioTextDark: {
    color: '#BDB1DE',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#6535EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  shareBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8CCFF',
  },
  shareBtnDark: {
    backgroundColor: '#261B48',
    borderColor: '#4A3780',
  },
  shareBtnText: {
    color: '#6535EA',
    fontWeight: '700',
    fontSize: 13,
  },
  shareBtnTextDark: {
    color: '#D8CCFF',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101, 53, 234, 0.15)',
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6535EA',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridImg: {
    borderRadius: 12,
  },
});
