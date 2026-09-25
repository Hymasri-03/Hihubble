import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { HubPost, ThemeMode } from '../types/profile';

export interface ClipsGridProps {
  clips: HubPost[];
  themeMode: ThemeMode;
  onPressClip?: (clip: HubPost) => void;
  onToggleLike?: (clip: HubPost) => void;
  onToggleSave?: (clip: HubPost) => void;
  onShareClip?: (clip: HubPost) => void;
}

interface ClipCardProps {
  clip: HubPost;
  themeMode: ThemeMode;
  onToggleLike?: (clip: HubPost) => void;
  onToggleSave?: (clip: HubPost) => void;
  onShareClip?: (clip: HubPost) => void;
  onPressClip?: (clip: HubPost) => void;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, themeMode, onToggleLike, onToggleSave, onShareClip }) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
      setIsPlaying(p => !p);
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
      setIsMuted(p => !p);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const aspectRatio = clip.aspectRatio || (9 / 16);

  return (
    <View style={[styles.cardWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {/* HEADER */}
      <View style={styles.cardHeader}>
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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={e => { (e as any)?.stopPropagation?.(); onToggleSave?.(clip); }}
            style={[styles.headerIconBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
          >
            <Ionicons
              name={clip.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={clip.isSaved ? '#10B981' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={e => { (e as any)?.stopPropagation?.(); onShareClip?.(clip); }}
            style={[styles.headerIconBtn, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}
          >
            <Ionicons name="paper-plane-outline" size={13} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* VIDEO PLAYER */}
      <View style={[styles.videoWrapper, { aspectRatio }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#05030F', overflow: 'hidden' }}>
            {/* key forces video element remount when src changes */}
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
            {/* Gradient scrim */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />
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
            {/* Idle big play button */}
            {!isPlaying && !showCenterIcon && (
              // @ts-ignore
              <div
                onClick={handleTogglePlay}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 54, height: 54, borderRadius: 27,
                  backgroundColor: 'rgba(124,58,237,0.88)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
                  zIndex: 6,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M8 5v14l11-7z" /></svg>
              </div>
            )}
            {/* Clickable overlay when playing */}
            {isPlaying && (
              // @ts-ignore
              <div onClick={handleTogglePlay} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer', zIndex: 5 }} />
            )}
            {/* Bottom controls */}
            <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 7 }}>
              {duration > 0 ? (
                <span style={{ color: '#FFFFFF', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.55)', padding: '3px 8px', borderRadius: '8px', backdropFilter: 'blur(6px)' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              ) : <span />}
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
            {/* Error state */}
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

      {/* CAPTION & ACTIONS */}
      <View style={styles.cardFooter}>
        {clip.caption ? <Text style={[styles.captionText, { color: colors.textPrimary }]} numberOfLines={2}>{clip.caption}</Text> : null}
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
        <View style={styles.actionsRow}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => onToggleLike?.(clip)} style={styles.actionItem}>
            <Ionicons name={clip.isLiked ? 'heart' : 'heart-outline'} size={20} color={clip.isLiked ? '#FF4D6D' : colors.textSecondary} />
            <Text style={[styles.actionCount, { color: clip.isLiked ? '#FF4D6D' : colors.textSecondary }]}>{clip.likes || 0}</Text>
          </TouchableOpacity>
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
          <TouchableOpacity activeOpacity={0.7} onPress={handleToggleMute} style={styles.actionItem}>
            <Ionicons name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {clip.createdAt ? <Text style={[styles.timeText, { color: colors.textMuted }]}>{clip.createdAt}</Text> : null}
      </View>
    </View>
  );
};

export const ClipsGrid = ({ clips, themeMode, onPressClip, onToggleLike, onToggleSave, onShareClip }: ClipsGridProps) => {
  if (clips.length === 0) return null;
  return (
    <View style={styles.container}>
      {clips.map(clip => (
        <ClipCard
          key={clip.id}
          clip={clip}
          themeMode={themeMode}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          onShareClip={onShareClip}
          onPressClip={onPressClip}
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
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
  headerIconBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  videoWrapper: { width: '100%', backgroundColor: '#05030F', position: 'relative', overflow: 'hidden' },
  nativeVideoBox: { flex: 1, backgroundColor: '#05030F', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  nativeDarkBg: { backgroundColor: '#0A0820' },
  nativePlayBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(124,58,237,0.88)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 6,
  },
  centerIconCircle: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(124,58,237,0.88)',
    alignItems: 'center', justifyContent: 'center',
    top: '50%', left: '50%',
    marginTop: -30, marginLeft: -30,
    zIndex: 10,
  },
  cardFooter: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 12, gap: 6 },
  captionText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10.5, color: BRAND_COLORS.purplePrimary, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { fontSize: 13, fontWeight: '700' },
  playPauseBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, marginLeft: 'auto' },
  playPauseBtnText: { fontSize: 12.5, fontWeight: '700' },
  timeText: { fontSize: 11, marginTop: 2 },
});

export default ClipsGrid;
