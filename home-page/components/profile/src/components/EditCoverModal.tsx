import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  PanResponder,
  ImageStyle,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

export interface EditCoverModalProps {
  visible: boolean;
  themeMode: ThemeMode;
  currentCoverUrl?: string;
  onClose: () => void;
  onSelectCover: (url: string | undefined) => void;
}

const PRESET_COVERS = [
  {
    id: 'mountain_sky',
    name: 'Celestial Valley',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'aurora',
    name: 'Pastel Aurora',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'galaxy',
    name: 'Deep Galaxy',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'sunset',
    name: 'Celestial Sunset',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  },
];

const PREVIEW_WIDTH = 340;
const PREVIEW_HEIGHT = 150;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4.0;
const SLIDER_WIDTH = 150;

export const EditCoverModal = ({
  visible,
  themeMode,
  currentCoverUrl,
  onClose,
  onSelectCover,
}: EditCoverModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  // State: 'select' -> choose photo or preset; 'adjust' -> adjust position/zoom/framing
  const [step, setStep] = useState<'select' | 'adjust'>('select');
  const [candidateUri, setCandidateUri] = useState<string | null>(null);

  // Adjustment parameters
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fill');

  // Natural image dimensions to preserve aspect ratio and avoid cutting edges
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 340,
  });

  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = { x: panX, y: panY };
  const initialTouchDistance = useRef<number | null>(null);
  const initialTouchScale = useRef<number>(1);
  const lastPan = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef<number>(0);
  const fitScaleRef = useRef<number>(1);
  const previewRef = useRef<any>(null);

  // Compute base dimensions preserving natural aspect ratio
  const imgAspect = naturalSize.width > 0 && naturalSize.height > 0
    ? naturalSize.width / naturalSize.height
    : 800 / 340;
  const bannerAspect = PREVIEW_WIDTH / PREVIEW_HEIGHT;

  let displayW = PREVIEW_WIDTH;
  let displayH = PREVIEW_HEIGHT;
  if (imgAspect >= bannerAspect) {
    displayW = PREVIEW_HEIGHT * imgAspect;
    displayH = PREVIEW_HEIGHT;
  } else {
    displayW = PREVIEW_WIDTH;
    displayH = PREVIEW_WIDTH / imgAspect;
  }

  // Load natural dimensions & calculate fitScale
  useEffect(() => {
    if (!candidateUri) return;
    setPanX(0);
    setPanY(0);
    setRotation(0);
    lastPan.current = { x: 0, y: 0 };

    const applyCalculatedDimensions = (w: number, h: number) => {
      const validW = w > 0 ? w : 800;
      const validH = h > 0 ? h : 340;
      setNaturalSize({ width: validW, height: validH });

      const imageRatio = validW / validH;
      const targetRatio = PREVIEW_WIDTH / PREVIEW_HEIGHT;

      let wholeFitScale = 1;
      if (imageRatio >= targetRatio) {
        wholeFitScale = parseFloat((targetRatio / imageRatio).toFixed(2));
      } else {
        wholeFitScale = parseFloat((imageRatio / targetRatio).toFixed(2));
      }

      fitScaleRef.current = Math.min(1.0, Math.max(wholeFitScale, 0.4));
      setScale(1);
      setFitMode('fill');
    };

    if (Platform.OS === 'web') {
      try {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          applyCalculatedDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height);
        };
        img.onerror = () => {
          applyCalculatedDimensions(800, 340);
        };
        img.src = candidateUri;
      } catch {
        applyCalculatedDimensions(800, 340);
      }
    } else {
      Image.getSize(
        candidateUri,
        (w, h) => applyCalculatedDimensions(w, h),
        () => applyCalculatedDimensions(800, 340)
      );
    }
  }, [candidateUri]);

  // Web multi-touch pinch gesture listener (passive: false to prevent browser zoom)
  useEffect(() => {
    if (Platform.OS !== 'web' || step !== 'adjust' || !visible) return;

    const el = previewRef.current;
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
  }, [step, visible, candidateUri]);

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

        // Double tap with fingers to toggle zoom
        if (Math.hypot(gestureState.dx, gestureState.dy) < 8) {
          const now = Date.now();
          if (now - lastTapTime.current < 320) {
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

  // Horizontal Zoom Slider PanResponder for native touch drag
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

  // Zoom In / Zoom Out step controls with NaN protection
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

  // Preset Framing Handlers
  const handleFitWholeBanner = () => {
    setFitMode('fit');
    setPanX(0);
    setPanY(0);
    lastPan.current = { x: 0, y: 0 };
    setScale(fitScaleRef.current);
  };

  const handleFillBanner = () => {
    setFitMode('fill');
    setPanX(0);
    setPanY(0);
    lastPan.current = { x: 0, y: 0 };
    setScale(1);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetAdjust = () => {
    handleFillBanner();
    setRotation(0);
  };

  useEffect(() => {
    if (visible) {
      setStep('select');
      setCandidateUri(null);
      setScale(1);
      setRotation(0);
      setPanY(0);
      setPanX(0);
      lastPan.current = { x: 0, y: 0 };
    }
  }, [visible]);

  // Step 1: Select photo from gallery -> Enter "Adjust" mode
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow access to your photos to choose a cover image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Direct pick to our custom Adjust screen
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCandidateUri(result.assets[0].uri);
        setScale(1);
        setRotation(0);
        setPanY(0);
        setPanX(0);
        setStep('adjust');
      }
    } catch (error) {
      console.log('Error choosing image:', error);
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  // Step 1b: Select from presets -> Enter "Adjust" mode
  const handleSelectPreset = (url: string) => {
    setCandidateUri(url);
    setScale(1);
    setRotation(0);
    setPanY(0);
    setPanX(0);
    setStep('adjust');
  };

  // Adjust Current Cover if already set
  const handleAdjustCurrent = () => {
    if (currentCoverUrl) {
      setCandidateUri(currentCoverUrl);
      setScale(1);
      setRotation(0);
      setPanY(0);
      setPanX(0);
      setStep('adjust');
    }
  };

  // Step 2: Upload and apply to profile with canvas rendering on web
  const handleUploadCover = () => {
    if (!candidateUri) return;

    if (Platform.OS === 'web' && (scale !== 1 || panX !== 0 || panY !== 0 || rotation !== 0)) {
      try {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const outputW = 800;
          const outputH = 340;
          canvas.width = outputW;
          canvas.height = outputH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, outputW, outputH);
            ctx.translate(outputW / 2, outputH / 2);
            ctx.rotate((rotation * Math.PI) / 180);

            const scaleFactor = outputW / PREVIEW_WIDTH;
            const drawW = displayW * scaleFactor * scale;
            const drawH = displayH * scaleFactor * scale;
            const drawX = -drawW / 2 + panX * scaleFactor;
            const drawY = -drawH / 2 + panY * scaleFactor;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
            onSelectCover(croppedDataUrl);
            onClose();
          } else {
            onSelectCover(candidateUri);
            onClose();
          }
        };
        img.onerror = () => {
          onSelectCover(candidateUri);
          onClose();
        };
        img.src = candidateUri;
        return;
      } catch {
        onSelectCover(candidateUri);
        onClose();
        return;
      }
    }

    onSelectCover(candidateUri);
    onClose();
  };

  // Reset to default cosmic gradient
  const handleResetToGradient = () => {
    onSelectCover(undefined);
    onClose();
  };

  const sliderPercentage = Math.min(
    Math.max(((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100, 2),
    100
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay} data-modal-overlay="true">
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

          {/* Popup Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            {step === 'adjust' ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setStep('select')}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.headerTitleGroup}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {step === 'adjust' ? 'Adjust Banner / Cover' : 'Edit Cover Image'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {step === 'adjust' && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleResetAdjust}
                  style={[styles.resetTopBtn, { backgroundColor: colors.statCardBg }]}
                  accessibilityLabel="Reset zoom and framing"
                >
                  <Ionicons name="refresh" size={13} color={BRAND_COLORS.purplePrimary} />
                  <Text style={styles.resetBtnLabel}>Reset</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* STEP 1: Select Image / Presets */}
          {step === 'select' ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Primary Action Card: Pick Image to Adjust & Upload */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickFromGallery}
                style={[
                  styles.uploadCard,
                  {
                    backgroundColor: themeMode === 'light' ? '#F4F0FD' : '#1C1635',
                    borderColor: BRAND_COLORS.purpleLight,
                  },
                ]}
              >
                <View style={styles.uploadIconCircle}>
                  <Feather name="upload" size={22} color="#FFFFFF" />
                </View>
                <Text style={[styles.uploadTitle, { color: colors.textPrimary }]}>
                  Upload from Gallery
                </Text>
                <Text style={[styles.uploadSubtitle, { color: colors.textMuted }]}>
                  Choose a photo to upload. You can adjust zoom and framing inside!
                </Text>
                <View style={styles.adjustPillBadge}>
                  <Feather name="sliders" size={12} color={BRAND_COLORS.purplePrimary} />
                  <Text style={styles.adjustPillText}>Adjust Framing & Zoom After Upload</Text>
                </View>
              </TouchableOpacity>

              {/* Adjust Current Cover option if one already exists */}
              {currentCoverUrl && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAdjustCurrent}
                  style={[styles.adjustCurrentBtn, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}
                >
                  <Feather name="sliders" size={15} color={BRAND_COLORS.purplePrimary} />
                  <Text style={[styles.adjustCurrentText, { color: colors.textPrimary }]}>
                    Adjust Current Cover Framing
                  </Text>
                </TouchableOpacity>
              )}

              {/* Cosmic Wallpapers Section */}
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Or choose a Cosmic Landscape:
              </Text>

              <View style={styles.presetsGrid}>
                {PRESET_COVERS.map((preset) => {
                  const isSelected = currentCoverUrl === preset.url;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectPreset(preset.url)}
                      style={[
                        styles.presetItem,
                        isSelected && { borderColor: BRAND_COLORS.purplePrimary, borderWidth: 2.5 },
                      ]}
                    >
                      <Image source={{ uri: preset.url }} style={styles.presetImage} />
                      <View style={styles.presetLabelOverlay}>
                        <Text style={styles.presetLabelText} numberOfLines={1}>
                          {preset.name}
                        </Text>
                      </View>
                      <View style={styles.presetAdjustTag}>
                        <Text style={styles.presetAdjustTagText}>Tap to Adjust</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Revert to Cosmic Gradient */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetToGradient}
                style={[styles.resetBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="color-palette-outline" size={16} color={colors.textMuted} />
                <Text style={[styles.resetBtnText, { color: colors.textMuted }]}>
                  Use Default Cosmic Gradient
                </Text>
              </TouchableOpacity>

              {/* Prominent Upload Button at Bottom */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickFromGallery}
                style={[styles.confirmUploadBtnWrapper, { backgroundColor: BRAND_COLORS.purplePrimary, marginTop: 14 }]}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.confirmUploadBtn, { backgroundColor: BRAND_COLORS.purplePrimary }]}
                >
                  <Feather name="upload" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmUploadBtnText}>Upload</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* STEP 2: Adjust Image (Pan, Zoom, Framing) -> THEN Upload */
            <View style={styles.adjustContainer}>
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.adjustScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Preset Framing Mode Selectors: "Fit Whole Banner" vs "Fill Banner" */}
                <View style={styles.presetModeRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleFitWholeBanner}
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
                      Fit Whole Banner
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleFillBanner}
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
                      Fill Banner
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
                    Pinch with 2 fingers to zoom • Drag to move banner
                  </Text>
                </View>

                {/* Live Banner Preview Box with Direct Hand Dragging */}
                <View style={[styles.previewFrameWrapper, { borderColor: BRAND_COLORS.purplePrimary }]}>
                  <View
                    ref={previewRef}
                    {...panResponder.panHandlers}
                    // @ts-ignore
                    onWheel={(e: any) => {
                      if (e.deltaY < 0) {
                        setScale((prev) => Math.min(parseFloat((prev + 0.1).toFixed(2)), MAX_SCALE));
                      } else {
                        setScale((prev) => Math.max(parseFloat((prev - 0.1).toFixed(2)), MIN_SCALE));
                      }
                    }}
                    style={styles.previewCanvas}
                  >
                    {candidateUri ? (
                      <View
                        style={{
                          width: displayW,
                          height: displayH,
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: [
                            { scale },
                            { translateX: panX },
                            { translateY: panY },
                            { rotate: `${rotation}deg` },
                          ],
                        }}
                      >
                        <Image
                          source={{ uri: candidateUri }}
                          style={{ width: displayW, height: displayH }}
                          resizeMode="contain"
                        />
                      </View>
                    ) : null}

                    {/* Live Zoom Percentage Badge */}
                    <View style={styles.liveZoomBadge}>
                      <Text style={styles.liveZoomText}>{Math.round(scale * 100)}%</Text>
                    </View>
                  </View>
                </View>

                {/* Horizontal Zoom in and Zoom out Controls like in Profile */}
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

                  {/* Interactive Horizontal Zoom Slider Track with Thumb Handle */}
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

                {/* Pan Position Nudge Controls */}
                <View style={styles.adjustSectionBlock}>
                  <View style={styles.adjustLabelRow}>
                    <Text style={[styles.adjustLabel, { color: colors.textPrimary }]}>
                      Fine-tune Position
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setPanY(0);
                        setPanX(0);
                        setScale(1);
                        setRotation(0);
                        lastPan.current = { x: 0, y: 0 };
                      }}
                    >
                      <Text style={styles.resetNudgeText}>Reset Position</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.nudgeButtonsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setPanY((prev) => prev - 15);
                        lastPan.current.y -= 15;
                      }}
                      style={[styles.nudgeBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
                    >
                      <Feather name="arrow-up" size={16} color={colors.textPrimary} />
                      <Text style={[styles.nudgeBtnLabel, { color: colors.textPrimary }]}>Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setPanY((prev) => prev + 15);
                        lastPan.current.y += 15;
                      }}
                      style={[styles.nudgeBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
                    >
                      <Feather name="arrow-down" size={16} color={colors.textPrimary} />
                      <Text style={[styles.nudgeBtnLabel, { color: colors.textPrimary }]}>Down</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setPanX((prev: number) => prev - 15);
                        lastPan.current.x -= 15;
                      }}
                      style={[styles.nudgeBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
                    >
                      <Feather name="arrow-left" size={16} color={colors.textPrimary} />
                      <Text style={[styles.nudgeBtnLabel, { color: colors.textPrimary }]}>Left</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setPanX((prev: number) => prev + 15);
                        lastPan.current.x += 15;
                      }}
                      style={[styles.nudgeBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
                    >
                      <Feather name="arrow-right" size={16} color={colors.textPrimary} />
                      <Text style={[styles.nudgeBtnLabel, { color: colors.textPrimary }]}>Right</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              {/* ACTION: UPLOAD - FIXED STICKY AT BOTTOM, ALWAYS VISIBLE */}
              <View style={[styles.fixedBottomFooter, { borderTopColor: colors.border, backgroundColor: colors.cardBg }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleUploadCover}
                  style={styles.fixedUploadBtnWrapper}
                >
                  <LinearGradient
                    colors={['#6535EA', '#8B5CF6', '#FF3B8A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fixedUploadBtn}
                  >
                    <Feather name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.fixedUploadBtnText}>Save & Set Banner</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 26,
    borderWidth: 1,
    paddingBottom: 16,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 24,
  },
  logoAccentBar: {
    width: '100%',
    height: 4.5,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  presetModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
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
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 6,
    alignSelf: 'center',
  },
  gestureHandIcon: {
    fontSize: 12,
  },
  gestureHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  uploadCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  adjustPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  adjustPillText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  adjustCurrentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  adjustCurrentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  presetItem: {
    width: '48%',
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetLabelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  presetLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetAdjustTag: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  presetAdjustTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 14,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewFrameWrapper: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    backgroundColor: '#0F0E17',
    marginBottom: 12,
  },
  previewCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveZoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
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
  adjustSectionBlock: {
    marginBottom: 12,
  },
  adjustLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adjustLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  resetNudgeText: {
    fontSize: 11.5,
    color: BRAND_COLORS.purplePrimary,
    fontWeight: '700',
  },
  nudgeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nudgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  nudgeBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  zoomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
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
    flex: 1,
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 4,
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
  adjustContainer: {
    maxHeight: 520,
    width: '100%',
  },
  adjustScrollContent: {
    paddingBottom: 16,
  },
  fixedBottomFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    width: '100%',
  },
  fixedUploadBtnWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  fixedUploadBtn: {
    width: '100%',
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fixedUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  confirmUploadBtnWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: BRAND_COLORS.purplePrimary,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    backgroundColor: BRAND_COLORS.purplePrimary,
  },
  confirmUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default EditCoverModal;
