import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { TabType, ThemeMode, HubPost, UserProfile } from '../types/profile';
import { INSTAGRAM_FILTERS, getFilterById } from '../constants/filters';
import InstagramVideoPost from './InstagramVideoPost';

export interface CreateHubModalProps {
  visible: boolean;
  activeTab: TabType;
  themeMode: ThemeMode;
  initialMediaUri?: string;
  initialAdditionalImages?: string[];
  initialDeviceImages?: string[];
  initialCaption?: string;
  initialFormat?: 'photo' | 'video';
  user?: UserProfile;
  onClose: () => void;
  onCreatePost: (post: HubPost) => void;
}

export interface AspectRatioPreset {
  id: string;
  name: string;
  ratio: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: '1:1', name: '1:1', ratio: 1, label: 'Square 1:1', icon: 'square-outline' },
  { id: '4:5', name: '4:5', ratio: 4 / 5, label: 'Portrait 4:5', icon: 'phone-portrait-outline' },
  { id: '9:16', name: '9:16', ratio: 9 / 16, label: 'Vertical 9:16', icon: 'phone-portrait' },
  { id: '16:9', name: '16:9', ratio: 16 / 9, label: 'Wide 16:9', icon: 'tv-outline' },
];

const PRESET_SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
];

const POPULAR_HASHTAGS = [
  '#HiHubble',
  '#Cosmic',
  '#HubClips',
  '#SpaceVibes',
  '#Stargazer',
  '#Astrophotography',
];

const SUGGESTED_VIDEO_COMMENTS = [
  '🔊 Sound ON for full immersion!',
  '🚀 Drop your thoughts below!',
  '🌌 Cosmic energy in 4K!',
  '✨ What do you think of this view?',
  '🛰️ Filmed live in orbital flight!',
];

export const CreateHubModal: React.FC<CreateHubModalProps> = ({
  visible,
  activeTab,
  themeMode,
  initialMediaUri,
  initialAdditionalImages,
  initialDeviceImages,
  initialCaption,
  initialFormat,
  user,
  onClose,
  onCreatePost,
}) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  // Format: Photos vs Video
  const [mediaFormat, setMediaFormat] = useState<'photo' | 'video'>('photo');

  // Selected images for photo post (zero reference images by default)
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  // Selected video for video post
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Filter & Aspect ratio
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(['#HiHubble']);
  const [customTagInput, setCustomTagInput] = useState('');

  // Comment section settings for video upload
  const [allowComments, setAllowComments] = useState(true);
  const [initialComment, setInitialComment] = useState('');

  // Active preview index for sideways swiping in multi-photo preview
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      const isVideoDefault = initialFormat === 'video' || activeTab === 'hubclips';
      setMediaFormat(isVideoDefault ? 'video' : 'photo');
      setSelectedAspectRatio(isVideoDefault ? '9:16' : '1:1');
      setSelectedFilter('normal');
      setActivePreviewIndex(0);
      setHashtags(['#HiHubble', isVideoDefault ? '#HubClips' : '#Cosmic']);
      setAllowComments(true);
      setInitialComment('');

      if (isVideoDefault) {
        if (initialMediaUri && (initialMediaUri.endsWith('.mp4') || initialMediaUri.endsWith('.mov') || initialFormat === 'video')) {
          setSelectedVideo(initialMediaUri);
        } else {
          setSelectedVideo(null);
        }
      } else {
        if (initialMediaUri) {
          const allInit = [initialMediaUri, ...(initialAdditionalImages || [])];
          setSelectedImages(allInit);
        } else if (initialDeviceImages && initialDeviceImages.length > 0) {
          setSelectedImages(initialDeviceImages);
        } else {
          setSelectedImages([]);
        }
      }

      if (initialCaption) setCaption(initialCaption);
    }
  }, [
    visible,
    activeTab,
    initialMediaUri,
    initialAdditionalImages,
    initialDeviceImages,
    initialCaption,
    initialFormat,
  ]);

  // Pick photos or video from device
  const handlePickFromDevice = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow media access to select files from your device.');
        return;
      }

      if (mediaFormat === 'video') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'],
          allowsEditing: false,
          quality: 0.9,
        });
        if (!result.canceled && result.assets && result.assets[0]?.uri) {
          setSelectedVideo(result.assets[0].uri);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.9,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const pickedUris = result.assets.map((a) => a.uri);
          setSelectedImages((prev) => [...prev, ...pickedUris]);
          setActivePreviewIndex(selectedImages.length);
        }
      }
    } catch (e) {
      console.log('Error picking media:', e);
      Alert.alert('Error', 'Could not open device media gallery.');
    }
  };

  const handleRemoveSelectedImage = (index: number) => {
    const next = selectedImages.filter((_, idx) => idx !== index);
    setSelectedImages(next);
    setActivePreviewIndex((prev) => Math.max(0, Math.min(prev, next.length - 1)));
  };

  const handleToggleHashtag = (tag: string) => {
    if (hashtags.includes(tag)) {
      setHashtags((prev) => prev.filter((t) => t !== tag));
    } else {
      setHashtags((prev) => [...prev, tag]);
    }
  };

  const handleAddCustomHashtag = () => {
    let clean = customTagInput.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (!hashtags.includes(clean)) {
      setHashtags((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  // Publish / Upload
  const handlePublish = () => {
    const isVideo = mediaFormat === 'video';
    const newShareId = `HUB-${Math.floor(10000 + Math.random() * 90000)}`;

    if (isVideo) {
      if (!selectedVideo) {
        Alert.alert('No Video Selected', 'Please choose a video from your device to upload.');
        return;
      }

      const activeRatioObj =
        ASPECT_RATIO_PRESETS.find((r) => r.id === selectedAspectRatio) || ASPECT_RATIO_PRESETS[2];

      const initialCommentList = [];
      if (allowComments && initialComment.trim()) {
        initialCommentList.push({
          id: `c_${Date.now()}`,
          user: user?.name || 'Hymasri',
          avatar:
            user?.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          text: initialComment.trim(),
          time: 'Just now',
          isPinned: true,
        });
      }

      const newPost: HubPost = {
        id: `clip_${Date.now()}`,
        shareId: newShareId,
        imageUrl: selectedVideo,
        mediaType: 'video',
        tabType: 'hubclips',
        postType: 'post',
        caption: caption.trim() || 'New video clip shared on Hi-Hubble',
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        aspectRatio: activeRatioObj.ratio,
        aspectRatioLabel: activeRatioObj.name,
        likes: 0,
        comments: initialCommentList.length,
        commentsList: initialCommentList,
        allowComments: allowComments,
        createdAt: 'Just now',
        isSaved: false,
      };

      onCreatePost(newPost);
      setCaption('');
      setInitialComment('');
      setSelectedVideo(null);
      onClose();
      return;
    }

    // Photo Mode (Your Hubs)
    if (selectedImages.length === 0) {
      Alert.alert('No Photos Selected', 'Please choose at least one photo from your device to upload.');
      return;
    }

    const primaryImage = selectedImages[0];
    const additional = selectedImages.length > 1 ? selectedImages.slice(1) : undefined;
    const activeRatioObj =
      ASPECT_RATIO_PRESETS.find((r) => r.id === selectedAspectRatio) || ASPECT_RATIO_PRESETS[0];

    const newPost: HubPost = {
      id: `hub_${Date.now()}`,
      shareId: newShareId,
      imageUrl: primaryImage,
      additionalImages: additional,
      mediaType: 'image',
      tabType: 'hubs',
      postType: 'post',
      caption: caption.trim() || 'Cosmic moments shared on Hi-Hubble',
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      filter: selectedFilter !== 'normal' ? selectedFilter : undefined,
      aspectRatio: activeRatioObj.ratio,
      aspectRatioLabel: activeRatioObj.name,
      likes: 0,
      comments: 0,
      createdAt: 'Just now',
      isSaved: false,
    };

    onCreatePost(newPost);
    setCaption('');
    setSelectedImages([]);
    onClose();
  };

  const activeFilterObj = getFilterById(selectedFilter);
  const activeRatioObj =
    ASPECT_RATIO_PRESETS.find((r) => r.id === selectedAspectRatio) || ASPECT_RATIO_PRESETS[0];

  const currentPreviewUri =
    selectedImages.length > 0
      ? selectedImages[Math.min(activePreviewIndex, selectedImages.length - 1)]
      : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
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
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.titleGroup}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      mediaFormat === 'video'
                        ? 'rgba(14, 165, 233, 0.15)'
                        : 'rgba(124, 58, 237, 0.12)',
                  },
                ]}
              >
                <Ionicons
                  name={mediaFormat === 'video' ? 'videocam' : 'images'}
                  size={18}
                  color={mediaFormat === 'video' ? '#0EA5E9' : BRAND_COLORS.purplePrimary}
                />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {mediaFormat === 'video' ? 'Upload HubClip' : 'Add Photos to Your Hubs'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {mediaFormat === 'video'
                    ? 'Upload playable video to HubClips'
                    : selectedImages.length > 0
                    ? `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} • Swipeable album`
                    : 'Upload photos with Instagram filters'}
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* FORMAT SELECTOR: Photos (Your Hubs) vs Video (HubClips) */}
            <View style={styles.selectorsRow}>
              <View style={[styles.segmentBox, { backgroundColor: colors.statCardBg, borderColor: colors.border, flex: 1 }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setMediaFormat('photo');
                    setSelectedAspectRatio('1:1');
                  }}
                  style={[
                    styles.segmentOption,
                    mediaFormat === 'photo' && { backgroundColor: BRAND_COLORS.purplePrimary },
                  ]}
                >
                  <Ionicons
                    name="images"
                    size={13}
                    color={mediaFormat === 'photo' ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentOptionText,
                      { color: mediaFormat === 'photo' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Photos (Your Hubs)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setMediaFormat('video');
                    setSelectedAspectRatio('9:16');
                  }}
                  style={[
                    styles.segmentOption,
                    mediaFormat === 'video' && { backgroundColor: BRAND_COLORS.purplePrimary },
                  ]}
                >
                  <Ionicons
                    name="videocam"
                    size={13}
                    color={mediaFormat === 'video' ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentOptionText,
                      { color: mediaFormat === 'video' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Video (HubClips)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 1. MEDIA PREVIEW OR UPLOAD DROPZONE */}
            <View style={styles.previewSection}>
              {mediaFormat === 'video' ? (
                /* VIDEO MODE */
                selectedVideo ? (
                  <View style={styles.videoPlayerWrapper}>
                    <InstagramVideoPost
                      videoUrl={selectedVideo}
                      aspectRatio={activeRatioObj.ratio}
                      autoPlay={true}
                    />
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handlePickFromDevice}
                      style={styles.pickDeviceOverlayBtn}
                    >
                      <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                      <Text style={styles.pickDeviceOverlayBtnText}>Change Video from Device</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.uploadDropzoneCard,
                      {
                        backgroundColor: themeMode === 'light' ? '#FBF9FE' : '#1A1430',
                        borderColor: BRAND_COLORS.purplePrimary,
                      },
                    ]}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Feather name="video" size={30} color="#FFFFFF" />
                    </View>

                    <Text style={[styles.uploadDropzoneTitle, { color: colors.textPrimary }]}>
                      Upload Video to HubClips
                    </Text>

                    <Text style={[styles.uploadDropzoneSubtitle, { color: colors.textSecondary }]}>
                      Upload video from your device in Instagram format. Directly playable in HubClips with smooth tap-to-play.
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handlePickFromDevice}
                      style={styles.choosePhotosBtnWrapper}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.choosePhotosBtn}
                      >
                        <Feather name="folder-plus" size={17} color="#FFFFFF" />
                        <Text style={styles.choosePhotosBtnText}>Choose Video from Device (.mp4 / .mov)</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setSelectedVideo(PRESET_SAMPLE_VIDEOS[0])}
                      style={styles.sampleVideoPill}
                    >
                      <Ionicons name="sparkles" size={12} color={BRAND_COLORS.purplePrimary} />
                      <Text style={styles.sampleVideoPillText}>Or use Cosmic Demo Video</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : selectedImages.length === 0 ? (
                /* PHOTO EMPTY STATE / CLEAN UPLOAD DROPZONE (NO REFERENCE IMAGES) */
                <View
                  style={[
                    styles.uploadDropzoneCard,
                    {
                      backgroundColor: themeMode === 'light' ? '#FBF9FE' : '#1A1430',
                      borderColor: BRAND_COLORS.purplePrimary,
                    },
                  ]}
                >
                  <View style={styles.uploadIconCircle}>
                    <Feather name="upload-cloud" size={32} color="#FFFFFF" />
                  </View>

                  <Text style={[styles.uploadDropzoneTitle, { color: colors.textPrimary }]}>
                    Upload Photos to Your Hubs
                  </Text>

                  <Text style={[styles.uploadDropzoneSubtitle, { color: colors.textSecondary }]}>
                    Choose photos from your device to create a swipeable album with Instagram filters
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handlePickFromDevice}
                    style={styles.choosePhotosBtnWrapper}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.choosePhotosBtn}
                    >
                      <Feather name="folder-plus" size={17} color="#FFFFFF" />
                      <Text style={styles.choosePhotosBtnText}>Choose Photos from Device</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.uploadFeaturesRow}>
                    <View style={styles.featureItem}>
                      <Ionicons name="images-outline" size={13} color={BRAND_COLORS.purplePrimary} />
                      <Text style={[styles.featureText, { color: colors.textMuted }]}>
                        Multiple photos (swipeable)
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="color-filter-outline" size={13} color={BRAND_COLORS.purplePrimary} />
                      <Text style={[styles.featureText, { color: colors.textMuted }]}>
                        16 Instagram filters
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                /* MULTI-PHOTO CAROUSEL PREVIEW (SWIPEABLE SIDEWAYS) */
                <View style={styles.photoCarouselWrapper}>
                  <View
                    style={[
                      styles.photoBox,
                      {
                        aspectRatio: activeRatioObj.ratio,
                        maxHeight: activeRatioObj.id === '4:5' ? 420 : 360,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: currentPreviewUri }}
                      // @ts-ignore
                      style={[
                        styles.previewImage,
                        Platform.OS === 'web' &&
                          activeFilterObj.id !== 'normal' &&
                          ({ filter: activeFilterObj.cssFilter } as any),
                      ]}
                      resizeMode="cover"
                    />

                    {/* Filter Color Tint Overlay */}
                    {activeFilterObj.color !== 'transparent' && (
                      <View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFill, { backgroundColor: activeFilterObj.color }]}
                      />
                    )}

                    {/* Left / Right Carousel Arrows */}
                    {selectedImages.length > 1 && (
                      <>
                        {activePreviewIndex > 0 && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setActivePreviewIndex((prev) => prev - 1)}
                            style={[styles.carouselNavBtn, styles.carouselNavLeft]}
                          >
                            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                        {activePreviewIndex < selectedImages.length - 1 && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setActivePreviewIndex((prev) => prev + 1)}
                            style={[styles.carouselNavBtn, styles.carouselNavRight]}
                          >
                            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </>
                    )}

                    {/* Counter Badge */}
                    {selectedImages.length > 1 && (
                      <View style={styles.carouselBadge}>
                        <Ionicons name="images" size={12} color="#FFFFFF" />
                        <Text style={styles.carouselBadgeText}>
                          {activePreviewIndex + 1} / {selectedImages.length}
                        </Text>
                      </View>
                    )}

                    {/* Active Filter Indicator */}
                    {activeFilterObj.id !== 'normal' && (
                      <View style={styles.filterActiveBadge}>
                        <Ionicons name="sparkles" size={11} color="#FFFFFF" />
                        <Text style={styles.filterActiveBadgeText}>{activeFilterObj.name}</Text>
                      </View>
                    )}
                  </View>

                  {/* Thumbnail Strip with Delete and Add More */}
                  <View style={styles.thumbnailsStripWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsScroll}>
                      {selectedImages.map((uri, index) => (
                        <View key={`${uri}_${index}`} style={styles.thumbItemContainer}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setActivePreviewIndex(index)}
                            style={[
                              styles.thumbImageBtn,
                              index === activePreviewIndex && {
                                borderColor: BRAND_COLORS.purplePrimary,
                                borderWidth: 2,
                              },
                            ]}
                          >
                            <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleRemoveSelectedImage(index)}
                            style={styles.removeThumbBtn}
                          >
                            <Ionicons name="close" size={10} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Add More Photos Button */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handlePickFromDevice}
                        style={[
                          styles.addMorePhotosBtn,
                          { backgroundColor: colors.statCardBg, borderColor: BRAND_COLORS.purplePrimary },
                        ]}
                      >
                        <Feather name="plus" size={18} color={BRAND_COLORS.purplePrimary} />
                        <Text style={styles.addMorePhotosBtnText}>Add More</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>

            {/* 2. INSTAGRAM-LIKE FILTERS ROW (Photos Only) */}
            {mediaFormat === 'photo' && selectedImages.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="color-filter-outline" size={16} color={BRAND_COLORS.purplePrimary} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                      Instagram Filters
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: BRAND_COLORS.purplePrimary }}>
                    {activeFilterObj.name}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersScrollRow}
                >
                  {INSTAGRAM_FILTERS.map((flt) => {
                    const isSelected = selectedFilter === flt.id;
                    return (
                      <TouchableOpacity
                        key={flt.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedFilter(flt.id)}
                        style={[
                          styles.filterCard,
                          {
                            backgroundColor: colors.statCardBg,
                            borderColor: isSelected ? BRAND_COLORS.purplePrimary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.filterSwatch,
                            // @ts-ignore
                            Platform.OS === 'web' &&
                              flt.id !== 'normal' &&
                              ({ filter: flt.cssFilter } as any),
                          ]}
                        >
                          <Image
                            source={{ uri: currentPreviewUri }}
                            style={styles.filterSwatchImg}
                            resizeMode="cover"
                          />
                          {flt.color !== 'transparent' && (
                            <View
                              pointerEvents="none"
                              style={[StyleSheet.absoluteFill, { backgroundColor: flt.color }]}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.filterName,
                            {
                              color: isSelected ? BRAND_COLORS.purplePrimary : colors.textSecondary,
                              fontWeight: isSelected ? '800' : '500',
                            },
                          ]}
                        >
                          {flt.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 3. ASPECT RATIO SELECTOR */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Aspect Ratio Format
              </Text>
              <View style={styles.aspectRatioRow}>
                {ASPECT_RATIO_PRESETS.map((preset) => {
                  const isSelected = selectedAspectRatio === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedAspectRatio(preset.id)}
                      style={[
                        styles.aspectRatioChip,
                        {
                          backgroundColor: isSelected ? BRAND_COLORS.purplePrimary : colors.statCardBg,
                          borderColor: isSelected ? BRAND_COLORS.purplePrimary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={preset.icon}
                        size={14}
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.aspectRatioChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. CAPTION INPUT */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Caption (Optional)
              </Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={
                  mediaFormat === 'video'
                    ? 'Describe your video clip moment...'
                    : 'Write a cosmic caption for your hub post...'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[
                  styles.captionInput,
                  {
                    backgroundColor: colors.statCardBg,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </View>

            {/* 5. HASHTAGS PICKER */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hashtags</Text>

              {/* Active selected hashtags */}
              {hashtags.length > 0 && (
                <View style={styles.activeTagsRow}>
                  {hashtags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.7}
                      onPress={() => handleToggleHashtag(tag)}
                      style={styles.activeTagBadge}
                    >
                      <Text style={styles.activeTagText}>{tag}</Text>
                      <Ionicons name="close-circle" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Custom tag input */}
              <View style={[styles.customTagRow, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
                <Feather name="hash" size={14} color={BRAND_COLORS.purplePrimary} />
                <TextInput
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  onSubmitEditing={handleAddCustomHashtag}
                  placeholder="Add custom hashtag..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.customTagInput, { color: colors.textPrimary }]}
                  returnKeyType="done"
                />
                <TouchableOpacity activeOpacity={0.7} onPress={handleAddCustomHashtag} style={styles.addTagBtn}>
                  <Text style={styles.addTagBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Suggested tags */}
              <View style={styles.suggestedTagsRow}>
                {POPULAR_HASHTAGS.map((tag) => {
                  const isPicked = hashtags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.7}
                      onPress={() => handleToggleHashtag(tag)}
                      style={[
                        styles.suggestedChip,
                        {
                          backgroundColor: isPicked ? 'rgba(124, 58, 237, 0.15)' : colors.statCardBg,
                          borderColor: isPicked ? BRAND_COLORS.purplePrimary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.suggestedChipText,
                          { color: isPicked ? BRAND_COLORS.purplePrimary : colors.textSecondary },
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 6. COMMENTS SECTION IN VIDEO UPLOAD */}
            {mediaFormat === 'video' && (
              <View
                style={[
                  styles.sectionBlock,
                  styles.commentUploadSection,
                  { backgroundColor: colors.statCardBg, borderColor: colors.border },
                ]}
              >
                <View style={styles.commentSectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.commentHeaderIconBox}>
                      <Ionicons name="chatbubble-ellipses" size={16} color={BRAND_COLORS.purplePrimary} />
                    </View>
                    <View>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                        Comment Section Settings
                      </Text>
                      <Text style={[styles.commentSectionSub, { color: colors.textMuted }]}>
                        Manage discussion and initial comment for this video
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Allow Comments Toggle */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAllowComments((prev) => !prev)}
                  style={[
                    styles.commentToggleRow,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: allowComments ? BRAND_COLORS.purplePrimary : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.commentToggleLabel, { color: colors.textPrimary }]}>
                      Allow Comments on this Video
                    </Text>
                    <Text style={[styles.commentToggleDesc, { color: colors.textMuted }]}>
                      {allowComments
                        ? 'Hubbers can leave comments, ask questions, and interact.'
                        : 'Comments are turned off for this HubClip.'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggleTrack,
                      { backgroundColor: allowComments ? BRAND_COLORS.purplePrimary : (themeMode === 'light' ? '#E5E7EB' : '#374151') },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        allowComments ? styles.toggleThumbActive : styles.toggleThumbInactive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                {/* First Comment / Author Starter Note */}
                {allowComments ? (
                  <View style={styles.initialCommentBox}>
                    <View style={styles.initialCommentHeader}>
                      <Ionicons name="pin" size={13} color="#F59E0B" />
                      <Text style={[styles.initialCommentTitle, { color: colors.textPrimary }]}>
                        Pin First Comment (Optional)
                      </Text>
                    </View>
                    <TextInput
                      value={initialComment}
                      onChangeText={setInitialComment}
                      placeholder="e.g. Sound ON! 🔊 Let me know what you think of this video pass..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={2}
                      style={[
                        styles.initialCommentInput,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                    />

                    {/* Quick Suggestions Chips */}
                    <Text style={[styles.suggestionLabel, { color: colors.textMuted }]}>
                      Quick starter suggestions:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.commentChipsRow}>
                      {SUGGESTED_VIDEO_COMMENTS.map((chipText, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={() => setInitialComment(chipText)}
                          style={[
                            styles.commentChip,
                            {
                              backgroundColor: initialComment === chipText ? 'rgba(124, 58, 237, 0.18)' : colors.cardBg,
                              borderColor: initialComment === chipText ? BRAND_COLORS.purplePrimary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.commentChipText,
                              { color: initialComment === chipText ? BRAND_COLORS.purplePrimary : colors.textSecondary },
                            ]}
                          >
                            {chipText}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={[styles.commentsOffNotice, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Feather name="lock" size={14} color={colors.textMuted} />
                    <Text style={[styles.commentsOffNoticeText, { color: colors.textMuted }]}>
                      Commenting will be disabled for this video upon upload.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 7. UPLOAD / PUBLISH ACTION BUTTON */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePublish}
              style={styles.publishBtnWrapper}
            >
              <LinearGradient
                colors={
                  mediaFormat === 'video'
                    ? ['#0EA5E9', '#0284C7']
                    : ['#8B5CF6', '#7C3AED']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.publishBtn}
              >
                <Feather
                  name={mediaFormat === 'video' ? 'video' : 'upload-cloud'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.publishBtnText}>
                  {mediaFormat === 'video'
                    ? 'Upload HubClip'
                    : selectedImages.length > 1
                    ? `Upload Album (${selectedImages.length} Photos)`
                    : 'Upload to Your Hubs'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '90%',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 12,
    maxHeight: 620,
  },
  selectorsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  segmentBox: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 9,
  },
  segmentOptionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  previewSection: {
    marginBottom: 16,
  },
  uploadDropzoneCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
  },
  uploadIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BRAND_COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  uploadDropzoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  uploadDropzoneSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
    marginBottom: 16,
  },
  choosePhotosBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  choosePhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  choosePhotosBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  sampleVideoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  sampleVideoPillText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  uploadFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
  },
  videoPlayerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  pickDeviceOverlayBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
  },
  pickDeviceOverlayBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  photoCarouselWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  photoBox: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#05050A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  carouselNavBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  carouselNavLeft: {
    left: 10,
  },
  carouselNavRight: {
    right: 10,
  },
  carouselBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 5,
  },
  carouselBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  filterActiveBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    zIndex: 5,
  },
  filterActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  thumbnailsStripWrapper: {
    width: '100%',
    marginTop: 10,
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  thumbItemContainer: {
    position: 'relative',
  },
  thumbImageBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  addMorePhotosBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addMorePhotosBtnText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 9,
    fontWeight: '800',
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 8,
  },
  filtersScrollRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  filterCard: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterSwatch: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 5,
  },
  filterSwatchImg: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    fontSize: 11,
  },
  aspectRatioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aspectRatioChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  aspectRatioChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  captionInput: {
    minHeight: 68,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    fontSize: 13.5,
    textAlignVertical: 'top',
  },
  activeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  activeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  customTagInput: {
    flex: 1,
    fontSize: 12.5,
  },
  addTagBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: BRAND_COLORS.purplePrimary,
    borderRadius: 8,
  },
  addTagBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  suggestedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestedChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentUploadSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  commentSectionHeader: {
    marginBottom: 2,
  },
  commentHeaderIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  commentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentToggleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentToggleDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  initialCommentBox: {
    gap: 8,
  },
  initialCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  initialCommentTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  initialCommentInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    lineHeight: 17,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  commentChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  commentChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  commentChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commentsOffNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  commentsOffNoticeText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  publishBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 24,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default CreateHubModal;
