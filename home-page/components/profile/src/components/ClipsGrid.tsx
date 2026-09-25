import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Image,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { HubPost, ThemeMode, UserProfile, CommentItem } from '../types/profile';

export interface ClipsGridProps {
  clips: HubPost[];
  themeMode: ThemeMode;
  user?: UserProfile;
  onPressClip?: (clip: HubPost) => void;
  onToggleLike?: (clip: HubPost) => void;
  onToggleSave?: (clip: HubPost) => void;
  onShareClip?: (clip: HubPost) => void;
  onUpdateClip?: (updated: HubPost) => void;
  onEditClip?: (clip: HubPost, newCaption: string) => void;
  onDeleteClip?: (clipId: string) => void;
}

interface ClipCardProps {
  clip: HubPost;
  themeMode: ThemeMode;
  user?: UserProfile;
  onToggleLike?: (clip: HubPost) => void;
  onToggleSave?: (clip: HubPost) => void;
  onShareClip?: (clip: HubPost) => void;
  onPressClip?: (clip: HubPost) => void;
  onUpdateClip?: (updated: HubPost) => void;
  onEditClip?: (clip: HubPost, newCaption: string) => void;
  onDeleteClip?: (clipId: string) => void;
}

const POPULAR_CLIP_TAGS = [
  '#HubClips',
  '#Cosmic',
  '#SpaceVibes',
  '#HiHubble',
  '#Cinematic',
  '#Stargazer',
  '#RocketLaunch',
];

const ASPECT_RATIO_OPTIONS = [
  { id: '9:16', ratio: 9 / 16, label: 'Vertical 9:16', icon: 'phone-portrait-outline' as const },
  { id: '1:1', ratio: 1, label: 'Square 1:1', icon: 'square-outline' as const },
  { id: '16:9', ratio: 16 / 9, label: 'Wide 16:9', icon: 'tv-outline' as const },
];

const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  themeMode,
  user,
  onToggleLike,
  onToggleSave,
  onShareClip,
  onPressClip,
  onUpdateClip,
  onEditClip,
  onDeleteClip,
}) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const iconScaleAnim = useRef(new Animated.Value(0.6)).current;
  const iconOpacityAnim = useRef(new Animated.Value(0)).current;
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [centerIconType, setCenterIconType] = useState<'play' | 'pause'>('play');

  // Menu, Edit & Comments state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Edit form state
  const [editCaption, setEditCaption] = useState(clip.caption || '');
  const [editHashtags, setEditHashtags] = useState<string[]>(clip.hashtags || ['#HubClips']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [editAspectRatio, setEditAspectRatio] = useState(clip.aspectRatio || 9 / 16);
  const [editAllowComments, setEditAllowComments] = useState(clip.allowComments !== false);

  // Synchronize internal state if clip props change
  useEffect(() => {
    setEditCaption(clip.caption || '');
    setEditHashtags(clip.hashtags || ['#HubClips']);
    setEditAspectRatio(clip.aspectRatio || 9 / 16);
    setEditAllowComments(clip.allowComments !== false);
  }, [clip.id, clip.caption, clip.hashtags, clip.aspectRatio, clip.allowComments]);

  const commentsList: CommentItem[] = clip.commentsList || [];

  const handleOpenMenu = (e?: any) => {
    e?.stopPropagation?.();
    setMenuOpen((prev) => !prev);
  };

  const handleStartEdit = (e?: any) => {
    e?.stopPropagation?.();
    setEditCaption(clip.caption || '');
    setEditHashtags(clip.hashtags || ['#HubClips']);
    setEditAspectRatio(clip.aspectRatio || 9 / 16);
    setEditAllowComments(clip.allowComments !== false);
    setIsEditing(true);
    setMenuOpen(false);
  };

  const handleToggleHashtag = (tag: string) => {
    if (editHashtags.includes(tag)) {
      setEditHashtags((prev) => prev.filter((t) => t !== tag));
    } else {
      setEditHashtags((prev) => [...prev, tag]);
    }
  };

  const handleAddCustomTag = () => {
    let clean = customTagInput.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = `#${clean}`;
    if (!editHashtags.includes(clean)) {
      setEditHashtags((prev) => [...prev, clean]);
    }
    setCustomTagInput('');
  };

  const handleSaveEdit = () => {
    const trimmedCaption = editCaption.trim();
    const updatedPost: HubPost = {
      ...clip,
      caption: trimmedCaption || 'Video clip on Hi-Hubble',
      hashtags: editHashtags.length > 0 ? editHashtags : undefined,
      aspectRatio: editAspectRatio,
      allowComments: editAllowComments,
    };

    onUpdateClip?.(updatedPost);
    onEditClip?.(clip, trimmedCaption);
    setIsEditing(false);
    Alert.alert('HubClip Updated', 'Your changes to this video clip have been saved successfully.');
  };

  const handleCancelEdit = () => {
    setEditCaption(clip.caption || '');
    setEditHashtags(clip.hashtags || ['#HubClips']);
    setEditAspectRatio(clip.aspectRatio || 9 / 16);
    setEditAllowComments(clip.allowComments !== false);
    setIsEditing(false);
  };

  const handleDelete = (e?: any) => {
    e?.stopPropagation?.();
    setMenuOpen(false);
    Alert.alert(
      'Delete Video Clip',
      'Are you sure you want to permanently delete this HubClip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsEditing(false);
            onDeleteClip?.(clip.id);
          },
        },
      ]
    );
  };

  // Add comment directly on the clip
  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      user: user?.name || 'Hymasri',
      avatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      text: trimmed,
      time: 'Just now',
    };

    const updatedComments = [newComment, ...commentsList];
    const updatedPost: HubPost = {
      ...clip,
      comments: updatedComments.length,
      commentsList: updatedComments,
    };

    onUpdateClip?.(updatedPost);
    setCommentText('');
  };

  const triggerCenterIcon = (type: 'play' | 'pause') => {
    setCenterIconType(type);
    setShowCenterIcon(true);
    iconScaleAnim.setValue(0.6);
    iconOpacityAnim.setValue(1);
    Animated.parallel([
      Animated.spring(iconScaleAnim, { toValue: 1.1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(iconOpacityAnim, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start(() => setShowCenterIcon(false));
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const vid = videoRef.current;
    if (!vid) return;
    const onTimeUpdate = () => {
      if (vid.duration && !isNaN(vid.duration)) {
        setCurrentTime(vid.currentTime);
        setDuration(vid.duration);
        setProgress(vid.currentTime / vid.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);
    const onError = () => setVideoError(true);
    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('ended', onEnded);
    vid.addEventListener('error', onError);
    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('ended', onEnded);
      vid.removeEventListener('error', onError);
    };
  }, [clip.imageUrl]);

  const handleTogglePlay = (e?: any) => {
    e?.stopPropagation?.();
    if (Platform.OS === 'web' && videoRef.current) {
      const vid = videoRef.current;
      if (vid.paused || vid.ended) {
        vid.play().then(() => { setIsPlaying(true); triggerCenterIcon('play'); }).catch(() => {
          vid.muted = true; setIsMuted(true);
          vid.play().then(() => { setIsPlaying(true); triggerCenterIcon('play'); });
        });
      } else {
        vid.pause(); setIsPlaying(false); triggerCenterIcon('pause');
      }
    } else {
      setIsPlaying((p) => !p);
      triggerCenterIcon(isPlaying ? 'pause' : 'play');
    }
  };

  const handleToggleMute = (e?: any) => {
    e?.stopPropagation?.();
    if (Platform.OS === 'web' && videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    } else {
      setIsMuted((p) => !p);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const currentRatio = isEditing ? editAspectRatio : clip.aspectRatio || 9 / 16;

  return (
    <View style={[styles.cardWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {/* 1. CARD HEADER */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.headerBadge}>
          <Ionicons name="film" size={11} color="#FFFFFF" />
          <Text style={styles.headerBadgeText}>HubClip</Text>
        </View>

        {clip.shareId ? (
          <View style={[styles.shareIdBadge, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
            <Text style={[styles.shareIdText, { color: BRAND_COLORS.purplePrimary }]}>#{clip.shareId}</Text>
          </View>
        ) : null}

        <View style={styles.headerRightActions}>
          {/* Quick Edit Icon */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleStartEdit}
            style={[
              styles.headerIconBtn,
              isEditing
                ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                : { backgroundColor: colors.statCardBg, borderColor: colors.border },
            ]}
            accessibilityLabel="Edit Video Clip"
          >
            <Feather
              name="edit-2"
              size={13}
              color={isEditing ? '#FFFFFF' : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Bookmark Save */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              (e as any)?.stopPropagation?.();
              onToggleSave?.(clip);
            }}
            style={[styles.headerIconBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
            accessibilityLabel="Save HubClip"
          >
            <Ionicons
              name={clip.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={clip.isSaved ? '#10B981' : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              (e as any)?.stopPropagation?.();
              onShareClip?.(clip);
            }}
            style={[styles.headerIconBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
            accessibilityLabel="Share Video"
          >
            <Ionicons name="paper-plane-outline" size={13} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* 3-dots Menu for Edit / Delete */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenMenu}
            style={[
              styles.headerIconBtn,
              menuOpen
                ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                : { backgroundColor: colors.statCardBg, borderColor: colors.border },
            ]}
            accessibilityLabel="Clip Options"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={14}
              color={menuOpen ? '#FFFFFF' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* FLOATING ACTION DROPDOWN MENU */}
      {menuOpen && (
        <View
          style={[
            styles.menuDropdown,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              shadowColor: '#000',
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleStartEdit}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
          >
            <Feather name="edit-2" size={14} color={BRAND_COLORS.purplePrimary} />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Edit Video HubClip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setMenuOpen(false);
              setIsCommentsOpen((prev) => !prev);
            }}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#0EA5E9" />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
              {isCommentsOpen ? 'Hide Comments' : `View Comments (${commentsList.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              setMenuOpen(false);
              onShareClip?.(clip);
            }}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
          >
            <Ionicons name="share-social-outline" size={14} color="#10B981" />
            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>Share HubClip Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleDelete}
            style={[styles.menuItem, styles.menuItemDelete]}
          >
            <Feather name="trash-2" size={14} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444', fontWeight: '700' }]}>Delete Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. VIDEO PLAYER CANVAS */}
      <View style={[styles.videoWrapper, { aspectRatio: currentRatio }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#05030F', overflow: 'hidden' }}>
            <video
              key={clip.imageUrl}
              // @ts-ignore
              ref={videoRef}
              src={clip.imageUrl}
              muted={isMuted}
              playsInline
              loop
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Gradient Scrim */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />

            {/* Animated center indicator */}
            {showCenterIcon && (
              <Animated.View
                // @ts-ignore
                style={[styles.centerIconCircle, { opacity: iconOpacityAnim, transform: [{ scale: iconScaleAnim }] }]}
                pointerEvents="none"
              >
                <Ionicons name={centerIconType === 'play' ? 'play' : 'pause'} size={30} color="#FFFFFF" />
              </Animated.View>
            )}

            {/* Center Play Button when paused */}
            {!isPlaying && !showCenterIcon && (
              // @ts-ignore
              <div
                onClick={handleTogglePlay}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(124,58,237,0.88)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 22px rgba(124,58,237,0.55)',
                  zIndex: 6,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}

            {/* Clickable overlay when playing */}
            {isPlaying && (
              // @ts-ignore
              <div onClick={handleTogglePlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer', zIndex: 5 }} />
            )}

            {/* Bottom time & mute controls */}
            <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 7 }}>
              {duration > 0 ? (
                <span style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.55)', padding: '3px 8px', borderRadius: '8px', backdropFilter: 'blur(6px)' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              ) : (
                <span />
              )}
              {/* @ts-ignore */}
              <button
                onClick={handleToggleMute}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                )}
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 7 }}>
              <div style={{ height: '100%', width: (progress * 100) + '%', backgroundColor: '#8B5CF6', transition: 'width 0.1s linear' }} />
            </div>

            {videoError && (
              // @ts-ignore
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,8,21,0.9)' }}>
                <div style={{ color: '#FFFFFF', fontSize: 13, opacity: 0.7, textAlign: 'center', padding: '0 20px' }}>Video unavailable</div>
              </div>
            )}
          </div>
        ) : (
          <TouchableOpacity activeOpacity={0.85} onPress={handleTogglePlay} style={styles.nativeVideoBox}>
            {clip.imageUrl ? (
              <Image source={{ uri: clip.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.nativeDarkBg]} />
            )}
            <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
            <View style={styles.nativePlayBtn}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. INLINE EDIT PANEL (When isEditing is true) */}
      {isEditing ? (
        <View style={[styles.inlineEditPanel, { backgroundColor: colors.statCardBg, borderTopColor: colors.border }]}>
          <View style={styles.inlineEditHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="edit-3" size={15} color={BRAND_COLORS.purplePrimary} />
              <Text style={[styles.inlineEditTitle, { color: colors.textPrimary }]}>Edit Video HubClip</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={handleCancelEdit} style={styles.inlineEditCloseBtn}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Edit Caption */}
          <View style={styles.editFieldGroup}>
            <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>Video Caption</Text>
            <TextInput
              value={editCaption}
              onChangeText={setEditCaption}
              multiline
              numberOfLines={3}
              placeholder="Enter updated video caption..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.editCaptionInput,
                { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.textPrimary },
              ]}
            />
          </View>

          {/* Edit Hashtags */}
          <View style={styles.editFieldGroup}>
            <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>Hashtags</Text>
            {editHashtags.length > 0 && (
              <View style={styles.activeTagsRow}>
                {editHashtags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    activeOpacity={0.7}
                    onPress={() => handleToggleHashtag(tag)}
                    style={styles.activeTagBadge}
                  >
                    <Text style={styles.activeTagText}>{tag}</Text>
                    <Ionicons name="close-circle" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.addCustomTagRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Feather name="hash" size={13} color={BRAND_COLORS.purplePrimary} />
              <TextInput
                value={customTagInput}
                onChangeText={setCustomTagInput}
                onSubmitEditing={handleAddCustomTag}
                placeholder="Add hashtag..."
                placeholderTextColor={colors.textMuted}
                style={[styles.customTagInput, { color: colors.textPrimary }]}
                returnKeyType="done"
              />
              <TouchableOpacity activeOpacity={0.7} onPress={handleAddCustomTag} style={styles.addTagSmallBtn}>
                <Text style={styles.addTagSmallBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedTagsScroll}>
              {POPULAR_CLIP_TAGS.map((tag) => {
                const isSelected = editHashtags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    activeOpacity={0.7}
                    onPress={() => handleToggleHashtag(tag)}
                    style={[
                      styles.suggestedTagChip,
                      {
                        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.15)' : colors.cardBg,
                        borderColor: isSelected ? BRAND_COLORS.purplePrimary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestedTagChipText,
                        { color: isSelected ? BRAND_COLORS.purplePrimary : colors.textSecondary },
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Aspect Ratio Format */}
          <View style={styles.editFieldGroup}>
            <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>Aspect Ratio</Text>
            <View style={styles.aspectRatioChipsRow}>
              {ASPECT_RATIO_OPTIONS.map((opt) => {
                const isSelected = Math.abs(editAspectRatio - opt.ratio) < 0.05;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setEditAspectRatio(opt.ratio)}
                    style={[
                      styles.ratioChip,
                      {
                        backgroundColor: isSelected ? BRAND_COLORS.purplePrimary : colors.cardBg,
                        borderColor: isSelected ? BRAND_COLORS.purplePrimary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={13}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.ratioChipText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Allow Comments Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setEditAllowComments((prev) => !prev)}
            style={[
              styles.editCommentToggleRow,
              { backgroundColor: colors.cardBg, borderColor: editAllowComments ? BRAND_COLORS.purplePrimary : colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.editToggleLabel, { color: colors.textPrimary }]}>Allow Comments</Text>
              <Text style={[styles.editToggleSub, { color: colors.textMuted }]}>
                {editAllowComments ? 'Comments are enabled for this clip' : 'Comments are turned off'}
              </Text>
            </View>
            <View
              style={[
                styles.miniToggleTrack,
                { backgroundColor: editAllowComments ? BRAND_COLORS.purplePrimary : (themeMode === 'light' ? '#E5E7EB' : '#374151') },
              ]}
            >
              <View
                style={[
                  styles.miniToggleThumb,
                  editAllowComments ? styles.miniToggleThumbActive : styles.miniToggleThumbInactive,
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Action Buttons: Delete Video, Cancel, Save */}
          <View style={styles.inlineEditActionsRow}>
            {/* DELETE VIDEO OPTION */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDelete}
              style={[styles.deleteClipBtn, { borderColor: '#EF4444' }]}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
              <Text style={styles.deleteClipBtnText}>Delete Video</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCancelEdit}
                style={[styles.cancelEditBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelEditBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveEdit}
                style={styles.saveEditBtnWrapper}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveEditBtn}
                >
                  <Feather name="check" size={14} color="#FFFFFF" />
                  <Text style={styles.saveEditBtnText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* 4. NORMAL CARD FOOTER */
        <View style={styles.cardFooter}>
          {clip.caption ? (
            <Text style={[styles.captionText, { color: colors.textPrimary }]} numberOfLines={2}>
              {clip.caption}
            </Text>
          ) : null}

          {clip.hashtags && clip.hashtags.length > 0 && (
            <View style={styles.tagsRow}>
              {clip.hashtags.map((tag, idx) => (
                <View key={idx} style={[styles.tagBadge, { backgroundColor: colors.statCardBg }]}>
                  <Feather name="hash" size={9} color={BRAND_COLORS.purplePrimary} />
                  <Text style={styles.tagText}>{tag.replace(/^#/, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Row */}
          <View style={styles.actionsRow}>
            {/* LIKE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onToggleLike?.(clip)}
              style={styles.actionItem}
              accessibilityLabel="Like Clip"
            >
              <Ionicons
                name={clip.isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={clip.isLiked ? '#FF4D6D' : colors.textSecondary}
              />
              <Text style={[styles.actionCount, { color: clip.isLiked ? '#FF4D6D' : colors.textSecondary }]}>
                {clip.likes || 0}
              </Text>
            </TouchableOpacity>

            {/* COMMENT BUTTON */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCommentsOpen((prev) => !prev)}
              style={[
                styles.actionItem,
                isCommentsOpen && styles.actionItemActive,
              ]}
              accessibilityLabel="HubClip Comments"
            >
              <Ionicons
                name={isCommentsOpen ? 'chatbubble' : 'chatbubble-outline'}
                size={18}
                color={isCommentsOpen ? BRAND_COLORS.purplePrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionCount,
                  { color: isCommentsOpen ? BRAND_COLORS.purplePrimary : colors.textSecondary },
                ]}
              >
                {commentsList.length}
              </Text>
            </TouchableOpacity>

            {/* EDIT BUTTON DIRECT */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleStartEdit}
              style={styles.actionItem}
              accessibilityLabel="Edit HubClip"
            >
              <Feather name="edit-2" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* DELETE BUTTON DIRECT */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDelete}
              style={styles.actionItem}
              accessibilityLabel="Delete Video"
            >
              <Feather name="trash-2" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* PLAY / PAUSE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleTogglePlay}
              style={[
                styles.playPauseBtn,
                isPlaying
                  ? { backgroundColor: BRAND_COLORS.purplePrimary }
                  : { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={14}
                color={isPlaying ? '#FFFFFF' : colors.textPrimary}
                style={!isPlaying ? { marginLeft: 1 } : undefined}
              />
              <Text style={[styles.playPauseBtnText, { color: isPlaying ? '#FFFFFF' : colors.textPrimary }]}>
                {isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>

            {/* MUTE / UNMUTE BUTTON */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleMute}
              style={styles.actionItem}
              accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
            >
              <Ionicons
                name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {clip.createdAt ? (
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{clip.createdAt}</Text>
          ) : null}
        </View>
      )}

      {/* 5. COMMENTS SECTION (When isCommentsOpen is true) */}
      {isCommentsOpen && (
        <View style={[styles.commentsContainer, { backgroundColor: colors.statCardBg, borderTopColor: colors.border }]}>
          <View style={styles.commentsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chatbubbles" size={15} color={BRAND_COLORS.purplePrimary} />
              <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
                Comments ({commentsList.length})
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCommentsOpen(false)}
              style={styles.closeCommentsBtn}
            >
              <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {clip.allowComments === false ? (
            <View style={[styles.commentsDisabledNotice, { backgroundColor: colors.cardBg }]}>
              <Feather name="lock" size={14} color={colors.textMuted} />
              <Text style={[styles.commentsDisabledText, { color: colors.textMuted }]}>
                Comments are disabled for this video clip.
              </Text>
            </View>
          ) : (
            <>
              {/* Comments List */}
              {commentsList.length > 0 ? (
                <View style={styles.commentsList}>
                  {commentsList.map((c) => (
                    <View key={c.id} style={styles.commentItemRow}>
                      <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                      <View style={[styles.commentBubble, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <View style={styles.commentItemHeader}>
                          <Text style={[styles.commentAuthorName, { color: colors.textPrimary }]}>
                            {c.user}
                          </Text>
                          {c.isPinned && (
                            <View style={styles.pinnedBadge}>
                              <Ionicons name="pin" size={9} color="#F59E0B" />
                              <Text style={styles.pinnedBadgeText}>Pinned</Text>
                            </View>
                          )}
                          <Text style={[styles.commentItemTime, { color: colors.textMuted }]}>
                            {c.time}
                          </Text>
                        </View>
                        <Text style={[styles.commentItemText, { color: colors.textPrimary }]}>
                          {c.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCommentsBox}>
                  <Text style={[styles.emptyCommentsText, { color: colors.textMuted }]}>
                    No comments yet on this HubClip. Be the first to start the cosmic discussion!
                  </Text>
                </View>
              )}

              {/* Add Comment Input Row */}
              <View style={[styles.addCommentInputRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Image
                  source={{
                    uri:
                      user?.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
                  }}
                  style={styles.inputUserAvatar}
                />
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  onSubmitEditing={handleAddComment}
                  placeholder="Add a comment on this clip..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.commentTextInput, { color: colors.textPrimary }]}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddComment}
                  disabled={!commentText.trim()}
                  style={[
                    styles.postCommentBtn,
                    {
                      backgroundColor: commentText.trim() ? BRAND_COLORS.purplePrimary : (themeMode === 'light' ? '#E5E7EB' : '#374151'),
                      opacity: commentText.trim() ? 1 : 0.6,
                    },
                  ]}
                >
                  <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export const ClipsGrid: React.FC<ClipsGridProps> = ({
  clips,
  themeMode,
  user,
  onPressClip,
  onToggleLike,
  onToggleSave,
  onShareClip,
  onUpdateClip,
  onEditClip,
  onDeleteClip,
}) => {
  if (clips.length === 0) return null;

  return (
    <View style={styles.container}>
      {clips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          themeMode={themeMode}
          user={user}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          onShareClip={onShareClip}
          onPressClip={onPressClip}
          onUpdateClip={onUpdateClip}
          onEditClip={onEditClip}
          onDeleteClip={onDeleteClip}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    gap: 4,
  },
  headerBadgeText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  shareIdBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, borderWidth: 1 },
  shareIdText: { fontSize: 10, fontWeight: '700' },
  headerRightActions: { marginLeft: 'auto', flexDirection: 'row', gap: 6 },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuDropdown: {
    position: 'absolute',
    top: 48,
    right: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 100,
    minWidth: 190,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuItemDelete: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  videoWrapper: { width: '100%', backgroundColor: '#05030F', position: 'relative', overflow: 'hidden' },
  nativeVideoBox: { flex: 1, backgroundColor: '#05030F', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  nativeDarkBg: { backgroundColor: '#0A0820' },
  nativePlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(124,58,237,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  centerIconCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124,58,237,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    zIndex: 10,
  },
  cardFooter: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 12, gap: 6 },
  captionText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10.5, color: BRAND_COLORS.purplePrimary, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionItemActive: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  actionCount: { fontSize: 13, fontWeight: '700' },
  playPauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  playPauseBtnText: { fontSize: 12.5, fontWeight: '700' },
  timeText: { fontSize: 11, marginTop: 2 },

  /* Inline Edit Section */
  inlineEditPanel: {
    padding: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  inlineEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineEditTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  inlineEditCloseBtn: {
    padding: 4,
  },
  editFieldGroup: {
    gap: 6,
  },
  editFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  editCaptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    lineHeight: 17,
  },
  activeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addCustomTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  customTagInput: {
    flex: 1,
    fontSize: 12,
  },
  addTagSmallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: BRAND_COLORS.purplePrimary,
    borderRadius: 6,
  },
  addTagSmallBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  suggestedTagsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  suggestedTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestedTagChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  aspectRatioChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratioChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editCommentToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editToggleLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  editToggleSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  miniToggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  miniToggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  miniToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  miniToggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  inlineEditActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
  },
  deleteClipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteClipBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelEditBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  cancelEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveEditBtnWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveEditBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Comments Section */
  commentsContainer: {
    padding: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentsTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeCommentsBtn: {
    padding: 4,
  },
  commentsDisabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  commentsDisabledText: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentsList: {
    gap: 8,
    maxHeight: 220,
  },
  commentItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 2,
  },
  commentBubble: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthorName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  pinnedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F59E0B',
  },
  commentItemTime: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  commentItemText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyCommentsBox: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
  },
  addCommentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  inputUserAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 2,
  },
  postCommentBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ClipsGrid;
