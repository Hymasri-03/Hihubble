import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  PanResponder,
  ImageStyle,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

export interface CropAvatarModalProps {
  visible: boolean;
  imageUri: string | null;
  themeMode: ThemeMode;
  onClose: () => void;
  onCropDone: (croppedUri: string) => void;
}

const VIEWPORT_SIZE = 260;

export const CropAvatarModal = ({
  visible,
  imageUri,
  themeMode,
  onClose,
  onCropDone,
}: CropAvatarModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // References for gesture tracking
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = { x: panX, y: panY };
  const initialTouchDistance = useRef<number | null>(null);
  const initialTouchScale = useRef<number>(1);
  const lastPan = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (visible) {
      setScale(1);
      setRotation(0);
      setPanX(0);
      setPanY(0);
      lastPan.current = { x: 0, y: 0 };
    }
  }, [visible, imageUri]);

  // Touch gesture handler for on-screen pan and pinch-to-zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          initialTouchDistance.current = dist;
          initialTouchScale.current = scaleRef.current;
        } else {
          lastPan.current = { x: panRef.current.x, y: panRef.current.y };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          const currentDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          if (initialTouchDistance.current && initialTouchDistance.current > 0) {
            const factor = currentDist / initialTouchDistance.current;
            const newScale = Math.min(Math.max(initialTouchScale.current * factor, 0.5), 3.5);
            setScale(parseFloat(newScale.toFixed(2)));
          }
        } else {
          setPanX(lastPan.current.x + gestureState.dx);
          setPanY(lastPan.current.y + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        lastPan.current = { x: panRef.current.x, y: panRef.current.y };
        initialTouchDistance.current = null;
      },
      onPanResponderTerminate: () => {
        lastPan.current = { x: panRef.current.x, y: panRef.current.y };
        initialTouchDistance.current = null;
      },
    })
  ).current;

  // WhatsApp / Instagram style smooth Zoom In and Zoom Out
  const handleZoomIn = () => {
    setScale((prev) => Math.min(parseFloat((prev + 0.15).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(parseFloat((prev - 0.15).toFixed(2)), 0.6));
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    lastPan.current = { x: 0, y: 0 };
  };

  // Crop & Export
  const handleCropAndSave = () => {
    if (!imageUri) return;

    if (Platform.OS === 'web') {
      try {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const outputSize = 400;
          canvas.width = outputSize;
          canvas.height = outputSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, outputSize, outputSize);

            // Move to center of canvas
            ctx.translate(outputSize / 2, outputSize / 2);
            ctx.rotate((rotation * Math.PI) / 180);

            // Draw image with scale and pan adjustments
            const minDim = Math.min(img.width, img.height);
            const drawW = (img.width / minDim) * outputSize * scale;
            const drawH = (img.height / minDim) * outputSize * scale;
            const drawX = -drawW / 2 + (panX / VIEWPORT_SIZE) * outputSize;
            const drawY = -drawH / 2 + (panY / VIEWPORT_SIZE) * outputSize;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            onCropDone(croppedDataUrl);
          } else {
            onCropDone(imageUri);
          }
        };
        img.onerror = () => {
          onCropDone(imageUri);
        };
        img.src = imageUri;
        return;
      } catch (e) {
        console.log('Error cropping on web:', e);
        onCropDone(imageUri);
        return;
      }
    }

    // Native fallback
    onCropDone(imageUri);
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View
          style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          data-modal-card="true"
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.navBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.titleGroup}>
              <Feather name="sliders" size={17} color={BRAND_COLORS.purplePrimary} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Adjust Profile Photo</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              style={[styles.resetTopBtn, { backgroundColor: colors.statCardBg }]}
            >
              <Ionicons name="refresh" size={14} color={BRAND_COLORS.purplePrimary} />
              <Text style={styles.resetBtnLabel}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle instructions */}
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Drag the image with your finger to reposition. Zoom in/out or rotate below.
          </Text>

          {/* Crop Viewport with Direct Touch/Wheel Gestures (Clean circle, NO resizing grid) */}
          <View style={styles.cropAreaContainer}>
            <View
              {...panResponder.panHandlers}
              // @ts-ignore Web wheel support for smooth zooming
              onWheel={(e: any) => {
                if (e.deltaY < 0) {
                  setScale((prev) => Math.min(parseFloat((prev + 0.1).toFixed(2)), 3.5));
                } else {
                  setScale((prev) => Math.max(parseFloat((prev - 0.1).toFixed(2)), 0.5));
                }
              }}
              style={styles.viewport}
            >
              {/* Image with interactive transform */}
              <View
                style={[
                  styles.imageWrapper,
                  {
                    transform: [
                      { translateX: panX },
                      { translateY: panY },
                      { scale },
                      { rotate: `${rotation}deg` },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.sourceImage}
                  resizeMode="cover"
                />
              </View>

              {/* Clean Circular Mask Ring (No grid lines!) */}
              <View pointerEvents="none" style={styles.circleRingOverlay} />
            </View>
          </View>

          {/* WhatsApp / Instagram style smooth Zoom In and Zoom Out Bar */}
          <View style={[styles.zoomControlRow, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
            {/* Zoom Out Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomOut}
              style={[styles.zoomActionBtn, { borderColor: colors.border }]}
              accessibilityLabel="Zoom Out"
            >
              <Feather name="minus" size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Interactive Zoom Slider Track */}
            <View style={styles.sliderTrackContainer}>
              <View style={[styles.sliderTrackBg, { backgroundColor: '#E2DCF8' }]}>
                <View
                  style={[
                    styles.sliderTrackFill,
                    {
                      width: `${Math.min(Math.max(((scale - 0.6) / (3.5 - 0.6)) * 100, 5), 100)}%`,
                      backgroundColor: BRAND_COLORS.purplePrimary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Zoom In Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomIn}
              style={[styles.zoomActionBtn, { borderColor: colors.border }]}
              accessibilityLabel="Zoom In"
            >
              <Feather name="plus" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* "Save Profile Photo" Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCropAndSave}
            style={[styles.uploadBtnWrapper, { backgroundColor: BRAND_COLORS.purplePrimary }]}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadBtn}
            >
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.uploadBtnText}>Save Profile Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 28,
    borderWidth: 1,
    paddingBottom: 20,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 24,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  navBtn: {
    padding: 6,
  },
  resetTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resetBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_COLORS.purplePrimary,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  cropAreaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  viewport: {
    width: VIEWPORT_SIZE,
    height: VIEWPORT_SIZE,
    borderRadius: VIEWPORT_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3.5,
    borderColor: BRAND_COLORS.purplePrimary,
    backgroundColor: '#0F0E17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: VIEWPORT_SIZE,
    height: VIEWPORT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  circleRingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: VIEWPORT_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  zoomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: VIEWPORT_SIZE,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 14,
    marginBottom: 4,
    gap: 10,
  },
  zoomActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sliderTrackContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  sliderTrackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 3,
  },
  uploadBtnWrapper: {
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export { CropAvatarModal as AdjustProfileModal };
export default CropAvatarModal;
