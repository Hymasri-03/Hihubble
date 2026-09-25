import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_COLORS } from '../constants/theme';
import { StoryItem, ThemeMode } from '../types/profile';
import { getFilterById } from '../constants/filters';

export interface StoryViewerModalProps {
  visible: boolean;
  stories: StoryItem[];
  initialIndex?: number;
  themeMode?: ThemeMode;
  onClose: () => void;
  onShareStoryId?: (story: StoryItem) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  stories,
  initialIndex = 0,
  onClose,
  onShareStoryId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);

  const currentStory = stories[currentIndex] || stories[0];
  const isVideo = currentStory?.mediaType === 'video';
  const STORY_DURATION = 5000; // 5s for photos

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [visible, initialIndex]);

  // Story Timer
  useEffect(() => {
    if (!visible || !currentStory || isPaused) return;

    if (!isVideo) {
      const stepTime = 50;
      const stepIncrement = stepTime / STORY_DURATION;

      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            handleNext();
            return 0;
          }
          return prev + stepIncrement;
        });
      }, stepTime);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [visible, currentIndex, isPaused, isVideo, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    Alert.alert('Reply Sent', `Your reply to ${currentStory.userName}'s story has been sent.`);
    setReplyText('');
  };

  const handleQuickReaction = (reactionName: string) => {
    Alert.alert('Reaction Sent', `Sent ${reactionName} reaction to ${currentStory.userName}'s story.`);
  };

  const handleCopyStoryId = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentStory.shareId);
    }
    Alert.alert('Story ID Copied', `Story ID ${currentStory.shareId} copied to clipboard!`);
    onShareStoryId?.(currentStory);
  };

  if (!visible || !currentStory) return null;

  const filterObj = getFilterById(currentStory.filter);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View style={styles.storyCard} data-modal-card="true">
          {/* Top Segmented Progress Bars */}
          <View style={styles.progressBarsRow}>
            {stories.map((story, idx) => {
              let fillWidth = '0%';
              if (idx < currentIndex) fillWidth = '100%';
              else if (idx === currentIndex) fillWidth = `${progress * 100}%`;

              return (
                <View key={story.id || idx} style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: fillWidth as any }]} />
                </View>
              );
            })}
          </View>

          {/* Header Info */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.75)', 'rgba(0, 0, 0, 0)']}
            style={styles.storyHeader}
          >
            <View style={styles.authorRow}>
              <Image source={{ uri: currentStory.userAvatar }} style={styles.avatar} />
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.authorName}>{currentStory.userName}</Text>
                  <View style={styles.idChip}>
                    <Text style={styles.idChipText}>ID: {currentStory.shareId}</Text>
                  </View>
                </View>
                <Text style={styles.timeText}>{currentStory.createdAt}</Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCopyStoryId}
                style={styles.storyIdCopyBtn}
              >
                <Feather name="copy" size={14} color="#FFFFFF" />
              </TouchableOpacity>

              {isVideo && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsMuted((prev) => !prev)}
                  style={styles.storyIdCopyBtn}
                >
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    size={16}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Story Media Canvas with Left/Right Tap zones */}
          <View
            style={styles.mediaContainer}
            // @ts-ignore
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {isVideo ? (
              Platform.OS === 'web' ? (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={() => {
                    if (videoRef.current && videoRef.current.duration) {
                      setProgress(videoRef.current.currentTime / videoRef.current.duration);
                    }
                  }}
                  onEnded={handleNext}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : null
            ) : (
              <Image
                source={{ uri: currentStory.mediaUrl }}
                // @ts-ignore
                style={[
                  styles.storyImage,
                  Platform.OS === 'web' &&
                    filterObj.id !== 'normal' &&
                    ({ filter: filterObj.cssFilter } as any),
                ]}
                resizeMode="cover"
              />
            )}

            {/* Left Tap Zone */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handlePrev}
              style={[styles.tapZone, styles.tapZoneLeft]}
            />

            {/* Right Tap Zone */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleNext}
              style={[styles.tapZone, styles.tapZoneRight]}
            />

            {/* Caption Overlay */}
            {currentStory.caption && (
              <View style={styles.captionOverlay}>
                <Text style={styles.captionText}>{currentStory.caption}</Text>
              </View>
            )}
          </View>

          {/* Bottom Quick Reply & Reactions */}
          <View style={styles.bottomBar}>
            <View style={styles.replyInputBox}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder={`Reply to ${currentStory.userName}...`}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                style={styles.replyInput}
                onSubmitEditing={handleSendReply}
              />
              <TouchableOpacity activeOpacity={0.7} onPress={handleSendReply} style={styles.sendReplyBtn}>
                <Feather name="send" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.emojisRow}>
              {[
                { name: 'heart', icon: 'heart', color: '#FF4D6D', label: 'Heart' },
                { name: 'flame', icon: 'flame', color: '#F97316', label: 'Fire' },
                { name: 'rocket', icon: 'rocket', color: '#8B5CF6', label: 'Rocket' },
                { name: 'sparkles', icon: 'sparkles', color: '#FBBF24', label: 'Sparkles' },
              ].map((reaction) => (
                <TouchableOpacity
                  key={reaction.name}
                  activeOpacity={0.7}
                  onPress={() => handleQuickReaction(reaction.label)}
                  style={styles.emojiBtn}
                >
                  <Ionicons name={reaction.icon as any} size={20} color={reaction.color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  storyCard: {
    width: '100%',
    maxWidth: 420,
    height: '92%',
    maxHeight: 740,
    backgroundColor: '#05030F',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    flexDirection: 'column',
  },
  progressBarsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: BRAND_COLORS.purplePrimary,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  idChip: {
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  idChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyIdCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#05030F',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  tapZone: {
    position: 'absolute',
    top: 60,
    bottom: 80,
    width: '40%',
    zIndex: 10,
  },
  tapZoneLeft: {
    left: 0,
  },
  tapZoneRight: {
    right: 0,
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    right: 14,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#05030F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  replyInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    paddingVertical: 2,
  },
  sendReplyBtn: {
    padding: 4,
  },
  emojisRow: {
    flexDirection: 'row',
    gap: 4,
  },
  emojiBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 16,
  },
});

export default StoryViewerModal;
