import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import _Svg, { Path as _Path } from 'react-native-svg';

// Cast for React 19 JSX IDE compatibility
const Svg = _Svg as any;
const Path = _Path as any;

export default function Header({
  isDark,
  onToggleTheme,
  hasNotification = true,
  onOpenNotifications,
  onOpenProfile,
  userAvatar,
  rightType = 'notification',
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch?: () => void;
  hasNotification?: boolean;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  userAvatar?: string;
  rightType?: 'notification' | 'profile';
}) {
  return (
    <View style={styles.container}>
      {/* Left: Mood / Theme Toggle Button (placed in the search option place) */}
      <View style={styles.leftGroup}>
        <TouchableOpacity
          style={[styles.moodButton, isDark && styles.moodButtonDark]}
          activeOpacity={0.75}
          onPress={onToggleTheme}
          accessibilityLabel="Toggle Mood Theme"
        >
          {isDark ? (
            <Ionicons name="moon" size={18} color="#FFD15C" />
          ) : (
            <Feather name="sun" size={19} color="#6535EA" />
          )}
        </TouchableOpacity>
      </View>

      {/* DEAD CENTER: Mascot + HiHubble Logo */}
      <View style={styles.absoluteCenter} pointerEvents="none">
        <View style={styles.centerGroup}>
          <Image
            source={require('../../HiHubbleSplash/assets/splash/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />

          <View style={styles.brandRow}>
            {/* "Hi" with pink heart dot over the "i" */}
            <View style={styles.hiWrapper}>
              <Text style={[styles.brandHi, isDark && styles.brandHiDark]}>Hı</Text>
              <View style={styles.heartDot}>
                <Svg viewBox="0 0 32 29" width={9} height={8}>
                  <Path
                    fill="#FF3B8A"
                    d="M16 28.2C7.4 22.4 1.2 16.7 1.2 9.6 1.2 4.9 4.8 1.2 9.2 1.2c2.8 0 5.2 1.5 6.8 3.8 1.6-2.3 4-3.8 6.8-3.8 4.4 0 8 3.7 8 8.4 0 7.1-6.2 12.8-14.8 18.6z"
                  />
                </Svg>
              </View>
            </View>

            {/* "Hubble" */}
            <Text style={[styles.brandHubble, isDark && styles.brandHubbleDark]}>
              Hubble
            </Text>
          </View>
        </View>
      </View>

      {/* Right: Notification Bell or Profile Avatar */}
      <View style={styles.rightGroup}>
        {rightType === 'profile' ? (
          <TouchableOpacity
            style={styles.profileAvatarWrapper}
            activeOpacity={0.8}
            onPress={onOpenProfile || onOpenNotifications}
            accessibilityLabel="Profile"
          >
            <LinearGradient
              colors={['#4C2CE6', '#6535EA', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradientRing}
            >
              <View style={[styles.profileInnerGap, { borderColor: isDark ? '#140C2C' : '#FFFFFF' }]}>
                <Image
                  source={{
                    uri:
                      userAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  }}
                  style={styles.profileAvatar}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.iconCircle, isDark && styles.iconCircleDark]}
            activeOpacity={0.75}
            onPress={onOpenNotifications}
            accessibilityLabel="Notifications"
          >
            <Feather
              name="bell"
              size={19}
              color={isDark ? '#D8CCFF' : '#6535EA'}
            />
            {hasNotification && (
              <View style={[styles.notifDot, isDark && styles.notifDotDark]} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    position: 'relative',
    minHeight: 52,
  },

  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },

  // Mood button placed on the left where search used to be
  moodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4C4FC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  moodButtonDark: {
    backgroundColor: '#231846',
    borderColor: '#4A3485',
    shadowColor: '#FFD15C',
    shadowOpacity: 0.2,
  },

  // Absolute Dead Center
  absoluteCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mascot: {
    width: 32,
    height: 36,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hiWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  brandHi: {
    fontSize: 21,
    fontWeight: '800',
    color: '#6535EA',
    letterSpacing: -0.3,
  },
  brandHiDark: {
    color: '#9D6BFF',
  },
  heartDot: {
    position: 'absolute',
    top: 3,
    right: 1,
  },
  brandHubble: {
    fontSize: 21,
    fontWeight: '800',
    color: '#211054',
    letterSpacing: -0.4,
  },
  brandHubbleDark: {
    color: '#EDE7FF',
  },

  // Right Section (Notification bell only)
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4C4FC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircleDark: {
    backgroundColor: '#231846',
    borderColor: '#4A3485',
    shadowColor: '#8338EC',
    shadowOpacity: 0.2,
  },
  // Circular notification dot in logo purple color (#6535EA / #9D6BFF)
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6535EA', // HiHubble logo color
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifDotDark: {
    backgroundColor: '#9D6BFF',
    borderColor: '#231846',
  },

  // Profile avatar gradient ring in header
  profileAvatarWrapper: {
    padding: 1,
  },
  profileGradientRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8338EC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  profileInnerGap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
});
