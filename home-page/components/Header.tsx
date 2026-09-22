import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import _Svg, { Path as _Path } from 'react-native-svg';

// Cast for React 19 JSX IDE compatibility
const Svg = _Svg as any;
const Path = _Path as any;

export default function Header({
  isDark,
  onToggleTheme,
  hasNotification = true,
  onOpenNotifications,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSearch?: () => void;
  hasNotification?: boolean;
  onOpenNotifications?: () => void;
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

      {/* Right: Notification Bell only (Mood button removed from this side) */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={[styles.iconCircle, isDark && styles.iconCircleDark]}
          activeOpacity={0.75}
          onPress={onOpenNotifications}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={19}
            color={isDark ? '#D8CCFF' : '#6535EA'}
          />
          {/* Logo color circle notification dot — only shown when there is a notification */}
          {hasNotification && (
            <View style={[styles.notifDot, isDark && styles.notifDotDark]} />
          )}
        </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: '#EDE9F8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#302060',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircleDark: {
    backgroundColor: '#231846',
    borderColor: '#37276B',
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
});
