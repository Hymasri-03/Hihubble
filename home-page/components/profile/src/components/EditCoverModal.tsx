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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
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

export const EditCoverModal = ({
  visible,
  themeMode,
  currentCoverUrl,
  onClose,
  onSelectCover,
}: EditCoverModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  // State: 'select' -> user chooses photo or preset; 'adjust' -> user adjusts position/zoom before upload
  const [step, setStep] = useState<'select' | 'adjust'>('select');
  const [candidateUri, setCandidateUri] = useState<string | null>(null);

  // Adjustment parameters
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const scaleRef = useRef(1);
  scaleRef.current = scale;
  const panRef = useRef({ x: 0, y: 0 });
  panRef.current = { x: panX, y: panY };
  const initialTouchDistance = useRef<number | null>(null);
  const initialTouchScale = useRef<number>(1);
  const lastPan = useRef({ x: 0, y: 0 });

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
            const newScale = Math.min(Math.max(initialTouchScale.current * factor, 0.6), 3.5);
            setScale(parseFloat(newScale.toFixed(2)));
          }
        } else {
          setPanX(lastPan.current.x + gestureState.dx);
          setPanY(lastPan.current.y + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        lastPan.current = {
          x: panRef.current.x,
          y: panRef.current.y,
        };
        initialTouchDistance.current = null;
      },
      onPanResponderTerminate: () => {
        lastPan.current = {
          x: panRef.current.x,
          y: panRef.current.y,
        };
        initialTouchDistance.current = null;
      },
    })
  ).current;

  // WhatsApp / Instagram style smooth Zoom In and Zoom Out for Cover Image
  const handleZoomIn = () => {
    setScale((prev) => Math.min(parseFloat((prev + 0.15).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(parseFloat((prev - 0.15).toFixed(2)), 0.6));
  };

  useEffect(() => {
    if (visible) {
      setStep('select');
      setCandidateUri(null);
      setScale(1);
      setPanY(0);
      setPanX(0);
      lastPan.current = { x: 0, y: 0 };
    }
  }, [visible]);

  // Step 1: Select photo from gallery -> Enter "Adjust" mode (NOT uploaded directly)
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
        setPanY(0);
        setPanX(0);
        setStep('adjust'); // Transition to Adjust step!
      }
    } catch (error) {
      console.log('Error choosing image:', error);
      Alert.alert('Error', 'Unable to open image gallery.');
    }
  };

  // Step 1b: Select from presets -> Enter "Adjust" mode
  const handleSelectPreset = (url: string) => {
    setCandidateUri(url);
    setScale(1);
    setPanY(0);
    setPanX(0);
    setStep('adjust'); // Transition to Adjust step!
  };

  // Adjust Current Cover if already set
  const handleAdjustCurrent = () => {
    if (currentCoverUrl) {
      setCandidateUri(currentCoverUrl);
      setScale(1);
      setPanY(0);
      setPanX(0);
      setStep('adjust');
    }
  };

  // Step 2: User completes adjusting -> Upload and apply to profile!
  const handleUploadCover = () => {
    if (!candidateUri) return;
    onSelectCover(candidateUri);
    onClose();
  };

  // Reset to default cosmic gradient
  const handleResetToGradient = () => {
    onSelectCover(undefined);
    onClose();
  };

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
              <Ionicons
                name={step === 'adjust' ? 'crop-outline' : 'image-outline'}
                size={20}
                color={BRAND_COLORS.purplePrimary}
              />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {step === 'adjust' ? 'Adjust Cover Framing' : 'Edit Cover Image'}
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
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
                  <Text style={styles.adjustPillText}>Adjust Framing After Upload</Text>
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
                <Text style={[styles.stepInstruction, { color: colors.textSecondary }]}>
                  Drag with your finger to reposition your cover image before uploading.
                </Text>

                {/* Live Banner Preview Box with Direct Hand Dragging */}
                <View style={[styles.previewFrameWrapper, { borderColor: BRAND_COLORS.purplePrimary }]}>
                  <View
                    {...panResponder.panHandlers}
                    // @ts-ignore
                    onWheel={(e: any) => {
                      if (e.deltaY < 0) {
                        setScale((prev) => Math.min(parseFloat((prev + 0.1).toFixed(2)), 3.5));
                      } else {
                        setScale((prev) => Math.max(parseFloat((prev - 0.1).toFixed(2)), 0.6));
                      }
                    }}
                    style={styles.previewCanvas}
                  >
                    {candidateUri ? (
                      <Image
                        source={{ uri: candidateUri }}
                        style={[
                          styles.adjustImage,
                          {
                            transform: [
                              { scale },
                              { translateY: panY },
                              { translateX: panX },
                            ],
                          },
                        ]}
                        resizeMode="cover"
                      />
                    ) : null}

                    {/* Header Title Mask Overlay Guide */}
                    <View pointerEvents="none" style={styles.framingGuideOverlay}>
                      <Text style={styles.framingGuideText}>DRAG WITH FINGER TO POSITION</Text>
                    </View>
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
                  style={styles.fixedUploadBtn}
                >
                  <Feather name="upload" size={18} color="#FFFFFF" />
                  <Text style={styles.fixedUploadBtnText}>Upload</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 26,
    borderWidth: 1,
    paddingBottom: 24,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  stepInstruction: {
    fontSize: 12.5,
    fontWeight: '500',
    marginBottom: 12,
  },
  previewFrameWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    backgroundColor: '#0F0E17',
    marginBottom: 16,
  },
  previewCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  framingGuideOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  framingGuideText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  adjustSectionBlock: {
    marginBottom: 14,
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
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 12,
  },
  zoomActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  adjustContainer: {
    maxHeight: 520,
    width: '100%',
  },
  adjustScrollContent: {
    paddingBottom: 16,
  },
  fixedBottomFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    width: '100%',
  },
  fixedUploadBtn: {
    width: '100%',
    backgroundColor: BRAND_COLORS.purplePrimary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  fixedUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
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
