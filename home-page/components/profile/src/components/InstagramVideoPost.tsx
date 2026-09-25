import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BRAND_COLORS } from '../constants/theme';

export interface InstagramVideoPostProps {
  videoUrl: string;
  posterUrl?: string;
  aspectRatio?: number;
  autoPlay?: boolean;
  filter?: string;
  cssFilter?: string;
  filterColor?: string;
  onDoubleTap?: () => void;
  onPressExpand?: () => void;
}

export const InstagramVideoPost: React.FC<InstagramVideoPostProps> = ({
  videoUrl,
  posterUrl,
  aspectRatio = 1,
  autoPlay = false,
  filter = 'normal',
  cssFilter,
  filterColor,
  onDoubleTap,
  onPressExpand,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Animated Play/Pause indicator in center
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [centerIconType, setCenterIconType] = useState<'play' | 'pause'>('play');
  const iconScaleAnim = useRef(new Animated.Value(0.6)).current;
  const iconOpacityAnim = useRef(new Animated.Value(0)).current;

  // Double tap detection
  const lastTapRef = useRef<number>(0);
  const iconTimerRef = useRef<any>(null);

  const triggerCenterIndicator = (type: 'play' | 'pause') => {
    setCenterIconType(type);
    setShowCenterIcon(true);
    iconScaleAnim.setValue(0.6);
    iconOpacityAnim.setValue(1);

    Animated.parallel([
      Animated.spring(iconScaleAnim, {
        toValue: 1.15,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacityAnim, {
        toValue: 0,
        duration: 650,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCenterIcon(false);
    });
  };

  const togglePlayPause = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            triggerCenterIndicator('play');
          })
          .catch((err) => {
            console.log('Video play error:', err);
            // Fallback muted play
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => {
                setIsPlaying(true);
                triggerCenterIndicator('play');
              });
            }
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        triggerCenterIndicator('pause');
      }
    } else {
      setIsPlaying((prev) => !prev);
      triggerCenterIndicator(isPlaying ? 'pause' : 'play');
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap!
      onDoubleTap?.();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      togglePlayPause();
    }
  };

  const toggleMute = (e?: any) => {
    // @ts-ignore
    e?.stopPropagation?.();
    if (Platform.OS === 'web' && videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    } else {
      setIsMuted((prev) => !prev);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      const vid = videoRef.current;
      const onTimeUpdate = () => {
        if (vid.duration) {
          setCurrentTime(vid.currentTime);
          setDuration(vid.duration);
          setProgress(vid.currentTime / vid.duration);
        }
      };
      const onEnded = () => {
        setIsPlaying(false);
      };
      vid.addEventListener('timeupdate', onTimeUpdate);
      vid.addEventListener('ended', onEnded);
      return () => {
        vid.removeEventListener('timeupdate', onTimeUpdate);
        vid.removeEventListener('ended', onEnded);
      };
    }
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={[styles.container, { aspectRatio }]}>
      {Platform.OS === 'web' ? (
        <div
          onClick={handleTap}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: 'pointer',
            backgroundColor: '#05030F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            playsInline
            loop
            muted={isMuted}
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: cssFilter && filter !== 'normal' ? cssFilter : 'none',
              pointerEvents: 'none',
            }}
          />

          {/* Color filter overlay if applicable */}
          {filterColor && filterColor !== 'transparent' && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: filterColor,
                pointerEvents: 'none',
                mixBlendMode: 'color',
              }}
            />
          )}

          {/* Center Play/Pause Ripple Animation Indicator */}
          {showCenterIcon && (
            <Animated.View
              style={[
                styles.centerIconCircle,
                {
                  opacity: iconOpacityAnim,
                  transform: [{ scale: iconScaleAnim }],
                },
              ]}
              pointerEvents="none"
            >
              <Ionicons
                name={centerIconType === 'play' ? 'play' : 'pause'}
                size={34}
                color="#FFFFFF"
              />
            </Animated.View>
          )}

          {/* Idle Play Indicator if video is paused */}
          {!isPlaying && !showCenterIcon && (
            <div style={webStyles.idlePlayBadge}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}

          {/* Top Video Format Badge */}
          <div style={webStyles.topVideoBadge}>
            <span style={webStyles.videoBadgeText}>Video Post</span>
          </div>

          {/* Bottom Control Pill: Duration & Speaker Mute/Unmute */}
          <div style={webStyles.bottomControlsRow}>
            {duration > 0 && (
              <span style={webStyles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}

            <button
              onClick={toggleMute}
              style={webStyles.muteBtn}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          </div>

          {/* Sleek Bottom Video Progress Track */}
          <div style={webStyles.progressTrack}>
            <div
              style={{
                ...webStyles.progressFill,
                width: `${progress * 100}%`,
              }}
            />
          </div>
        </div>
      ) : (
        /* Native Fallback */
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={togglePlayPause}
          style={styles.nativeContainer}
        >
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.nativeCenterIcon}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const webStyles = {
  idlePlayBadge: {
    position: 'absolute' as const,
    width: '46px',
    height: '46px',
    borderRadius: '23px',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    pointerEvents: 'none' as const,
  },
  topVideoBadge: {
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    padding: '4px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none' as const,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.2px',
  },
  bottomControlsRow: {
    position: 'absolute' as const,
    bottom: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: '3px 7px',
    borderRadius: '8px',
    backdropFilter: 'blur(6px)',
  },
  muteBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  progressTrack: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    transition: 'width 0.1s linear',
  },
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#05030F',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  centerIconCircle: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    zIndex: 10,
  },
  nativeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeCenterIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InstagramVideoPost;
