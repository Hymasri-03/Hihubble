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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
const MIN_SCALE = 0.25;
const MAX_SCALE = 4.0;
const SLIDER_WIDTH = 140;

export const CropAvatarModal = ({
  visible,
  imageUri,
  themeMode,
  onClose,
  onCropDone,
}: CropAvatarModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  // Transform states
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fit');

  // Natural image dimensions to preserve aspect ratio and avoid cutting edges
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: VIEWPORT_SIZE,
    height: VIEWPORT_SIZE,
  });

  // References for gesture tracking
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = { x: panX, y: panY };
  const initialTouchDistance = useRef<number | null>(null);
  const initialTouchScale = useRef<number>(1);
  const lastPan = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef<number>(0);
  const fitScaleRef = useRef<number>(0.85);
  const viewportRef = useRef<any>(null);

  // Compute base dimensions preserving natural aspect ratio
  const aspect = naturalSize.width > 0 && naturalSize.height > 0
    ? naturalSize.width / naturalSize.height
    : 1;

  let displayW = VIEWPORT_SIZE;
  let displayH = VIEWPORT_SIZE;
  if (aspect >= 1) {
    // Landscape: full width, proportional height
    displayW = VIEWPORT_SIZE;
    displayH = VIEWPORT_SIZE / aspect;
  } else {
    // Portrait: full height, proportional width
    displayH = VIEWPORT_SIZE;
    displayW = VIEWPORT_SIZE * aspect;
  }

  // Load natural image dimensions and calculate fit scale so edges are NOT cut off
  useEffect(() => {
    if (!imageUri || !visible) return;

    setPanX(0);
    setPanY(0);
    setRotation(0);
    lastPan.current = { x: 0, y: 0 };

    const applyCalculatedDimensions = (w: number, h: number) => {
      const validW = w > 0 ? w : VIEWPORT_SIZE;
      const validH = h > 0 ? h : VIEWPORT_SIZE;
      setNaturalSize({ width: validW, height: validH });

      const imgAspect = validW / validH;
      let bW = VIEWPORT_SIZE;
      let bH = VIEWPORT_SIZE;
      if (imgAspect >= 1) {
        bH = VIEWPORT_SIZE / imgAspect;
      } else {
        bW = VIEWPORT_SIZE * imgAspect;
      }

      // In a circle of diameter VIEWPORT_SIZE, diagonal of rectangle determines fit inside circle
      const diag = Math.hypot(bW, bH);
      const circleFitScale = parseFloat((VIEWPORT_SIZE / diag).toFixed(2));
      // By default fit whole image so absolutely NO edges are cut off
      const defaultFitScale = Math.min(1.0, Math.max(circleFitScale, 0.72));
      fitScaleRef.current = defaultFitScale;
      setScale(defaultFitScale);
      setFitMode('fit');
    };

    if (Platform.OS === 'web') {
      try {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          applyCalculatedDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height);
        };
        img.onerror = () => {
          applyCalculatedDimensions(VIEWPORT_SIZE, VIEWPORT_SIZE);
        };
        img.src = imageUri;
      } catch {
        applyCalculatedDimensions(VIEWPORT_SIZE, VIEWPORT_SIZE);
      }
    } else {
      Image.getSize(
        imageUri,
        (w, h) => applyCalculatedDimensions(w, h),
        () => applyCalculatedDimensions(VIEWPORT_SIZE, VIEWPORT_SIZE)
      );
    }
  }, [visible, imageUri]);

  // Web multi-touch pinch gesture listener (passive: false to prevent browser zoom)
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const el = viewportRef.current;
    if (!el) return;

    let touchStartDist: number | null = null;
    let touchStartScale = 1;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchStartScale = scaleRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist && touchStartDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const factor = currentDist / touchStartDist;
        const newScale = Math.min(Math.max(touchStartScale * factor, MIN_SCALE), MAX_SCALE);
        setScale(parseFloat(newScale.toFixed(2)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStartDist = null;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [visible, imageUri]);

  // Touch gesture PanResponder for native and web gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          initialTouchDistance.current = dist;
          initialTouchScale.current = scaleRef.current;
        } else {
          lastPan.current = { x: panRef.current.x, y: panRef.current.y };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const t1 = touches[0];
          const t2 = touches[1];
          const currentDist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          if (initialTouchDistance.current && initialTouchDistance.current > 0) {
            const factor = currentDist / initialTouchDistance.current;
            const newScale = Math.min(Math.max(initialTouchScale.current * factor, MIN_SCALE), MAX_SCALE);
            setScale(parseFloat(newScale.toFixed(2)));
          }
        } else if (!touches || touches.length <= 1) {
          setPanX(lastPan.current.x + gestureState.dx);
          setPanY(lastPan.current.y + gestureState.dy);
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        lastPan.current = { x: panRef.current.x, y: panRef.current.y };
        initialTouchDistance.current = null;

        // Double tap detection with fingers to toggle zoom
        if (Math.hypot(gestureState.dx, gestureState.dy) < 8) {
          const now = Date.now();
          if (now - lastTapTime.current < 320) {
            // Double tap toggles between fitted whole photo and 1.8x zoom
            setScale((prev) => (prev > 1.2 ? fitScaleRef.current : 1.8));
            lastTapTime.current = 0;
          } else {
            lastTapTime.current = now;
          }
        }
      },
      onPanResponderTerminate: () => {
        lastPan.current = { x: panRef.current.x, y: panRef.current.y };
        initialTouchDistance.current = null;
      },
    })
  ).current;

  // Slider touch responder for dragging with hands/fingers
  const updateScaleFromSliderX = (locationX: number) => {
    if (locationX === undefined || isNaN(locationX)) return;
    const clampedX = Math.min(Math.max(locationX, 0), SLIDER_WIDTH);
    const ratio = clampedX / SLIDER_WIDTH;
    const newScale = MIN_SCALE + ratio * (MAX_SCALE - MIN_SCALE);
    if (!isNaN(newScale) && isFinite(newScale)) {
      setScale(parseFloat(newScale.toFixed(2)));
    }
  };

  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent?.locationX !== undefined) {
          updateScaleFromSliderX(evt.nativeEvent.locationX);
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent?.locationX !== undefined) {
          updateScaleFromSliderX(evt.nativeEvent.locationX);
        }
      },
    })
  ).current;

  // Zoom In / Zoom Out step controls
  const handleZoomIn = () => {
    setScale((prev) => {
      const current = !isNaN(prev) && isFinite(prev) && prev > 0 ? prev : 1;
      return Math.min(parseFloat((current + 0.15).toFixed(2)), MAX_SCALE);
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const current = !isNaN(prev) && isFinite(prev) && prev > 0 ? prev : 1;
      return Math.max(parseFloat((current - 0.15).toFixed(2)), MIN_SCALE);
    });
  };

  // Quick preset: Fit entire photo (edges NOT cut off)
  const handleFitWholePhoto = () => {
    setFitMode('fit');
    setPanX(0);
    setPanY(0);
    lastPan.current = { x: 0, y: 0 };
    const diag = Math.hypot(displayW, displayH);
    const circleFitScale = parseFloat((VIEWPORT_SIZE / diag).toFixed(2));
    const targetScale = Math.min(1.0, Math.max(circleFitScale, 0.65));
    setScale(targetScale);
    fitScaleRef.current = targetScale;
  };

  // Quick preset: Fill circle (crop outer margins to fill full circle)
  const handleFillCircle = () => {
    setFitMode('fill');
    setPanX(0);
    setPanY(0);
    lastPan.current = { x: 0, y: 0 };
    const fillScale = parseFloat(Math.max(VIEWPORT_SIZE / displayW, VIEWPORT_SIZE / displayH).toFixed(2));
    setScale(fillScale);
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset to default
  const handleReset = () => {
    handleFitWholePhoto();
    setRotation(0);
  };

  // Crop & Export to Avatar Canvas with pixel-perfect viewport transform
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

            // Exact 1:1 scale factor from viewport (VIEWPORT_SIZE) to output canvas (outputSize)
            const scaleFactor = outputSize / VIEWPORT_SIZE;
            const drawW = displayW * scaleFactor * scale;
            const drawH = displayH * scaleFactor * scale;
            const drawX = -drawW / 2 + panX * scaleFactor;
            const drawY = -drawH / 2 + panY * scaleFactor;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
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

  // Percentage for slider track fill
  const sliderPercentage = Math.min(
    Math.max(((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100, 2),
    100
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View
          style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
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
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.navBtn}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.titleGroup}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Adjust Profile Photo
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              style={[styles.resetTopBtn, { backgroundColor: colors.statCardBg }]}
              accessibilityLabel="Reset position and zoom"
            >
              <Ionicons name="refresh" size={13} color={BRAND_COLORS.purplePrimary} />
              <Text style={styles.resetBtnLabel}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Framing Mode Selectors: "Fit Whole Photo" vs "Fill Circle" */}
          <View style={styles.presetModeRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFitWholePhoto}
              style={[
                styles.modePillBtn,
                fitMode === 'fit'
                  ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                  : { backgroundColor: colors.statCardBg, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="fit-to-screen-outline"
                size={14}
                color={fitMode === 'fit' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modePillText,
                  { color: fitMode === 'fit' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Fit Whole Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleFillCircle}
              style={[
                styles.modePillBtn,
                fitMode === 'fill'
                  ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                  : { backgroundColor: colors.statCardBg, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="crop"
                size={14}
                color={fitMode === 'fill' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modePillText,
                  { color: fitMode === 'fill' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Fill Circle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRotate}
              style={[styles.modePillBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
              accessibilityLabel="Rotate 90 degrees"
            >
              <MaterialCommunityIcons
                name="rotate-right"
                size={15}
                color={BRAND_COLORS.purplePrimary}
              />
              <Text style={[styles.modePillText, { color: colors.textSecondary }]}>
                {rotation !== 0 ? `${rotation}°` : 'Rotate'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Touch Gesture Instruction Pill */}
          <View style={[styles.gesturePill, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
            <Text style={styles.gestureHandIcon}>✋</Text>
            <Text style={[styles.gestureHintText, { color: colors.textSecondary }]}>
              Pinch with 2 fingers to zoom • Drag to move photo
            </Text>
          </View>

          {/* Crop Viewport with Direct Hand Pinch & Drag Gestures */}
          <View style={styles.cropAreaContainer}>
            <View
              ref={viewportRef}
              {...panResponder.panHandlers}
              // @ts-ignore Web wheel support for smooth trackpad / mouse zooming
              onWheel={(e: any) => {
                if (e.deltaY < 0) {
                  setScale((prev) => Math.min(parseFloat((prev + 0.1).toFixed(2)), MAX_SCALE));
                } else {
                  setScale((prev) => Math.max(parseFloat((prev - 0.1).toFixed(2)), MIN_SCALE));
                }
              }}
              style={styles.viewport}
            >
              {/* Image with interactive transform maintaining natural aspect ratio */}
              <View
                style={[
                  styles.imageWrapper,
                  {
                    width: displayW,
                    height: displayH,
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
                  style={{ width: displayW, height: displayH }}
                  resizeMode="contain"
                />
              </View>

              {/* Clean Circular Mask Ring */}
              <View pointerEvents="none" style={styles.circleRingOverlay} />

              {/* Live Zoom Percentage Badge */}
              <View style={styles.liveZoomBadge}>
                <Text style={styles.liveZoomText}>{Math.round(scale * 100)}%</Text>
              </View>
            </View>
          </View>

          {/* Interactive Zoom Control Bar (Hands drag slider, +/- buttons) */}
          <View
            style={[
              styles.zoomControlRow,
              { backgroundColor: colors.statCardBg, borderColor: colors.border },
            ]}
          >
            {/* Zoom Out Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomOut}
              style={[styles.zoomActionBtn, { borderColor: colors.border }]}
              accessibilityLabel="Zoom Out"
            >
              <Feather name="minus" size={16} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Interactive Zoom Slider Track with Finger Touch & Drag */}
            <View
              style={styles.sliderTrackContainer}
              {...(Platform.OS !== 'web' ? sliderPanResponder.panHandlers : {})}
            >
              <View style={[styles.sliderTrackBg, { backgroundColor: '#DDD6FE' }]}>
                <LinearGradient
                  colors={['#6535EA', '#8B5CF6', '#FF3B8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.sliderTrackFill,
                    {
                      width: `${sliderPercentage}%`,
                    },
                  ]}
                />
              </View>

              {/* Slider Thumb Handle */}
              <View
                pointerEvents="none"
                style={[
                  styles.sliderThumb,
                  {
                    left: `${sliderPercentage}%`,
                  },
                ]}
              />

              {Platform.OS === 'web' && (
                <input
                  type="range"
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step={0.02}
                  value={scale}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && isFinite(val)) setScale(val);
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
              )}
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
            style={styles.uploadBtnWrapper}
          >
            <LinearGradient
              colors={['#6535EA', '#8B5CF6', '#FF3B8A']}
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
    backgroundColor: 'rgba(5, 3, 15, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 395,
    borderRadius: 26,
    borderWidth: 1,
    paddingBottom: 18,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },
  logoAccentBar: {
    width: '100%',
    height: 4.5,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  navBtn: {
    padding: 6,
  },
  resetTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  resetBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_COLORS.purplePrimary,
  },
  presetModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  modePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gesturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
  },
  gestureHandIcon: {
    fontSize: 12,
  },
  gestureHintText: {
    fontSize: 11,
    fontWeight: '600',
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
    backgroundColor: '#0A0814',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: VIEWPORT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  liveZoomBadge: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(10, 8, 20, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  liveZoomText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  zoomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: VIEWPORT_SIZE + 20,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 12,
    marginBottom: 4,
    gap: 8,
  },
  zoomActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderTrackContainer: {
    width: SLIDER_WIDTH,
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBg: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: BRAND_COLORS.purplePrimary,
  },
  uploadBtnWrapper: {
    width: '88%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 14,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});

export { CropAvatarModal as AdjustProfileModal };
export default CropAvatarModal;
