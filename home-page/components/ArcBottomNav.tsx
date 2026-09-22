import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Animated,
  PanResponder,
  BackHandler,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export type TabKey = 'chats' | 'hubbing' | 'home' | 'search' | 'profile';

interface NavTab {
  key: TabKey;
  label: string;
  icon: (color: string, isActive: boolean) => React.ReactElement;
}

interface ArcBottomNavProps {
  isDark?: boolean;
  activeTab?: TabKey;
  onSelectTab?: (tab: TabKey) => void;
  onOpenSearch?: () => void;
}

// Distance between mascot and categories
const ARC_RADIUS = 92;
const BTN_SIZE = 46;
const MASCOT_SIZE = 76;

const TABS: NavTab[] = [
  {
    key: 'chats',
    label: 'Chats',
    icon: (c, active) => (
      <Ionicons
        name={active ? 'chatbubble' : 'chatbubble-outline'}
        size={21}
        color={c}
      />
    ),
  },
  {
    key: 'hubbing',
    label: 'Hubbing',
    icon: (c, active) => (
      <Ionicons
        name={active ? 'film' : 'film-outline'}
        size={21}
        color={c}
      />
    ),
  },
  {
    key: 'home',
    label: 'Home',
    icon: (c, active) => (
      <Ionicons
        name={active ? 'home' : 'home-outline'}
        size={22}
        color={c}
      />
    ),
  },
  {
    key: 'search',
    label: 'Search',
    icon: (c) => <Feather name="search" size={21} color={c} />,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: (c, active) => (
      <Ionicons
        name={active ? 'person' : 'person-outline'}
        size={21}
        color={c}
      />
    ),
  },
];

/**
 * Calculates dynamic 180° arc angles based on mascot screen position:
 * - When mascot is on left side/corners -> categories fan to the RIGHT side in 180°
 * - When mascot is on right side/corners -> categories fan to the LEFT side in 180°
 * - When mascot is near top -> categories fan DOWNWARDS in 180°
 * - When mascot is near bottom -> categories fan UPWARDS in 180°
 * - Corners automatically fan diagonally into the screen
 */
function getCategoryAngles(
  mascotCenterX: number,
  mascotCenterY: number,
  width: number,
  height: number
): number[] {
  const isLeft = mascotCenterX < width * 0.38;
  const isRight = mascotCenterX > width * 0.62;
  const isTop = mascotCenterY < height * 0.35;
  const isBottom = mascotCenterY > height * 0.65;

  if (isLeft && isTop) {
    // Top-Left corner: fan down-right into the screen
    return [20, -12.5, -45, -77.5, -110];
  }
  if (isLeft && isBottom) {
    // Bottom-Left corner: fan up-right into the screen
    return [120, 82.5, 45, 7.5, -30];
  }
  if (isRight && isTop) {
    // Top-Right corner: fan down-left into the screen
    return [160, 192.5, 225, 257.5, 290];
  }
  if (isRight && isBottom) {
    // Bottom-Right corner: fan up-left into the screen
    return [60, 97.5, 135, 172.5, 210];
  }
  if (isLeft) {
    // Left side: fan to the RIGHT side in 180 degrees
    return [75, 37.5, 0, -37.5, -75];
  }
  if (isRight) {
    // Right side: fan to the LEFT side in 180 degrees
    return [105, 142.5, 180, 217.5, 255];
  }
  if (isTop) {
    // Top side: fan DOWNWARDS in 180 degrees
    return [195, 232.5, 270, 307.5, 345];
  }
  // Bottom or center: fan UPWARDS in 180 degrees
  return [165, 127.5, 90, 52.5, 15];
}

export default function ArcBottomNav({
  isDark,
  activeTab: externalActiveTab,
  onSelectTab,
  onOpenSearch,
}: ArcBottomNavProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabKey>('home');
  const activeTab = externalActiveTab ?? internalActiveTab;

  const [isOpen, setIsOpen] = useState(false);
  const { width, height } = useWindowDimensions();

  // Initial mascot position centered horizontally near bottom
  const initialX = (width - MASCOT_SIZE) / 2;
  const initialY = Math.max(100, height - 126);

  const [mascotPos, setMascotPos] = useState({ x: initialX, y: initialY });
  const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
  const currentPos = useRef({ x: initialX, y: initialY });
  const hasMoved = useRef(false);

  // Sync position if screen orientation or width changes before manual drag
  useEffect(() => {
    if (!hasMoved.current) {
      const newX = (width - MASCOT_SIZE) / 2;
      const newY = Math.max(100, height - 126);
      currentPos.current = { x: newX, y: newY };
      pan.setValue({ x: newX, y: newY });
      setMascotPos({ x: newX, y: newY });
    }
  }, [width, height]);

  // Android Back Button handler — 1 step back!
  // If categories are open, back button closes them without exiting
  useEffect(() => {
    const onBackPress = () => {
      if (isOpen) {
        setIsOpen(false);
        return true; // handled 1-step back!
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isOpen]);

  // PanResponder for smooth dragging anywhere on the screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        // Prepare drag starting offset
        pan.setOffset({
          x: currentPos.current.x,
          y: currentPos.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        if (Math.hypot(gestureState.dx, gestureState.dy) > 6) {
          hasMoved.current = true;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        const dist = Math.hypot(gestureState.dx, gestureState.dy);

        if (dist < 6) {
          // Tap: toggle categories
          setIsOpen((prev) => !prev);
          // Restore exact current coordinates
          pan.setValue(currentPos.current);
        } else {
          // Drag: compute clamped final coordinates
          const minX = 10;
          const maxX = width - MASCOT_SIZE - 10;
          const minY = 50;
          const maxY = height - MASCOT_SIZE - 20;

          const rawX = currentPos.current.x + gestureState.dx;
          const rawY = currentPos.current.y + gestureState.dy;

          const clampedX = Math.max(minX, Math.min(maxX, rawX));
          const clampedY = Math.max(minY, Math.min(maxY, rawY));

          currentPos.current = { x: clampedX, y: clampedY };
          pan.setValue({ x: clampedX, y: clampedY });
          setMascotPos({ x: clampedX, y: clampedY });
        }
      },
    })
  ).current;

  const handleTabPress = (tab: TabKey) => {
    setInternalActiveTab(tab);
    onSelectTab?.(tab);
    if (tab === 'search' && onOpenSearch) {
      onOpenSearch();
    }
    // Close the category fan once tapped
    setIsOpen(false);
  };

  const iconColor = (tab: TabKey) => {
    if (activeTab === tab) return '#6535EA';
    return isDark ? '#D6C8FF' : '#5528CC';
  };

  // Center of mascot for category orbital positioning
  const mascotCenterX = mascotPos.x + MASCOT_SIZE / 2;
  const mascotCenterY = mascotPos.y + MASCOT_SIZE / 2;

  // Compute angles dynamically so the 180° arc always opens toward the open space of the screen
  const angles = getCategoryAngles(mascotCenterX, mascotCenterY, width, height);

  return (
    <View pointerEvents="box-none" style={styles.fullScreenOverlay}>
      {/* Tap backdrop to close categories (1-step back dismiss) */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      )}

      {/* ── Category Buttons — snug arc with translucent watermark bubbles, no category names ── */}
      {isOpen &&
        TABS.map((tab, i) => {
          const angleRad = (angles[i] * Math.PI) / 180;
          const dx = Math.cos(angleRad) * ARC_RADIUS;
          const dy = Math.sin(angleRad) * ARC_RADIUS;

          // In screen coordinates: y increases downward.
          // For upward angles, dy is positive, so subtracting dy moves upward!
          const rawLeft = mascotCenterX + dx - BTN_SIZE / 2;
          const rawTop = mascotCenterY - dy - BTN_SIZE / 2;

          // Keep category buttons fully within visible screen boundaries
          const left = Math.max(8, Math.min(width - BTN_SIZE - 8, rawLeft));
          const top = Math.max(45, Math.min(height - BTN_SIZE - 20, rawTop));
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.75}
              onPress={() => handleTabPress(tab.key)}
              style={[
                styles.watermarkButton,
                isDark && styles.watermarkButtonDark,
                isActive && styles.watermarkButtonActive,
                isActive && isDark && styles.watermarkButtonActiveDark,
                { left, top },
              ]}
              accessibilityLabel={tab.label}
            >
              {tab.icon(iconColor(tab.key), isActive)}
            </TouchableOpacity>
          );
        })}

      {/* ── Movable Floating Mascot Button (White background, draggable anywhere, tap to toggle) ── */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.mascotWrapper,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        accessibilityLabel="Mascot navigation toggle"
      >
        <Image
          source={require('../../HiHubbleSplash/assets/splash/mascot.png')}
          style={styles.mascotImg}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },

  // Translucent watermark bubble background to highlight each category icon
  watermarkButton: {
    position: 'absolute',
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.76)', // translucent watermark effect
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  watermarkButtonDark: {
    backgroundColor: 'rgba(38, 22, 80, 0.78)',
    borderColor: 'rgba(160, 120, 255, 0.35)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  watermarkButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: '#6535EA',
    borderWidth: 2,
    shadowColor: '#6535EA',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  watermarkButtonActiveDark: {
    backgroundColor: 'rgba(56, 32, 115, 0.94)',
    borderColor: '#9D6BFF',
  },

  // Mascot toggle button — ALWAYS WHITE background, draggable across screens
  mascotWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    backgroundColor: '#FFFFFF', // Mascot background is white
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    borderWidth: 2,
    borderColor: 'rgba(101, 53, 234, 0.25)',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    overflow: 'hidden',
  },
  mascotImg: {
    width: 50,
    height: 58,
    marginTop: 4,
  },
});
