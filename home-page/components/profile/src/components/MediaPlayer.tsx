import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_COLORS } from '../constants/theme';

export interface MediaPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  aspectRatio?: number;
  autoPlay?: boolean;
  isMuted?: boolean;
  loop?: boolean;
  showControls?: boolean;
  title?: string;
  onCloseFullscreen?: () => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  videoUrl,
  posterUrl,
  aspectRatio = 9 / 16,
  autoPlay = true,
  isMuted: initialMuted = true,
  loop: initialLoop = true,
  showControls = true,
  title,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(0.8);
  const [isLooping, setIsLooping] = useState(initialLoop);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimer = useRef<any>(null);

  // Auto-hide controls during playback
  const showControlsTemporarily = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log('Autoplay play error:', err);
            // Fallback muted play
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true));
            }
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
    showControlsTemporarily();
  };

  const toggleMute = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && videoRef.current.volume === 0) {
        videoRef.current.volume = 0.8;
        setVolume(0.8);
      }
    } else {
      setIsMuted((prev) => !prev);
    }
    showControlsTemporarily();
  };

  const toggleLoop = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      videoRef.current.loop = !isLooping;
    }
    setIsLooping((prev) => !prev);
    showControlsTemporarily();
  };

  const toggleFullscreen = () => {
    if (Platform.OS === 'web' && containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
      if (videoRef.current.buffered.length > 0) {
        const bufEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered(bufEnd);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      setDuration(videoRef.current.duration);
      if (autoPlay) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true));
            }
          });
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Platform.OS === 'web' && videoRef.current && progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = pct * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      showControlsTemporarily();
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <View style={[styles.playerContainer, { aspectRatio: isFullscreen ? undefined : aspectRatio }]}>
      {/* Web HTML5 Video Container */}
      {Platform.OS === 'web' ? (
        // @ts-ignore
        <div
          ref={containerRef}
          onMouseMove={showControlsTemporarily}
          onClick={togglePlayPause}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#05050A',
            borderRadius: isFullscreen ? 0 : 18,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {/* Real Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            playsInline
            muted={isMuted}
            loop={isLooping}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setHasError(true)}
            onEnded={() => {
              if (!isLooping) setIsPlaying(false);
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: '#05050A',
            }}
          />

          {/* Top Header info overlay */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '14px 16px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              opacity: controlsVisible ? 1 : 0,
              transition: 'opacity 0.25s ease',
              pointerEvents: controlsVisible ? 'auto' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: 'rgba(124, 58, 237, 0.85)',
                  color: '#FFFFFF',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                LIVE CLIP
              </span>
              {title ? (
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    maxWidth: 240,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </span>
              ) : null}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Loop badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLoop();
                }}
                style={{
                  background: isLooping ? 'rgba(124, 58, 237, 0.8)' : 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: 14,
                  padding: '5px 10px',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                Loop {isLooping ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Large Center Play/Pause Indicator (Fades out when playing) */}
          {(!isPlaying || controlsVisible) && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(124, 58, 237, 0.82)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                opacity: !isPlaying ? 1 : controlsVisible ? 0.75 : 0,
                transition: 'opacity 0.2s ease, transform 0.15s ease',
                pointerEvents: 'none',
              }}
            >
              {isPlaying ? (
                <Ionicons name="pause" size={32} color="#FFFFFF" />
              ) : (
                <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </div>
          )}

          {/* Bottom Custom Media Player Controls Bar */}
          {showControls && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0) 100%)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: controlsVisible ? 1 : 0,
                transition: 'opacity 0.25s ease',
                pointerEvents: controlsVisible ? 'auto' : 'none',
              }}
            >
              {/* Interactive Progress Bar */}
              <div
                ref={progressBarRef}
                onClick={handleSeek}
                style={{
                  width: '100%',
                  height: 14,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Track background */}
                <div
                  style={{
                    width: '100%',
                    height: 5,
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Buffer progress */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${bufferedPct}%`,
                      backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      borderRadius: 3,
                    }}
                  />
                  {/* Play progress fill */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #EC4899, #8B5CF6, #7C3AED)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                {/* Scrubber thumb knob */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${progressPct}%`,
                    transform: 'translateX(-50%)',
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 0 6px rgba(124, 58, 237, 0.8)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Bottom Buttons: Play/Pause, Time, Mute, Fullscreen */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Left group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Play/Pause */}
                  <button
                    onClick={togglePlayPause}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                    }}
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
                  </button>

                  {/* Sound / Mute */}
                  <button
                    onClick={toggleMute}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isMuted ? '#EF4444' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                    }}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    <Ionicons
                      name={
                        isMuted
                          ? 'volume-mute'
                          : volume > 0.5
                          ? 'volume-high'
                          : 'volume-low'
                      }
                      size={20}
                      color={isMuted ? '#FF4D6D' : '#FFFFFF'}
                    />
                  </button>

                  {/* Time display */}
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontSize: 12,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Fullscreen button */}
                  <button
                    onClick={toggleFullscreen}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                    }}
                    title="Fullscreen"
                  >
                    <Feather
                      name={isFullscreen ? 'minimize' : 'maximize'}
                      size={18}
                      color="#FFFFFF"
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Mobile / Native fallback
        <View style={styles.nativeWrapper}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.nativePoster} resizeMode="cover" />
          ) : (
            <View style={styles.nativePlaceholder}>
              <Ionicons name="videocam" size={44} color={BRAND_COLORS.purplePrimary} />
            </View>
          )}
          <TouchableOpacity activeOpacity={0.8} onPress={togglePlayPause} style={styles.nativeCenterPlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    width: '100%',
    maxHeight: 520,
    backgroundColor: '#05050A',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  nativeWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  nativePoster: {
    width: '100%',
    height: '100%',
  },
  nativePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D091A',
  },
  nativeCenterPlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MediaPlayer;
