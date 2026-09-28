import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { UserProfile, ThemeMode } from '../types/profile';

export interface ProfilePhotoViewModalProps {
  visible: boolean;
  user: UserProfile;
  themeMode: ThemeMode;
  onClose: () => void;
  onChangePhoto?: () => void;
}

export const ProfilePhotoViewModal: React.FC<ProfilePhotoViewModalProps> = ({
  visible,
  user,
  themeMode,
  onClose,
  onChangePhoto,
}) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const [viewShape, setViewShape] = useState<'circle' | 'full'>('circle');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const zoomScaleRef = useRef(1);
  zoomScaleRef.current = zoomScale;

  const initialTouchDistance = useRef<number | null>(null);
  const initialTouchScale = useRef<number>(1);
  const lastTapTime = useRef<number>(0);

  // Reset zoom on close/open
  React.useEffect(() => {
    if (visible) {
      setZoomScale(1);
      setViewShape('circle');
    }
  }, [visible]);

  // Touch gesture PanResponder for pinch-to-zoom with hands and double-tap
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          initialTouchDistance.current = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          initialTouchScale.current = zoomScaleRef.current;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2 && initialTouchDistance.current) {
          const t1 = touches[0];
          const t2 = touches[1];
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          const factor = dist / initialTouchDistance.current;
          const newScale = Math.min(Math.max(initialTouchScale.current * factor, 0.75), 3.5);
          setZoomScale(parseFloat(newScale.toFixed(2)));
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        initialTouchDistance.current = null;
        // Double tap with fingers
        if (Math.hypot(gestureState.dx, gestureState.dy) < 6) {
          const now = Date.now();
          if (now - lastTapTime.current < 320) {
            setZoomScale((prev) => (prev > 1.2 ? 1 : 2.0));
            lastTapTime.current = 0;
          } else {
            lastTapTime.current = now;
          }
        }
      },
      onPanResponderTerminate: () => {
        initialTouchDistance.current = null;
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        {/* Backdrop touch area to dismiss */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdropDismiss}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            },
          ]}
          data-modal-card="true"
        >
          {/* Logo Design Gradient Accent Bar */}
          <LinearGradient
            colors={['#6535EA', '#8B5CF6', '#FF3B8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoAccentBar}
          />

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Profile Photo
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
              accessibilityLabel="Close profile preview"
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Toggle view mode: Circle vs Full Photo */}
          <View style={styles.viewModeRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setViewShape('circle')}
              style={[
                styles.viewModePill,
                viewShape === 'circle'
                  ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                  : { backgroundColor: colors.statCardBg, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="ellipse-outline"
                size={13}
                color={viewShape === 'circle' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewModeText,
                  { color: viewShape === 'circle' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Circle Avatar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setViewShape('full')}
              style={[
                styles.viewModePill,
                viewShape === 'full'
                  ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                  : { backgroundColor: colors.statCardBg, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="image-size-select-actual"
                size={13}
                color={viewShape === 'full' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewModeText,
                  { color: viewShape === 'full' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Full Photo (All Edges)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Large Photo Display with Hands Zoom & Double-Tap */}
          <View style={styles.photoContainer}>
            <View
              {...panResponder.panHandlers}
              // @ts-ignore Web wheel zoom
              onWheel={(e: any) => {
                if (e.deltaY < 0) {
                  setZoomScale((prev) => Math.min(parseFloat((prev + 0.15).toFixed(2)), 3.5));
                } else {
                  setZoomScale((prev) => Math.max(parseFloat((prev - 0.15).toFixed(2)), 0.75));
                }
              }}
              style={[
                styles.photoFrame,
                {
                  borderRadius: viewShape === 'circle' ? PHOTO_SIZE / 2 : 20,
                  backgroundColor: themeMode === 'dark' ? '#0F0E17' : '#F5F2FC',
                  borderColor: BRAND_COLORS.purplePrimary,
                },
              ]}
            >
              <View
                style={[
                  styles.imageTransformWrapper,
                  {
                    transform: [{ scale: zoomScale }],
                  },
                ]}
              >
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.largeAvatar}
                  resizeMode={viewShape === 'full' ? 'contain' : 'cover'}
                />
              </View>

              {zoomScale !== 1 && (
                <View style={styles.zoomBadge}>
                  <Text style={styles.zoomBadgeText}>{Math.round(zoomScale * 100)}%</Text>
                </View>
              )}
            </View>

            <Text style={[styles.gestureTipText, { color: colors.textMuted }]}>
              ✋ Pinch to zoom • Double-tap to expand
            </Text>
          </View>

          {/* User Info Row */}
          <View style={styles.userInfoRow}>
            <View style={styles.nameBadgeRow}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {user.name}
              </Text>
              {user.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color={BRAND_COLORS.purplePrimary}
                />
              )}
            </View>

            <Text style={[styles.userHandle, { color: colors.textMuted }]}>
              {user.handle}
            </Text>

            {user.roleBadge ? (
              <View style={[styles.roleBadge, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
                <Text style={[styles.roleBadgeText, { color: colors.badgeText }]}>
                  {user.roleBadge}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Footer Actions */}
          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            {onChangePhoto && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  onChangePhoto();
                }}
                style={styles.changePhotoBtnWrapper}
              >
                <LinearGradient
                  colors={['#6535EA', '#8B5CF6', '#FF3B8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.changePhotoBtn}
                >
                  <Feather name="camera" size={15} color="#FFFFFF" />
                  <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.dismissBtn, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}
            >
              <Text style={[styles.dismissBtnText, { color: colors.textSecondary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 380);
const PHOTO_SIZE = CARD_WIDTH - 56;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 24,
    zIndex: 10,
  },
  logoAccentBar: {
    width: '100%',
    height: 4.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  viewModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewModeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  photoFrame: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderWidth: 3.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    position: 'relative',
  },
  imageTransformWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatar: {
    width: '100%',
    height: '100%',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(10, 8, 20, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  zoomBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  gestureTipText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  userInfoRow: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  userHandle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  changePhotoBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProfilePhotoViewModal;
