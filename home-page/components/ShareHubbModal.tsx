import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useVideoPlayer, VideoView } from 'expo-video';

export interface HubbDraft {
  mediaUri: string;
  caption: string;
  scheduled: boolean;
  selectedTool?: string;
}

interface ShareHubbModalProps {
  isDark?: boolean;
  onClose: () => void;
  onPublishStory: (storyData: {
    mediaUri: string;
    caption: string;
    thumbnailUri?: string;
  }) => void;
}

const IMAGE_TOOLS = [
  { id: 'filters', label: 'Filters', icon: 'aperture' as const },
  { id: 'crop', label: 'Crop', icon: 'crop' as const },
  { id: 'rotate', label: 'Rotate', icon: 'rotate-cw' as const },
  { id: 'adjust', label: 'Adjust', icon: 'sliders' as const },
  { id: 'stickers', label: 'Stickers', icon: 'star' as const },
  { id: 'text', label: 'Text', icon: 'type' as const },
  { id: 'music', label: 'Music', icon: 'music' as const },
  { id: 'location', label: 'Location', icon: 'map-pin' as const },
];

export interface SelectedMediaItem {
  uri: string;
  type: 'image' | 'video';
  thumbnailUri?: string | null;
  duration?: number | null;
  fileName?: string | null;
}

// Error boundary to gracefully catch any native video playback glitches
interface VideoErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}
interface VideoErrorBoundaryState {
  hasError: boolean;
}
class VideoErrorBoundary extends Component<VideoErrorBoundaryProps, VideoErrorBoundaryState> {
  state: VideoErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): VideoErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Video error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Inline video player preview using expo-video
function VideoPreviewPlayer({
  uri,
  duration,
  thumbnailUri,
}: {
  uri: string;
  duration?: number | null;
  thumbnailUri?: string | null;
}) {
  const [isPlaying, setIsPlaying] = useState(true);

  const player = useVideoPlayer(uri, (p) => {
    try {
      p.loop = true;
      p.muted = true;
      p.play();
    } catch (err) {
      console.log('Player setup error:', err);
    }
  });

  const togglePlayback = () => {
    try {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log('Toggle playback error:', err);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={togglePlayback}
      style={styles.videoPlayerTouchable}
    >
      <VideoView
        style={styles.mediaPreviewImage}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {!isPlaying && (
        <View style={styles.videoPausedOverlay}>
          <View style={styles.videoIconCircle}>
            <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>
          <Text style={styles.videoPausedText}>Tap to play</Text>
        </View>
      )}
      <View style={styles.videoMetaBadge}>
        <Feather name="video" size={13} color="#FFFFFF" />
        <Text style={styles.videoMetaText}>
          {duration != null
            ? `${Math.round(duration)}s • ${isPlaying ? 'Tap to pause' : 'Paused'}`
            : isPlaying
            ? 'Tap to pause'
            : 'Paused'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ShareHubbModal({
  isDark,
  onClose,
  onPublishStory,
}: ShareHubbModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaItem | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [caption, setCaption] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [draftSavedTime, setDraftSavedTime] = useState('Just now');
  const [draftsCount, setDraftsCount] = useState(0);

  // Access phone's native Camera (Photo or Video)
  const launchCamera = async (mediaType: 'images' | 'videos') => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow Camera access in your phone settings to capture photos or videos for your HUBB story.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: mediaType === 'videos' ? ['videos'] : ['images'],
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo =
          asset.type === 'video' ||
          (asset.fileName && /\.(mp4|mov|m4v|3gp|mkv|webm)$/i.test(asset.fileName)) ||
          (asset.uri && /\.(mp4|mov|m4v|3gp|mkv|webm)(\?.*)?$/i.test(asset.uri));

        let thumbUri: string | null = null;
        if (isVideo) {
          try {
            const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, {
              time: 0,
              quality: 0.8,
            });
            thumbUri = thumb.uri;
          } catch (tErr) {
            console.log('Video thumbnail notice:', tErr);
          }
        }

        setSelectedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          thumbnailUri: thumbUri,
          duration: asset.duration,
          fileName: asset.fileName || (isVideo ? 'video.mp4' : 'photo.jpg'),
        });
      }
    } catch (error: any) {
      console.error('Camera launch error:', error);
      Alert.alert(
        'Camera Error',
        error?.message || 'Could not open camera on this device. Please check permissions.'
      );
    }
  };

  const handleOpenCamera = () => {
    Alert.alert(
      'Camera Mode',
      'What would you like to capture?',
      [
        {
          text: '📸 Take Photo',
          onPress: () => launchCamera('images'),
        },
        {
          text: '🎥 Record Video',
          onPress: () => launchCamera('videos'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Access phone's native Photo / Media Library
  const handleOpenPhotos = async () => {
    try {
      try {
        const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) {
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
      } catch (permErr) {
        console.log('Media library permission handled by OS:', permErr);
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo =
          asset.type === 'video' ||
          (asset.fileName && /\.(mp4|mov|m4v|3gp|mkv|webm)$/i.test(asset.fileName)) ||
          (asset.uri && /\.(mp4|mov|m4v|3gp|mkv|webm)(\?.*)?$/i.test(asset.uri));

        let thumbUri: string | null = null;
        if (isVideo) {
          try {
            const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, {
              time: 0,
              quality: 0.8,
            });
            thumbUri = thumb.uri;
          } catch (tErr) {
            console.log('Video thumbnail notice:', tErr);
          }
        }

        setSelectedMedia({
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          thumbnailUri: thumbUri,
          duration: asset.duration,
          fileName: asset.fileName || (isVideo ? 'video.mp4' : 'photo.jpg'),
        });
      }
    } catch (error: any) {
      console.error('Photo Library launch error:', error);
      Alert.alert(
        'Photo Library Error',
        error?.message || 'Could not open photo library. Please check app permissions.'
      );
    }
  };

  // Switch / change media dialog
  const handleChangeMedia = () => {
    Alert.alert(
      'Change Media',
      'Take a new photo/video or choose from your phone library:',
      [
        { text: '📸 Take Photo', onPress: () => launchCamera('images') },
        { text: '🎥 Record Video', onPress: () => launchCamera('videos') },
        { text: '🖼️ Photo Library', onPress: handleOpenPhotos },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveDraft = () => {
    setDraftsCount((prev) => prev + 1);
    setDraftSavedTime('Just now');
    Alert.alert('Draft Saved', 'Your HUBB draft has been saved successfully.');
  };

  const handlePublish = () => {
    const finalMedia =
      selectedMedia?.uri ||
      selectedMedia?.thumbnailUri ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
    onPublishStory({
      mediaUri: finalMedia,
      caption: caption.trim() || 'Sharing my vibe with the world! ✨',
      thumbnailUri: selectedMedia?.thumbnailUri || undefined,
    });
  };

  return (
    <View style={[styles.modalRoot, isDark && styles.modalRootDark]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Header Row with Back to Home & Title */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Feather name="arrow-left" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
              Share HUBBs
            </Text>
            <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
              Share your vibe with the world! ✨
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── CARD 1: MEDIA ── */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
              Media
            </Text>

            {selectedMedia ? (
              <View style={[styles.mediaPreviewContainer, isDark && styles.mediaPreviewContainerDark]}>
                {selectedMedia.type === 'video' ? (
                  <VideoErrorBoundary
                    fallback={
                      selectedMedia.thumbnailUri ? (
                        <Image
                          source={{ uri: selectedMedia.thumbnailUri }}
                          style={styles.mediaPreviewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.videoFallbackPlaceholder}>
                          <View style={styles.videoIconCircle}>
                            <Feather name="video" size={30} color="#FFFFFF" />
                          </View>
                          <Text style={styles.videoFallbackTitle}>Video Ready to Share</Text>
                          <Text style={styles.videoFallbackSub}>
                            {selectedMedia.duration != null
                              ? `${Math.round(selectedMedia.duration)} seconds`
                              : 'Tap Next to publish'}
                          </Text>
                        </View>
                      )
                    }
                  >
                    <VideoPreviewPlayer
                      uri={selectedMedia.uri}
                      duration={selectedMedia.duration}
                      thumbnailUri={selectedMedia.thumbnailUri}
                    />
                  </VideoErrorBoundary>
                ) : (
                  <View style={styles.imagePreviewWrap}>
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={styles.mediaPreviewImage}
                      resizeMode="cover"
                      onLoadStart={() => setIsMediaLoading(true)}
                      onLoadEnd={() => setIsMediaLoading(false)}
                      onError={() => setIsMediaLoading(false)}
                    />
                    {isMediaLoading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#6535EA" />
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeMediaBtn}
                  onPress={() => setSelectedMedia(null)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeMediaPill}
                  onPress={handleChangeMedia}
                  activeOpacity={0.85}
                >
                  <Feather name="refresh-cw" size={13} color="#6535EA" />
                  <Text style={styles.changeMediaText}>Change Media</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.dropZone, isDark && styles.dropZoneDark]}>
                {/* Camera Option */}
                <TouchableOpacity
                  style={styles.mediaOptionBtn}
                  activeOpacity={0.7}
                  onPress={handleOpenCamera}
                >
                  <View style={styles.purpleCircleIcon}>
                    <Feather name="camera" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.mediaOptionTitle, isDark && styles.mediaOptionTitleDark]}>
                    Camera
                  </Text>
                  <Text style={styles.mediaOptionSub}>Take a photo/video</Text>
                </TouchableOpacity>

                {/* OR Divider */}
                <View style={styles.orDividerRow}>
                  <View style={[styles.orLine, isDark && styles.orLineDark]} />
                  <Text style={[styles.orText, isDark && styles.orTextDark]}>OR</Text>
                  <View style={[styles.orLine, isDark && styles.orLineDark]} />
                </View>

                {/* Add Photos/Videos Option */}
                <TouchableOpacity
                  style={styles.mediaOptionBtn}
                  activeOpacity={0.7}
                  onPress={handleOpenPhotos}
                >
                  <View style={styles.purpleCircleIcon}>
                    <Feather name="image" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.mediaOptionTitle, isDark && styles.mediaOptionTitleDark]}>
                    Add Photos/Videos
                  </Text>
                  <Text style={styles.mediaOptionSub}>Upload from device</Text>
                </TouchableOpacity>

                <Text style={[styles.formatNotice, isDark && styles.formatNoticeDark]}>
                  Supported formats: JPG, PNG, MP4, MOV, GIF • Max size: 100MB
                </Text>
              </View>
            )}
          </View>

          {/* ── CARD 2: IMAGE TOOLS ── */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
              Image Tools
            </Text>

            <View style={styles.toolsGrid}>
              {IMAGE_TOOLS.map((tool) => {
                const isSelected = activeTool === tool.id;
                return (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.toolCol}
                    activeOpacity={0.75}
                    onPress={() =>
                      setActiveTool((prev) => (prev === tool.id ? null : tool.id))
                    }
                  >
                    <View
                      style={[
                        styles.toolBtn,
                        isDark && styles.toolBtnDark,
                        isSelected && styles.toolBtnActive,
                      ]}
                    >
                      <Feather
                        name={tool.icon}
                        size={21}
                        color={
                          isSelected ? '#FFFFFF' : isDark ? '#B39EFF' : '#6535EA'
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.toolLabel,
                        isDark && styles.toolLabelDark,
                        isSelected && styles.toolLabelActive,
                      ]}
                    >
                      {tool.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeTool && (
              <View style={[styles.toolFeedback, isDark && styles.toolFeedbackDark]}>
                <Feather name="check-circle" size={15} color="#6535EA" />
                <Text style={[styles.toolFeedbackText, isDark && styles.toolFeedbackTextDark]}>
                  {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} tool active
                </Text>
              </View>
            )}
          </View>

          {/* ── CARD 3: HUBBS DETAILS & SCHEDULING ── */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
              HUBBs Details & Scheduling
            </Text>

            {/* Caption / HUBBs Text */}
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              Caption / HUBBs Text
            </Text>
            <View style={[styles.captionInputBox, isDark && styles.captionInputBoxDark]}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a HUBB caption... #hashtags @mentions"
                placeholderTextColor={isDark ? '#8A7BB2' : '#9E92BA'}
                multiline
                numberOfLines={3}
                style={[styles.captionInput, isDark && styles.captionInputDark]}
              />
            </View>

            {/* Scheduling Toggle */}
            <View style={styles.schedulingRow}>
              <Text style={[styles.settingTitle, isDark && styles.settingTitleDark]}>
                Scheduling
              </Text>
              <View style={styles.toggleGroup}>
                <Text style={[styles.statusText, isDark && styles.statusTextDark]}>
                  {isScheduling ? 'Enabled' : 'Disabled'}
                </Text>
                <Switch
                  value={isScheduling}
                  onValueChange={setIsScheduling}
                  trackColor={{ false: isDark ? '#3C276E' : '#DED5F8', true: '#6535EA' }}
                  thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                />
              </View>
            </View>

            {/* Media Layouts */}
            <View style={styles.layoutsSection}>
              <Text style={[styles.settingTitle, isDark && styles.settingTitleDark]}>
                Media Layouts
              </Text>
              <Text style={[styles.settingSub, isDark && styles.settingSubDark]}>
                Upload two or more media items to enable layouts.
              </Text>
            </View>
          </View>

          {/* ── CARD 4: DRAFTS ── */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
              Drafts {draftsCount}
            </Text>

            <View style={[styles.draftsBox, isDark && styles.draftsBoxDark]}>
              <View style={styles.archiveIconWrap}>
                <Feather name="inbox" size={36} color={isDark ? '#A99BD1' : '#8B7CB5'} />
              </View>
              <Text style={[styles.draftsEmptyTitle, isDark && styles.draftsEmptyTitleDark]}>
                {draftsCount > 0 ? `${draftsCount} Draft(s) Ready` : 'No Drafts Yet'}
              </Text>
              <Text style={[styles.draftsEmptySub, isDark && styles.draftsEmptySubDark]}>
                {draftsCount > 0
                  ? 'Your saved HUBBs are ready to edit or publish.'
                  : 'Your saved HUBBs will appear here.'}
              </Text>
              <TouchableOpacity
                style={styles.startNewBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedMedia(null);
                  setCaption('');
                  handleChangeMedia();
                }}
              >
                <Text style={styles.startNewBtnText}>Start a new HUBB</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom spacing for floating bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── BOTTOM STICKY ACTION BAR ── */}
        <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
          {/* Save as Draft Button */}
          <TouchableOpacity
            style={[styles.saveDraftBtn, isDark && styles.saveDraftBtnDark]}
            activeOpacity={0.8}
            onPress={handleSaveDraft}
          >
            <Feather
              name="file-text"
              size={20}
              color={isDark ? '#C4A8FF' : '#211054'}
              style={{ marginRight: 10 }}
            />
            <View>
              <Text style={[styles.saveDraftTitle, isDark && styles.saveDraftTitleDark]}>
                Save as Draft
              </Text>
              <Text style={styles.saveDraftSub}>Last saved: {draftSavedTime}</Text>
            </View>
          </TouchableOpacity>

          {/* Next -> Preview and publish Button */}
          <TouchableOpacity
            style={styles.nextBtnWrap}
            activeOpacity={0.88}
            onPress={handlePublish}
          >
            <LinearGradient
              colors={['#6535EA', '#9D4EDD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextBtnGradient}
            >
              <View style={styles.nextTextRow}>
                <Text style={styles.nextBtnText}>Next</Text>
                <Feather name="arrow-right" size={17} color="#FFFFFF" style={{ marginLeft: 5 }} />
              </View>
              <Text style={styles.nextBtnSub}>Preview and publish</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FAF8FE',
    zIndex: 100,
  },
  modalRootDark: {
    backgroundColor: '#0F0821',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101, 53, 234, 0.08)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6535EA',
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 3,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211054',
    letterSpacing: -0.2,
  },
  headerTitleDark: {
    color: '#EDE7FF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#7667A5',
    marginTop: 1,
  },
  headerSubtitleDark: {
    color: '#A99BD1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 16,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE7FF',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1C1138',
    borderColor: '#32205E',
    shadowOpacity: 0.2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#211054',
    marginBottom: 14,
  },
  cardTitleDark: {
    color: '#EDE7FF',
  },

  // Media Section
  dropZone: {
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#E2D8FD',
    backgroundColor: '#FAF8FE',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dropZoneDark: {
    borderColor: '#3A2768',
    backgroundColor: '#231644',
  },
  mediaOptionBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  purpleCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6535EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  mediaOptionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#211054',
  },
  mediaOptionTitleDark: {
    color: '#EDE7FF',
  },
  mediaOptionSub: {
    fontSize: 12.5,
    color: '#7667A5',
    marginTop: 2,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 14,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2D8FD',
  },
  orLineDark: {
    backgroundColor: '#3D2A70',
  },
  orText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#8E7EC2',
  },
  orTextDark: {
    color: '#A99BD1',
  },
  formatNotice: {
    fontSize: 11.5,
    color: '#8E7EC2',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
  formatNoticeDark: {
    color: '#9C8CC6',
  },
  mediaPreviewContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#F3EEFF',
    borderWidth: 1.5,
    borderColor: '#D8CEF8',
  },
  mediaPreviewContainerDark: {
    backgroundColor: '#201344',
    borderColor: '#432C84',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  videoPlayerTouchable: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#1C1033',
    borderRadius: 18,
    overflow: 'hidden',
  },
  videoPausedOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  videoPausedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  videoMetaBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  videoFallbackPlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#2D1B54',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  videoFallbackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  videoFallbackSub: {
    color: '#D8CEF8',
    fontSize: 12,
    marginTop: 2,
  },
  imagePreviewWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#EFE9FC',
    borderRadius: 18,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 238, 255, 0.5)',
  },
  videoIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(101, 53, 234, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  videoMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeMediaPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  changeMediaText: {
    color: '#6535EA',
    fontSize: 12,
    fontWeight: '700',
  },

  // Image Tools Grid (2 rows x 4 cols)
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  toolCol: {
    width: '23%',
    alignItems: 'center',
  },
  toolBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F3EEFF',
    borderWidth: 1.2,
    borderColor: '#E3D7FD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  toolBtnDark: {
    backgroundColor: '#281954',
    borderColor: '#3E2A7A',
  },
  toolBtnActive: {
    backgroundColor: '#6535EA',
    borderColor: '#6535EA',
  },
  toolLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#211054',
    marginTop: 6,
    textAlign: 'center',
  },
  toolLabelDark: {
    color: '#D4C6FF',
  },
  toolLabelActive: {
    color: '#6535EA',
    fontWeight: '700',
  },
  toolFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: '#F3EEFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  toolFeedbackDark: {
    backgroundColor: '#281954',
  },
  toolFeedbackText: {
    fontSize: 12.5,
    color: '#6535EA',
    fontWeight: '600',
  },
  toolFeedbackTextDark: {
    color: '#D4C6FF',
  },

  // Details & Scheduling
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211054',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#EDE7FF',
  },
  captionInputBox: {
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#E2D8FD',
    backgroundColor: '#FAF8FE',
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
  },
  captionInputBoxDark: {
    borderColor: '#3D2A70',
    backgroundColor: '#231644',
  },
  captionInput: {
    fontSize: 13.5,
    color: '#211054',
    textAlignVertical: 'top',
  },
  captionInputDark: {
    color: '#EDE7FF',
  },
  schedulingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2D8FD',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#211054',
  },
  settingTitleDark: {
    color: '#EDE7FF',
  },
  statusText: {
    fontSize: 13,
    color: '#7667A5',
    fontWeight: '500',
  },
  statusTextDark: {
    color: '#A99BD1',
  },
  layoutsSection: {
    paddingTop: 12,
  },
  settingSub: {
    fontSize: 12.5,
    color: '#7667A5',
    marginTop: 4,
    lineHeight: 18,
  },
  settingSubDark: {
    color: '#A99BD1',
  },

  // Drafts
  draftsBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C7B9F4',
    backgroundColor: '#FAF8FE',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  draftsBoxDark: {
    borderColor: '#4A3582',
    backgroundColor: '#231644',
  },
  archiveIconWrap: {
    marginBottom: 10,
  },
  draftsEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#211054',
  },
  draftsEmptyTitleDark: {
    color: '#EDE7FF',
  },
  draftsEmptySub: {
    fontSize: 12.5,
    color: '#7667A5',
    marginTop: 3,
    marginBottom: 16,
    textAlign: 'center',
  },
  draftsEmptySubDark: {
    color: '#A99BD1',
  },
  startNewBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#6535EA',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  startNewBtnText: {
    color: '#6535EA',
    fontWeight: '700',
    fontSize: 13,
  },

  // Bottom Floating Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 53, 234, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomBarDark: {
    backgroundColor: 'rgba(21, 13, 44, 0.97)',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveDraftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6535EA',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  saveDraftBtnDark: {
    backgroundColor: '#201344',
    borderColor: '#8E6DFE',
  },
  saveDraftTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#211054',
  },
  saveDraftTitleDark: {
    color: '#EDE7FF',
  },
  saveDraftSub: {
    fontSize: 10,
    color: '#7667A5',
    marginTop: 1,
  },
  nextBtnWrap: {
    flex: 1.2,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  nextBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  nextBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10.5,
    marginTop: 1,
  },
});
