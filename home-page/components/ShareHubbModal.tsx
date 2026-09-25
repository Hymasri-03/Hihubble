import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
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
  PanResponder,
  Modal,
  DimensionValue,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Rect, Path } from 'react-native-svg';

export interface HubbDraft {
  mediaUri: string;
  caption: string;
  scheduled: boolean;
  selectedTool?: string;
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale: number; // 0.4 - 3.5
  rotation: number; // -180 to 180
}

export const STICKER_CATEGORIES: Record<string, string[]> = {
  Popular: ['✨', '🔥', '💖', '🎉', '🌟', '👀', '💯', '🚀', '👑', '⚡', '🌈', '💎'],
  Vibes: ['😎', '🌸', '🌊', '🌴', '☕', '🌻', '🦋', '🥑', '🍕', '🍦', '🥥', '🌺'],
  Fun: ['😂', '🥳', '😜', '🤩', '👻', '👾', '🎈', '🎸', '🎮', '🛹', '🍿', '🧁'],
  Love: ['❤️', '💕', '🥰', '😍', '😘', '💌', '💐', '💍', '🧸', '😻', '💋', '💓'],
  Celebration: ['🎂', '🍾', '🎊', '🎁', '🏆', '⭐', '🎇', '🎆', '🥂', '🥇', '🍰', '🧁'],
  Animals: ['🐶', '🐱', '🐼', '🦁', '🦊', '🦄', '🐰', '🐨', '🐯', '🐧', '🐵', '🐸'],
};

export interface TextOverlay {
  id: string;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  rotation: number; // -180 to 180
  scale: number; // 0.5 - 3.0
}

export const TEXT_PALETTE_COLORS = [
  '#FFFFFF',
  '#000000',
  '#E5E7EB',
  '#EF4444',
  '#F97316',
  '#FACC15',
  '#22C55E',
  '#007AFF',
  '#7C3AED',
  '#F43F5E',
  '#06B6D4',
];

export const TEXT_FONTS = [
  'Default',
  'Bebas Neue',
  'Montserrat',
  'Playfair Display',
  'Pacifico',
  'Courier',
];

export const getFontFamilyStyle = (font: string) => {
  switch (font) {
    case 'Bebas Neue':
      return Platform.OS === 'web' ? "'Bebas Neue', sans-serif" : 'sans-serif-condensed';
    case 'Montserrat':
      return Platform.OS === 'web' ? "'Montserrat', sans-serif" : 'sans-serif';
    case 'Playfair Display':
      return Platform.OS === 'web' ? "'Playfair Display', serif" : 'serif';
    case 'Pacifico':
      return Platform.OS === 'web' ? "'Pacifico', cursive" : 'cursive';
    case 'Courier':
      return Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace';
    case 'Default':
    default:
      return undefined;
  }
};

export interface StoryMusicTrack {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  previewUrl: string;
  genre?: string;
  isDeviceAudio?: boolean;
}

// Global audio element reference for Web & mobile browsers
let globalWebAudio: any = null;
let isAudioUnlocked = false;

function getOrCreateAudioElement(): any {
  if (typeof document === 'undefined') return null;
  let audioEl = document.getElementById('hubb-global-audio-element') as any;
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = 'hubb-global-audio-element';
    audioEl.setAttribute('playsinline', 'true');
    audioEl.setAttribute('webkit-playsinline', 'true');
    audioEl.preload = 'auto';
    audioEl.style.display = 'none';
    document.body.appendChild(audioEl);
  }
  return audioEl;
}

function unlockMobileAudio() {
  if (isAudioUnlocked) return;
  const audio = getOrCreateAudioElement();
  if (audio) {
    audio.play().then(() => {
      audio.pause();
      isAudioUnlocked = true;
    }).catch(() => {});
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const handleUserGestureUnlock = () => {
    unlockMobileAudio();
    window.removeEventListener('touchstart', handleUserGestureUnlock);
    window.removeEventListener('touchend', handleUserGestureUnlock);
    window.removeEventListener('click', handleUserGestureUnlock);
  };
  window.addEventListener('touchstart', handleUserGestureUnlock, { passive: true, once: true });
  window.addEventListener('touchend', handleUserGestureUnlock, { passive: true, once: true });
  window.addEventListener('click', handleUserGestureUnlock, { once: true });
}

export const playAudioPreview = (url: string, loop = false): void => {
  if (typeof window === 'undefined') return;
  try {
    const audio = getOrCreateAudioElement();
    if (audio) {
      if (audio.src !== url) {
        audio.src = url;
        audio.load();
      }
      audio.loop = loop;
      audio.volume = 1.0;
      globalWebAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: any) => {
          // Autoplay policy prevented playback on mobile — retry on first user tap!
          const resumeOnTap = () => {
            audio.play().catch(() => {});
            window.removeEventListener('touchstart', resumeOnTap);
            window.removeEventListener('click', resumeOnTap);
          };
          window.addEventListener('touchstart', resumeOnTap, { passive: true, once: true });
          window.addEventListener('click', resumeOnTap, { once: true });
        });
      }
    } else {
      if (globalWebAudio) {
        globalWebAudio.pause();
      }
      globalWebAudio = new (window as any).Audio(url);
      globalWebAudio.loop = loop;
      globalWebAudio.volume = 1.0;
      globalWebAudio.play().catch(() => {});
    }
  } catch (err) {
    console.log('Audio init notice:', err);
  }
};

export const pauseAudioPreview = (): void => {
  try {
    const audio = getOrCreateAudioElement();
    if (audio) {
      audio.pause();
    }
    if (globalWebAudio) {
      globalWebAudio.pause();
    }
  } catch (err) {
    console.log('Audio pause notice:', err);
  }
};

export const stopAudioPreview = (): void => {
  try {
    const audio = getOrCreateAudioElement();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (globalWebAudio) {
      globalWebAudio.pause();
      try { globalWebAudio.currentTime = 0; } catch (_) {}
      globalWebAudio = null;
    }
  } catch (err) {
    console.log('Audio stop notice:', err);
  }
};

export const MUSIC_GENRES = [
  '#lo-fi',
  '#pop',
  '#hip hop',
  '#chill',
  '#synthwave',
  '#acoustic',
  '#trending',
];

export const POPULAR_MUSIC_TRACKS: StoryMusicTrack[] = [
  {
    id: '1445949267',
    title: 'Sunflower (Spider-Man: Into the S...',
    artist: 'Post Malone & Swae Lee',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/4b/30/2c/4b302cb6-7a14-5464-4e97-0577e9d0be49/18UMGIM82277.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/98/f0/d6/98f0d67e-f8bf-762d-cac7-1c6b3b6b35dd/mzaf_4543283896248560946.plus.aac.p.m4a',
    genre: 'hip hop',
  },
  {
    id: '1440841384',
    title: 'One Dance (feat. Wizkid & Kyla)',
    artist: 'Drake',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f2/0d/8b/f20d8bff-a927-ae98-6784-20a1f51cb23e/16UMGIM27642.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/cb/ee/e3/cbeee354-21e5-2c44-daeb-bcd95e26fe6a/mzaf_5204581280747289469.plus.aac.p.m4a',
    genre: 'hip hop',
  },
  {
    id: '1450695872',
    title: "when the party's over",
    artist: 'Billie Eilish',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1a/37/d1/1a37d1b1-8508-54f2-f541-bf4e437dda76/19UMGIM05028.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2a/ba/44/2aba4410-ba71-89ce-e075-10120409c31c/mzaf_16887001963655152332.plus.aac.p.m4a',
    genre: 'chill',
  },
  {
    id: '1487502476',
    title: 'everything i wanted',
    artist: 'Billie Eilish',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c5/6c/b1/c56cb16a-52c3-33b5-5189-6c65028001fb/19UM1IM00404.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/23/f3/6b/23f36bc0-9edc-8d55-df7f-7b806310d4b4/mzaf_15718469078111904528.plus.aac.p.m4a',
    genre: 'chill',
  },
  {
    id: '1624932774',
    title: 'POP!',
    artist: 'NAYEON',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3f/49/ec/3f49ecb2-cb91-dd28-45b9-a31326d7e63b/738676859614_Cover.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/cc/74/22/cc7422df-1686-77ff-d3b0-2a2eb093fd76/mzaf_17159235851286493668.plus.aac.p.m4a',
    genre: 'pop',
  },
  {
    id: '1590036021',
    title: 'Easy On Me',
    artist: 'Adele',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/73/6d/7c/736d7cfb-c79d-c9a9-4170-5e71d008dea1/886449666430.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4c/08/30/4c08305e-0556-30a1-d1ba-2f916b56d62c/mzaf_10419822985277809788.plus.aac.p.m4a',
    genre: 'acoustic',
  },
  {
    id: '1574968888',
    title: 'STAY',
    artist: 'The Kid LAROI & Justin Bieber',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/89/59/6a/89596ab9-fa3c-8d08-4d95-a6450fa2013c/886449400515.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d7/4a/84/d74a84d5-9afa-761e-b632-baab55c2a23b/mzaf_11865500880477235553.plus.aac.p.m4a',
    genre: 'pop',
  },
  {
    id: '1538003843',
    title: 'Levitating',
    artist: 'Dua Lipa',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a',
    genre: 'pop',
  },
  {
    id: '1542842761',
    title: 'Blinding Lights',
    artist: 'The Weeknd & ROSALÍA',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/12/73/ca/1273ca46-233a-5331-189b-25ac1d656533/mzaf_976341070785891411.plus.aac.p.m4a',
    genre: 'synthwave',
  },
  {
    id: '1576322495',
    title: 'Lofi Hip Hop Beats',
    artist: 'Sad Music',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/74/c8/ac/74c8ac7d-dd92-d681-5a55-68508ba510a8/20309.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/e1/0c/cf/e10ccf48-6dd1-1c22-2e04-fcdf24a576cd/mzaf_15881785058412743364.plus.aac.p.m4a',
    genre: 'lo-fi',
  },
  {
    id: '1442447970',
    title: 'Nightcall',
    artist: 'Kavinsky',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d2/45/fb/d245fbf9-8570-fdc0-5e6b-aa528c130486/mzaf_11947081694159530687.plus.aac.p.m4a',
    genre: 'synthwave',
  },
  {
    id: '1193701400',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c7/ba/bc/c7babc66-f598-aaa6-bcf6-307281795817/mzaf_16337361235117168274.plus.aac.p.m4a',
    genre: 'acoustic',
  },
];

export interface StoryLocation {
  id: string;
  name: string;
  subtitle: string;
  city?: string;
  country?: string;
  x?: number;
  y?: number;
  placedOnMedia?: boolean;
}

export const POPULAR_LOCATIONS: StoryLocation[] = [
  {
    id: 'loc_hyd_1',
    name: 'Hyderabad',
    subtitle: 'Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_hyd_2',
    name: 'حیدرآباد',
    subtitle: 'Sindh, Pakistan',
    city: 'Hyderabad',
    country: 'Pakistan',
  },
  {
    id: 'loc_hyd_3',
    name: 'Hyderabad City Taluka',
    subtitle: 'Sindh, Pakistan',
    city: 'Hyderabad',
    country: 'Pakistan',
  },
  {
    id: 'loc_hyd_4',
    name: 'Hyderabad',
    subtitle: 'Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_sec_1',
    name: 'Secunderabad',
    subtitle: 'Telangana, India',
    city: 'Secunderabad',
    country: 'India',
  },
  {
    id: 'loc_hit_1',
    name: 'Hitech City',
    subtitle: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_ban_1',
    name: 'Banjara Hills',
    subtitle: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_jub_1',
    name: 'Jubilee Hills',
    subtitle: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_gac_1',
    name: 'Gachibowli',
    subtitle: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_mad_1',
    name: 'Madhapur',
    subtitle: 'Hyderabad, Telangana, India',
    city: 'Hyderabad',
    country: 'India',
  },
  {
    id: 'loc_blr_1',
    name: 'Bengaluru',
    subtitle: 'Karnataka, India',
    city: 'Bengaluru',
    country: 'India',
  },
  {
    id: 'loc_mum_1',
    name: 'Mumbai',
    subtitle: 'Maharashtra, India',
    city: 'Mumbai',
    country: 'India',
  },
  {
    id: 'loc_del_1',
    name: 'New Delhi',
    subtitle: 'Delhi, India',
    city: 'New Delhi',
    country: 'India',
  },
  {
    id: 'loc_nyc_1',
    name: 'New York',
    subtitle: 'New York, United States',
    city: 'New York',
    country: 'United States',
  },
  {
    id: 'loc_lon_1',
    name: 'London',
    subtitle: 'Greater London, United Kingdom',
    city: 'London',
    country: 'United Kingdom',
  },
  {
    id: 'loc_dub_1',
    name: 'Dubai',
    subtitle: 'Dubai, United Arab Emirates',
    city: 'Dubai',
    country: 'United Arab Emirates',
  },
  {
    id: 'loc_tok_1',
    name: 'Tokyo',
    subtitle: 'Kanto, Japan',
    city: 'Tokyo',
    country: 'Japan',
  },
  {
    id: 'loc_par_1',
    name: 'Paris',
    subtitle: 'Île-de-France, France',
    city: 'Paris',
    country: 'France',
  },
];

export const POPULAR_LOCATION_TAGS = [
  'Hyderabad',
  'Secunderabad',
  'Hitech City',
  'Banjara Hills',
  'Jubilee Hills',
  'Gachibowli',
  'Madhapur',
  'Bengaluru',
  'Mumbai',
  'New Delhi',
];

interface ShareHubbModalProps {
  isDark?: boolean;
  onClose: () => void;
  onPublishStory: (storyData: {
    mediaUri: string;
    caption: string;
    mediaType?: 'image' | 'video';
    thumbnailUri?: string;
    filter?: string;
    crop?: { aspect: string; zoom: number };
    rotation?: number;
    adjustments?: ImageAdjustments;
    stickers?: StickerOverlay[];
    texts?: TextOverlay[];
    music?: StoryMusicTrack;
    location?: StoryLocation;
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

const FILTERS = [
  'Original',
  'Bright',
  'Warm',
  'Cool',
  'Vintage',
  'Black & White',
  'HDR',
  'Cinematic',
  'Soft',
  'Dream',
  'Purple Glow',
  'Cool Blue',
  'Sepia',
  'Vivid',
  'Mono',
];

export const FILTER_STYLES: Record<string, string> = {
  Original: 'transparent',
  Bright: 'rgba(255, 255, 255, 0.2)',
  Warm: 'rgba(255, 150, 0, 0.15)',
  Cool: 'rgba(0, 100, 255, 0.15)',
  Vintage: 'rgba(150, 100, 50, 0.25)',
  'Black & White': 'rgba(120, 120, 120, 0.4)', 
  HDR: 'rgba(0, 0, 0, 0.1)',
  Cinematic: 'rgba(20, 20, 30, 0.25)',
  Soft: 'rgba(255, 230, 200, 0.15)',
  Dream: 'rgba(255, 180, 255, 0.15)',
  'Purple Glow': 'rgba(128, 0, 128, 0.2)',
  'Cool Blue': 'rgba(0, 150, 255, 0.2)',
  Sepia: 'rgba(112, 66, 20, 0.25)',
  Vivid: 'rgba(255, 100, 50, 0.1)',
  Mono: 'rgba(50, 50, 50, 0.4)',
};

export interface ImageAdjustments {
  temperature: number;
  tint: number;
  saturation: number;
  vibrance: number;
  sharpness: number;
  blur: number;
  opacity: number;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  temperature: 0,
  tint: 0,
  saturation: 100,
  vibrance: 100,
  sharpness: 0,
  blur: 0,
  opacity: 100,
};

export const getAdjustmentsFilterStyle = (adjustments?: ImageAdjustments | null) => {
  if (!adjustments) return {};

  const filters: string[] = [];

  if (adjustments.blur && adjustments.blur > 0) {
    filters.push(`blur(${adjustments.blur}px)`);
  }

  const sat = adjustments.saturation !== undefined ? adjustments.saturation : 100;
  const vib = adjustments.vibrance !== undefined ? adjustments.vibrance : 100;
  const vibranceBoost = (vib - 100) * 0.85;
  const totalSaturate = Math.max(0, Math.round(sat + vibranceBoost));
  if (totalSaturate !== 100) {
    filters.push(`saturate(${totalSaturate}%)`);
  }

  const sharp = adjustments.sharpness !== undefined ? adjustments.sharpness : 0;
  if (sharp > 0) {
    filters.push(`contrast(${100 + Math.round(sharp * 0.9)}%)`);
    filters.push(`brightness(${100 + Math.round(sharp * 0.08)}%)`);
  }

  if (filters.length === 0) return {};
  const filterStr = filters.join(' ');
  return Platform.OS === 'web'
    ? ({ filter: filterStr, WebkitFilter: filterStr } as any)
    : {};
};

export function MediaAdjustmentsOverlay({
  adjustments,
  filter,
}: {
  adjustments?: ImageAdjustments | null;
  filter?: string | null;
}) {
  const sat = adjustments?.saturation !== undefined ? adjustments.saturation : 100;
  const vib = adjustments?.vibrance !== undefined ? adjustments.vibrance : 100;
  const sharp = adjustments?.sharpness !== undefined ? adjustments.sharpness : 0;

  return (
    <>
      {/* Temperature Overlay */}
      {adjustments && adjustments.temperature !== 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                adjustments.temperature > 0
                  ? `rgba(255, 130, 0, ${(adjustments.temperature / 100) * 0.28})`
                  : `rgba(0, 130, 255, ${(Math.abs(adjustments.temperature) / 100) * 0.28})`,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Tint Overlay */}
      {adjustments && adjustments.tint !== 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor:
                adjustments.tint > 0
                  ? `rgba(220, 0, 180, ${(adjustments.tint / 100) * 0.22})`
                  : `rgba(0, 200, 100, ${(Math.abs(adjustments.tint) / 100) * 0.22})`,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Desaturation Gray Overlay (when Saturation or Vibrance < 100) */}
      {(sat < 100 || vib < 100) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#808080',
              opacity: Math.min(0.95, ((100 - Math.min(sat, vib)) / 100) * 0.9),
              ...(Platform.OS === 'web' ? ({ mixBlendMode: 'color' } as any) : {}),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Saturation & Vibrance Vivid Boost Overlay (when Saturation or Vibrance > 100) */}
      {(sat > 100 || vib > 100) && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#FF0055',
              opacity: Math.min(0.45, ((Math.max(sat, vib) - 100) / 100) * 0.38),
              ...(Platform.OS === 'web' ? ({ mixBlendMode: 'overlay' } as any) : {}),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Sharpness Clarity Highlight Overlay */}
      {sharp > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: (sharp / 100) * 0.25,
              ...(Platform.OS === 'web' ? ({ mixBlendMode: 'hard-light' } as any) : {}),
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Filter Overlay */}
      {filter && filter !== 'Original' && FILTER_STYLES[filter] && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: FILTER_STYLES[filter] },
          ]}
          pointerEvents="none"
        />
      )}
    </>
  );
}

const ADJUSTMENT_SLIDERS = [
  { id: 'temperature', label: 'Temperature', min: -100, max: 100, defaultVal: 0 },
  { id: 'tint', label: 'Tint', min: -100, max: 100, defaultVal: 0 },
  { id: 'saturation', label: 'Saturation', min: 0, max: 200, defaultVal: 100 },
  { id: 'vibrance', label: 'Vibrance', min: 0, max: 200, defaultVal: 100 },
  { id: 'sharpness', label: 'Sharpness', min: 0, max: 100, defaultVal: 0 },
  { id: 'blur', label: 'Blur', min: 0, max: 20, defaultVal: 0 },
  { id: 'opacity', label: 'Opacity', min: 0, max: 100, defaultVal: 100 },
];

export interface SelectedMediaItem {
  uri: string;
  type: 'image' | 'video';
  thumbnailUri?: string | null;
  duration?: number | null;
  fileName?: string | null;
}

export interface SavedDraftItem {
  id: string;
  mediaUri?: string | null;
  caption: string;
  savedAt: string;
  mediaType?: 'image' | 'video';
  selectedMedia?: SelectedMediaItem | null;
  filter?: string;
  adjustments?: ImageAdjustments;
  crop?: { aspect: string; zoom: number } | null;
  aspectRatio?: string;
  zoomLevel?: number;
  rotation?: number;
  stickers?: StickerOverlay[];
  texts?: TextOverlay[];
  music?: StoryMusicTrack | null;
  location?: StoryLocation | null;
}

const DRAFTS_STORAGE_KEY = 'HUBB_SAVED_DRAFTS_V1';
let globalSavedDraftsStore: SavedDraftItem[] = [];

export const loadPersistedDrafts = (): SavedDraftItem[] => {
  if (globalSavedDraftsStore.length > 0) return globalSavedDraftsStore;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          globalSavedDraftsStore = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.log('Error reading drafts from storage:', e);
    }
  }
  return [];
};

export const savePersistedDrafts = (drafts: SavedDraftItem[]) => {
  globalSavedDraftsStore = drafts;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.log('Error saving drafts to storage:', e);
    }
  }
};

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

// Inline video player preview using expo-video supporting real-time adjustments and controls
export function VideoPreviewPlayer({
  uri,
  duration,
  thumbnailUri,
  scale = 1,
  rotation = 0,
  adjustments,
  contentFit = 'contain',
  style,
  showControls = true,
}: {
  uri: string;
  duration?: number | null;
  thumbnailUri?: string | null;
  scale?: number;
  rotation?: number;
  adjustments?: ImageAdjustments | null;
  contentFit?: 'contain' | 'cover';
  style?: any;
  showControls?: boolean;
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
      style={[styles.videoPlayerTouchable, style]}
    >
      <VideoView
        style={[
          styles.mediaPreviewImage,
          {
            width: '100%',
            height: '100%',
            opacity: adjustments ? adjustments.opacity / 100 : 1,
            transform: [{ scale }, { rotate: `${rotation}deg` }],
            ...getAdjustmentsFilterStyle(adjustments),
          },
        ]}
        player={player}
        contentFit={contentFit}
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {showControls && !isPlaying && (
        <View style={styles.videoPausedOverlay}>
          <View style={styles.videoIconCircle}>
            <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
          </View>
          <Text style={styles.videoPausedText}>Tap to play</Text>
        </View>
      )}
      {showControls && (
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
      )}
    </TouchableOpacity>
  );
}

// Highly responsive, smooth adjustment slider row supporting Web & Native
interface AdjustSliderItemProps {
  id: string;
  label: string;
  min: number;
  max: number;
  val: number;
  defaultVal: number;
  isDark?: boolean;
  onChange: (newVal: number) => void;
  onReset: () => void;
}

function AdjustSliderItem({
  id,
  label,
  min,
  max,
  val,
  defaultVal,
  isDark,
  onChange,
  onReset,
}: AdjustSliderItemProps) {
  const range = max - min;
  const isBipolar = min < 0;
  const percentage = Math.min(100, Math.max(0, ((val - min) / range) * 100));

  const [trackWidth, setTrackWidth] = useState(300);
  const trackWidthRef = useRef(300);
  const startValRef = useRef(val);
  const containerRef = useRef<View>(null);

  const stepAmount = range > 100 ? 5 : 1;

  const handleStepMinus = () => {
    onChange(Math.max(min, val - stepAmount));
  };

  const handleStepPlus = () => {
    onChange(Math.min(max, val + stepAmount));
  };

  // PanResponder for Native (Android & iOS)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onPanResponderGrant: (evt) => {
        const w = trackWidthRef.current || 300;
        const x = evt.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / w));
        const newVal = Math.round(min + ratio * range);
        startValRef.current = newVal;
        onChange(newVal);
      },
      onPanResponderMove: (evt, gestureState) => {
        const w = trackWidthRef.current || 300;
        const delta = (gestureState.dx / w) * range;
        let newVal = Math.round(startValRef.current + delta);
        newVal = Math.max(min, Math.min(max, newVal));
        onChange(newVal);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Calculate fill bar position & width
  let fillLeft: DimensionValue = 0;
  let fillWidth: DimensionValue = `${percentage}%`;

  if (isBipolar) {
    if (val >= 0) {
      fillLeft = '50%';
      fillWidth = `${Math.min(50, Math.max(0, (val / max) * 50))}%`;
    } else {
      const dist = Math.min(50, Math.max(0, (Math.abs(val) / Math.abs(min)) * 50));
      fillLeft = `${50 - dist}%`;
      fillWidth = `${dist}%`;
    }
  }

  return (
    <View style={styles.adjustSliderRow}>
      {/* Header: Label on left, Controls on right */}
      <View style={styles.adjustSliderHeader}>
        <Text style={[styles.adjustSliderLabel, isDark && styles.adjustSliderLabelDark]}>
          {label}
        </Text>

        <View style={styles.adjustControlsRow}>
          {/* Minus Button for fine 1-step tuning */}
          <TouchableOpacity
            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
            activeOpacity={0.7}
            onPress={handleStepMinus}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityLabel={`Decrease ${label}`}
          >
            <Feather name="minus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
          </TouchableOpacity>

          {/* Value Badge (tap to reset individual slider) */}
          <TouchableOpacity
            style={[
              styles.adjustValueBadge,
              isDark && styles.adjustValueBadgeDark,
              val !== defaultVal && styles.adjustValueBadgeActive,
              val !== defaultVal && isDark && styles.adjustValueBadgeActiveDark,
            ]}
            activeOpacity={0.75}
            onPress={onReset}
            accessibilityLabel={`Reset ${label}`}
          >
            <Text
              style={[
                styles.adjustValueBadgeText,
                isDark && styles.adjustValueBadgeTextDark,
                val !== defaultVal && styles.adjustValueBadgeTextActive,
              ]}
            >
              {val > 0 && isBipolar ? `+${val}` : `${val}`}
            </Text>
          </TouchableOpacity>

          {/* Plus Button for fine 1-step tuning */}
          <TouchableOpacity
            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
            activeOpacity={0.7}
            onPress={handleStepPlus}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityLabel={`Increase ${label}`}
          >
            <Feather name="plus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Track Container */}
      <View
        ref={containerRef}
        style={styles.adjustTrackContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) {
            setTrackWidth(w);
            trackWidthRef.current = w;
          }
        }}
        {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
      >
        {/* Track Line Background */}
        <View
          style={[styles.adjustTrackLine, isDark && styles.adjustTrackLineDark]}
          pointerEvents="none"
        >
          {/* Center notch for bipolar (-100 to +100) sliders */}
          {isBipolar && (
            <View
              style={[styles.adjustTrackCenterNotch, isDark && styles.adjustTrackCenterNotchDark]}
              pointerEvents="none"
            />
          )}

          {/* Filled Bar */}
          <View
            style={[
              styles.adjustTrackFilled,
              isDark && styles.adjustTrackFilledDark,
              { left: fillLeft, width: fillWidth },
            ]}
            pointerEvents="none"
          />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.adjustThumb,
            isDark && styles.adjustThumbDark,
            { left: `${percentage}%`, transform: [{ translateX: -10 }] },
          ]}
          pointerEvents="none"
        />

        {/* Web Transparent Range Input: provides 100% native smooth click & drag on web */}
        {Platform.OS === 'web' && (
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={val}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              zIndex: 10,
              margin: 0,
              padding: 0,
            }}
          />
        )}
      </View>
    </View>
  );
}

// Interactive Draggable Sticker Component
function DraggableSticker({
  sticker,
  isSelected,
  containerWidth,
  containerHeight,
  onSelect,
  onDelete,
  onUpdatePosition,
  onUpdateScale,
  onUpdateRotation,
}: {
  sticker: StickerOverlay;
  isSelected: boolean;
  containerWidth: number;
  containerHeight: number;
  onSelect: () => void;
  onDelete: () => void;
  onUpdatePosition: (newX: number, newY: number) => void;
  onUpdateScale?: (newScale: number) => void;
  onUpdateRotation?: (newRot: number) => void;
}) {
  const stickerRef = useRef(sticker);
  stickerRef.current = sticker;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ pageX: 0, pageY: 0, startX: sticker.x, startY: sticker.y });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(sticker.scale || 1);

  const handlePointerDown = (e: any) => {
    onSelect();
    const pageX = e.pageX ?? e.nativeEvent?.pageX ?? (e.touches && e.touches[0]?.pageX) ?? 0;
    const pageY = e.pageY ?? e.nativeEvent?.pageY ?? (e.touches && e.touches[0]?.pageY) ?? 0;
    isDraggingRef.current = true;
    dragStartRef.current = { pageX, pageY, startX: stickerRef.current.x, startY: stickerRef.current.y };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onMove = (moveEvt: any) => {
        if (!isDraggingRef.current) return;
        const curX = moveEvt.pageX ?? (moveEvt.touches && moveEvt.touches[0]?.pageX) ?? 0;
        const curY = moveEvt.pageY ?? (moveEvt.touches && moveEvt.touches[0]?.pageY) ?? 0;
        const dx = curX - dragStartRef.current.pageX;
        const dy = curY - dragStartRef.current.pageY;
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + (dx / w) * 100)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + (dy / h) * 100)));
        onUpdatePosition(nextX, nextY);
      };

      const onUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        onSelect();
        const touches = evt.nativeEvent?.touches;
        if (touches && touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchStartDistRef.current = Math.hypot(dx, dy);
          pinchStartScaleRef.current = stickerRef.current.scale || 1;
        } else {
          dragStartRef.current = { pageX: 0, pageY: 0, startX: stickerRef.current.x, startY: stickerRef.current.y };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent?.touches;
        if (touches && touches.length === 2 && pinchStartDistRef.current && onUpdateScale) {
          // Two-finger pinch to resize sticker with fingers / hand!
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.hypot(dx, dy);
          const ratio = dist / pinchStartDistRef.current;
          const nextScale = Math.min(3.5, Math.max(0.4, Number((pinchStartScaleRef.current * ratio).toFixed(2))));
          onUpdateScale(nextScale);
        } else {
          const w = containerWidth || 340;
          const h = containerHeight || 340;
          const dxPercent = (gestureState.dx / w) * 100;
          const dyPercent = (gestureState.dy / h) * 100;
          const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + dxPercent)));
          const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + dyPercent)));
          onUpdatePosition(nextX, nextY);
        }
      },
      onPanResponderRelease: () => {
        pinchStartDistRef.current = null;
      },
    })
  ).current;

  const handleStepResize = () => {
    if (!onUpdateScale) return;
    let nextScale = Number(((sticker.scale || 1) + 0.25).toFixed(2));
    if (nextScale > 2.6) nextScale = 0.6;
    onUpdateScale(nextScale);
  };

  const handleStepRotate = () => {
    if (!onUpdateRotation) return;
    const nextRot = ((sticker.rotation || 0) + 15) % 360;
    onUpdateRotation(nextRot);
  };

  const dragHandlers = Platform.OS === 'web' ? { onPointerDown: handlePointerDown } : panResponder.panHandlers;

  return (
    <View
      style={[
        styles.stickerOverlayItem,
        {
          left: `${sticker.x}%`,
          top: `${sticker.y}%`,
          transform: [
            { translateX: -24 },
            { translateY: -24 },
            { rotate: `${sticker.rotation}deg` },
            { scale: sticker.scale },
          ],
        },
        isSelected && styles.stickerOverlayItemSelected,
      ]}
      {...dragHandlers}
    >
      <Text style={[styles.stickerEmojiGlyphOverlay, { userSelect: 'none' }]}>{sticker.emoji}</Text>

      {isSelected && (
        <>
          <TouchableOpacity
            style={styles.stickerDeleteMiniBtn}
            onPress={(e) => {
              // @ts-ignore
              e?.stopPropagation?.();
              onDelete();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
            accessibilityLabel="Delete sticker"
          >
            <Feather name="x" size={10} color="#FFFFFF" />
          </TouchableOpacity>

          {onUpdateScale && (
            <TouchableOpacity
              style={styles.stickerResizeMiniBtn}
              onPress={(e) => {
                // @ts-ignore
                e?.stopPropagation?.();
                handleStepResize();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
              accessibilityLabel="Resize sticker with hand"
            >
              <Feather name="maximize-2" size={10} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {onUpdateRotation && (
            <TouchableOpacity
              style={styles.stickerRotateMiniBtn}
              onPress={(e) => {
                // @ts-ignore
                e?.stopPropagation?.();
                handleStepRotate();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
              accessibilityLabel="Rotate sticker"
            >
              <Feather name="rotate-cw" size={10} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// Interactive Draggable Location Tag Component
function DraggableLocationTag({
  location,
  isSelected,
  containerWidth,
  containerHeight,
  onSelect,
  onDelete,
  onUpdatePosition,
}: {
  location: StoryLocation;
  isSelected?: boolean;
  containerWidth: number;
  containerHeight: number;
  onSelect?: () => void;
  onDelete?: () => void;
  onUpdatePosition: (newX: number, newY: number) => void;
}) {
  const locRef = useRef(location);
  locRef.current = location;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ pageX: 0, pageY: 0, startX: location.x ?? 50, startY: location.y ?? 25 });

  const handlePointerDown = (e: any) => {
    onSelect?.();
    const pageX = e.pageX ?? e.nativeEvent?.pageX ?? (e.touches && e.touches[0]?.pageX) ?? 0;
    const pageY = e.pageY ?? e.nativeEvent?.pageY ?? (e.touches && e.touches[0]?.pageY) ?? 0;
    isDraggingRef.current = true;
    dragStartRef.current = { pageX, pageY, startX: locRef.current.x ?? 50, startY: locRef.current.y ?? 25 };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onMove = (moveEvt: any) => {
        if (!isDraggingRef.current) return;
        const curX = moveEvt.pageX ?? (moveEvt.touches && moveEvt.touches[0]?.pageX) ?? 0;
        const curY = moveEvt.pageY ?? (moveEvt.touches && moveEvt.touches[0]?.pageY) ?? 0;
        const dx = curX - dragStartRef.current.pageX;
        const dy = curY - dragStartRef.current.pageY;
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + (dx / w) * 100)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + (dy / h) * 100)));
        onUpdatePosition(nextX, nextY);
      };

      const onUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        onSelect?.();
        dragStartRef.current = { pageX: 0, pageY: 0, startX: locRef.current.x ?? 50, startY: locRef.current.y ?? 25 };
      },
      onPanResponderMove: (_, gestureState) => {
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const dxPercent = (gestureState.dx / w) * 100;
        const dyPercent = (gestureState.dy / h) * 100;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + dxPercent)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + dyPercent)));
        onUpdatePosition(nextX, nextY);
      },
    })
  ).current;

  const dragHandlers = Platform.OS === 'web' ? { onPointerDown: handlePointerDown } : panResponder.panHandlers;

  return (
    <View
      style={[
        styles.draggableLocOverlayItem,
        {
          left: `${location.x ?? 50}%`,
          top: `${location.y ?? 25}%`,
        },
        isSelected && styles.draggableLocOverlayItemSelected,
      ]}
      {...dragHandlers}
    >
      <View style={styles.draggableLocBadge}>
        <Text style={{ fontSize: 13, marginRight: 5 }}>📍</Text>
        <Text style={styles.draggableLocBadgeText} numberOfLines={1}>
          {location.name}
        </Text>
      </View>

      {onDelete && isSelected && (
        <TouchableOpacity
          style={styles.stickerDeleteMiniBtn}
          onPress={(e) => {
            // @ts-ignore
            e?.stopPropagation?.();
            onDelete();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
          accessibilityLabel="Remove location from media"
        >
          <Feather name="x" size={10} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Interactive Draggable Text Component
function DraggableText({
  item,
  isSelected,
  containerWidth,
  containerHeight,
  isDark,
  onSelect,
  onDelete,
  onRotate,
  onResize,
  onUpdatePosition,
}: {
  item: TextOverlay;
  isSelected: boolean;
  containerWidth: number;
  containerHeight: number;
  isDark?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRotate?: () => void;
  onResize?: () => void;
  onUpdatePosition: (newX: number, newY: number) => void;
}) {
  const itemRef = useRef(item);
  itemRef.current = item;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ pageX: 0, pageY: 0, startX: item.x, startY: item.y });

  const handlePointerDown = (e: any) => {
    onSelect();
    const pageX = e.pageX ?? e.nativeEvent?.pageX ?? (e.touches && e.touches[0]?.pageX) ?? 0;
    const pageY = e.pageY ?? e.nativeEvent?.pageY ?? (e.touches && e.touches[0]?.pageY) ?? 0;
    isDraggingRef.current = true;
    dragStartRef.current = { pageX, pageY, startX: itemRef.current.x, startY: itemRef.current.y };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onMove = (moveEvt: any) => {
        if (!isDraggingRef.current) return;
        const curX = moveEvt.pageX ?? (moveEvt.touches && moveEvt.touches[0]?.pageX) ?? 0;
        const curY = moveEvt.pageY ?? (moveEvt.touches && moveEvt.touches[0]?.pageY) ?? 0;
        const dx = curX - dragStartRef.current.pageX;
        const dy = curY - dragStartRef.current.pageY;
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + (dx / w) * 100)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + (dy / h) * 100)));
        onUpdatePosition(nextX, nextY);
      };

      const onUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        onSelect();
        dragStartRef.current = { pageX: 0, pageY: 0, startX: itemRef.current.x, startY: itemRef.current.y };
      },
      onPanResponderMove: (_, gestureState) => {
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const dxPercent = (gestureState.dx / w) * 100;
        const dyPercent = (gestureState.dy / h) * 100;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + dxPercent)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + dyPercent)));
        onUpdatePosition(nextX, nextY);
      },
    })
  ).current;

  const dragHandlers = Platform.OS === 'web' ? { onPointerDown: handlePointerDown } : panResponder.panHandlers;

  return (
    <View
      style={[
        styles.textOverlayItem,
        {
          left: `${item.x}%`,
          top: `${item.y}%`,
          transform: [
            { translateX: -50 },
            { translateY: -16 },
            { rotate: `${item.rotation || 0}deg` },
            { scale: item.scale || 1 },
          ],
        },
        isSelected && styles.textOverlayItemSelected,
      ]}
      {...dragHandlers}
    >
      <Text
        style={[
          styles.textOverlayContent,
          {
            color: item.color,
            fontSize: item.fontSize,
            fontFamily: getFontFamilyStyle(item.fontFamily),
            fontWeight: item.fontFamily === 'Bebas Neue' ? '900' : '700',
            textShadowColor: item.color === '#FFFFFF' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1.5 },
            textShadowRadius: 3,
            userSelect: 'none',
          },
        ]}
      >
        {item.text}
      </Text>

      {isSelected && (
        <>
          <TouchableOpacity
            style={styles.textDeleteMiniBtn}
            onPress={(e) => {
              // @ts-ignore
              e?.stopPropagation?.();
              onDelete();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
            accessibilityLabel="Delete text"
          >
            <Feather name="x" size={10} color="#FFFFFF" />
          </TouchableOpacity>

          {onRotate && (
            <TouchableOpacity
              style={[styles.textActionMiniBtn, { right: -8 }]}
              onPress={(e) => {
                // @ts-ignore
                e?.stopPropagation?.();
                onRotate();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
              accessibilityLabel="Rotate text"
            >
              <Feather name="rotate-cw" size={11} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {onResize && (
            <TouchableOpacity
              style={[styles.textActionMiniBtn, { left: -8 }]}
              onPress={(e) => {
                // @ts-ignore
                e?.stopPropagation?.();
                onResize();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.8}
              accessibilityLabel="Resize text"
            >
              <Feather name="maximize-2" size={10} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

// Live Draggable Preview for Uncommitted Text (while typing in input)
function LivePreviewDraggableText({
  text,
  color,
  fontFamily,
  pos,
  rotation = 0,
  scale = 1,
  containerWidth,
  containerHeight,
  onUpdatePos,
}: {
  text: string;
  color: string;
  fontFamily: string;
  pos: { x: number; y: number };
  rotation?: number;
  scale?: number;
  containerWidth: number;
  containerHeight: number;
  onUpdatePos: (pos: { x: number; y: number }) => void;
}) {
  const posRef = useRef(pos);
  posRef.current = pos;
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ pageX: 0, pageY: 0, startX: pos.x, startY: pos.y });

  const handlePointerDown = (e: any) => {
    const pageX = e.pageX ?? e.nativeEvent?.pageX ?? (e.touches && e.touches[0]?.pageX) ?? 0;
    const pageY = e.pageY ?? e.nativeEvent?.pageY ?? (e.touches && e.touches[0]?.pageY) ?? 0;
    isDraggingRef.current = true;
    dragStartRef.current = { pageX, pageY, startX: posRef.current.x, startY: posRef.current.y };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onMove = (moveEvt: any) => {
        if (!isDraggingRef.current) return;
        const curX = moveEvt.pageX ?? (moveEvt.touches && moveEvt.touches[0]?.pageX) ?? 0;
        const curY = moveEvt.pageY ?? (moveEvt.touches && moveEvt.touches[0]?.pageY) ?? 0;
        const dx = curX - dragStartRef.current.pageX;
        const dy = curY - dragStartRef.current.pageY;
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + (dx / w) * 100)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + (dy / h) * 100)));
        onUpdatePos({ x: nextX, y: nextY });
      };

      const onUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 1 || Math.abs(gestureState.dy) > 1,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartRef.current = { pageX: 0, pageY: 0, startX: posRef.current.x, startY: posRef.current.y };
      },
      onPanResponderMove: (_, gestureState) => {
        const w = containerWidth || 340;
        const h = containerHeight || 340;
        const dxPercent = (gestureState.dx / w) * 100;
        const dyPercent = (gestureState.dy / h) * 100;
        const nextX = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startX + dxPercent)));
        const nextY = Math.max(5, Math.min(95, Math.round(dragStartRef.current.startY + dyPercent)));
        onUpdatePos({ x: nextX, y: nextY });
      },
    })
  ).current;

  const dragHandlers = Platform.OS === 'web' ? { onPointerDown: handlePointerDown } : panResponder.panHandlers;

  return (
    <View
      style={[
        styles.textOverlayItem,
        styles.textOverlayItemSelected,
        {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: [
            { translateX: -50 },
            { translateY: -16 },
            { rotate: `${rotation || 0}deg` },
            { scale: scale || 1 },
          ],
          zIndex: 30,
        },
      ]}
      {...dragHandlers}
    >
      <Text
        style={[
          styles.textOverlayContent,
          {
            color,
            fontSize: 26,
            fontFamily: getFontFamilyStyle(fontFamily),
            fontWeight: fontFamily === 'Bebas Neue' ? '900' : '700',
            textShadowColor: color === '#FFFFFF' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)',
            textShadowOffset: { width: 0, height: 1.5 },
            textShadowRadius: 3,
            userSelect: 'none',
          },
        ]}
      >
        {text}
      </Text>
    </View>
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
  const [selectedFilter, setSelectedFilter] = useState('Original');
  const [aspectRatio, setAspectRatio] = useState('Free');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [rotationHistory, setRotationHistory] = useState<number[]>([0]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [appliedCrop, setAppliedCrop] = useState<{ aspect: string, zoom: number } | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftItem[]>(() => loadPersistedDrafts());
  const [draftsCount, setDraftsCount] = useState(() => loadPersistedDrafts().length);
  const [draftSavedTime, setDraftSavedTime] = useState('Just now');
  const hasPostedRef = useRef(false);
  const isDraftSavedRef = useRef(false);
  const activeDraftIdRef = useRef<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraModalMode, setCameraModalMode] = useState<'camera_only' | 'change_media'>('camera_only');

  const mainScrollViewRef = useRef<ScrollView>(null);
  const [isMediaRequiredModalOpen, setIsMediaRequiredModalOpen] = useState(false);
  const currentRotationRef = useRef(rotation);
  useEffect(() => {
    currentRotationRef.current = rotation;
  }, [rotation]);

  const [initialRotationOnOpen, setInitialRotationOnOpen] = useState(0);
  const [sliderTrackWidth, setSliderTrackWidth] = useState(300);
  const rotationStartRef = useRef(rotation);

  // Preview & Publish View States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewSliderPos, setPreviewSliderPos] = useState(50);
  const [previewContainerWidth, setPreviewContainerWidth] = useState(340);
  const [previewContainerHeight, setPreviewContainerHeight] = useState(500);
  const previewContainerRef = useRef<any>(null);

  // Scheduling Date & Time States (Image 1)
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  // Visible in-app Calendar & Clock modal states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClockOpen, setIsClockOpen] = useState(false);

  // Calendar browsing state (month 0-11 and full year)
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  // Clock picker state
  const [clockHour, setClockHour] = useState(() => {
    const h = new Date().getHours() % 12 || 12;
    return h;
  });
  const [clockMinute, setClockMinute] = useState(() => {
    const m = Math.floor(new Date().getMinutes() / 5) * 5;
    return String(m).padStart(2, '0');
  });
  const [clockPeriod, setClockPeriod] = useState<'AM' | 'PM'>(() => {
    return new Date().getHours() >= 12 ? 'PM' : 'AM';
  });

  const openCalendarModal = () => {
    if (scheduledDate) {
      const parts = scheduledDate.split('-');
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && m >= 0 && m <= 11) setCalMonth(m);
        if (!isNaN(y) && y > 2000) setCalYear(y);
      }
    }
    setIsCalendarOpen(true);
  };

  const openClockModal = () => {
    if (scheduledTime) {
      const isPM = scheduledTime.toUpperCase().includes('PM');
      const isAM = scheduledTime.toUpperCase().includes('AM');
      const clean = scheduledTime.replace(/[^\d:]/g, '');
      const parts = clean.split(':');
      if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (isPM || isAM) {
          if (!isNaN(h) && h >= 1 && h <= 12) setClockHour(h);
          setClockPeriod(isPM ? 'PM' : 'AM');
        } else {
          if (!isNaN(h)) {
            setClockPeriod(h >= 12 ? 'PM' : 'AM');
            h = h % 12 || 12;
            setClockHour(h);
          }
        }
        if (!isNaN(m)) {
          const roundedM = Math.floor(m / 5) * 5;
          setClockMinute(String(Math.min(55, Math.max(0, roundedM))).padStart(2, '0'));
        }
      }
    }
    setIsClockOpen(true);
  };

  const previewPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const w = previewContainerWidth || 340;
        const deltaPct = (gestureState.dx / w) * 100;
        setPreviewSliderPos((prev) => Math.max(5, Math.min(95, Math.round(prev + deltaPct))));
      },
    })
  ).current;

  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [initialAdjustmentsOnOpen, setInitialAdjustmentsOnOpen] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);

  const [stickers, setStickers] = useState<StickerOverlay[]>([]);
  const [initialStickersOnOpen, setInitialStickersOnOpen] = useState<StickerOverlay[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [stickerCategory, setStickerCategory] = useState<string>('Popular');
  const [mediaContainerLayout, setMediaContainerLayout] = useState({ width: 340, height: 340 });

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);

  // Text Tool States
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [initialTextsOnOpen, setInitialTextsOnOpen] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [currentTextInput, setCurrentTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFont, setTextFont] = useState('Default');
  const [textScale, setTextScale] = useState(1);
  const [textRotation, setTextRotation] = useState(0);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [liveTextPos, setLiveTextPos] = useState({ x: 50, y: 45 });

  const selectedTextOverlay = textOverlays.find((t) => t.id === selectedTextId);

  useEffect(() => {
    if (selectedTextOverlay) {
      setTextScale(selectedTextOverlay.scale || 1);
      setTextRotation(selectedTextOverlay.rotation || 0);
      setCurrentTextInput(selectedTextOverlay.text);
      setTextColor(selectedTextOverlay.color);
      setTextFont(selectedTextOverlay.fontFamily || 'Default');
    }
  }, [selectedTextId]);

  // ── Music Tool States ──
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('Pop');
  const [activeMusicGenre, setActiveMusicGenre] = useState<string>('#pop');
  const [musicTracks, setMusicTracks] = useState<StoryMusicTrack[]>(POPULAR_MUSIC_TRACKS);
  const [selectedMusic, setSelectedMusic] = useState<StoryMusicTrack | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isMusicSearching, setIsMusicSearching] = useState(false);

  // Toggle music playback
  const togglePlayMusic = (track: StoryMusicTrack) => {
    if (playingTrackId === track.id) {
      pauseAudioPreview();
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(track.id);
      playAudioPreview(track.previewUrl, true);
    }
  };

  // Select music track & immediately play it
  const handleSelectTrack = (track: StoryMusicTrack) => {
    setSelectedMusic(track);
    setPlayingTrackId(track.id);
    playAudioPreview(track.previewUrl, true);
    setIsMusicModalOpen(false);
  };

  // Stop music
  const stopAudio = () => {
    pauseAudioPreview();
    setPlayingTrackId(null);
  };

  // Search music via iTunes API or fallback
  const handleSearchMusic = async () => {
    const q = musicSearchQuery.trim();
    if (!q) {
      setMusicTracks(POPULAR_MUSIC_TRACKS);
      return;
    }
    setIsMusicSearching(true);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=25`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const mapped: StoryMusicTrack[] = data.results.map((r: any) => ({
          id: String(r.trackId),
          title: r.trackName,
          artist: r.artistName,
          artwork: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : '',
          previewUrl: r.previewUrl,
          genre: r.primaryGenreName,
        }));
        setMusicTracks(mapped);
      } else {
        const queryLower = q.toLowerCase();
        setMusicTracks(
          POPULAR_MUSIC_TRACKS.filter(
            (t) =>
              t.title.toLowerCase().includes(queryLower) ||
              t.artist.toLowerCase().includes(queryLower) ||
              (t.genre && t.genre.toLowerCase().includes(queryLower))
          )
        );
      }
    } catch {
      const queryLower = q.toLowerCase();
      setMusicTracks(
        POPULAR_MUSIC_TRACKS.filter(
          (t) =>
            t.title.toLowerCase().includes(queryLower) ||
            t.artist.toLowerCase().includes(queryLower) ||
            (t.genre && t.genre.toLowerCase().includes(queryLower))
        )
      );
    } finally {
      setIsMusicSearching(false);
    }
  };

  // Genre selection filter
  const handleGenreSelect = (genre: string) => {
    setActiveMusicGenre(genre);
    const tag = genre.replace('#', '').toLowerCase();
    const filtered = POPULAR_MUSIC_TRACKS.filter(
      (t) =>
        (t.genre && t.genre.toLowerCase().includes(tag)) ||
        t.title.toLowerCase().includes(tag) ||
        t.artist.toLowerCase().includes(tag)
    );
    if (filtered.length > 0) {
      setMusicTracks(filtered);
    } else {
      setMusicSearchQuery(genre.replace('#', ''));
      setMusicTracks(POPULAR_MUSIC_TRACKS);
    }
  };

  // Import audio from device
  const handleImportDeviceAudio = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.getElementById('hubb-audio-file-input') as HTMLInputElement | null;
      input?.click();
    } else {
      Alert.alert(
        'Import from Device',
        'Audio files from your device storage can be attached to your HUBB.'
      );
    }
  };

  const handleWebAudioPicked = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      let artist = 'Device Audio';
      let title = rawName;
      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        artist = parts[0];
        title = parts[1];
      }
      const customTrack: StoryMusicTrack = {
        id: `device_${Date.now()}`,
        title: title.trim(),
        artist: artist.trim(),
        artwork:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        previewUrl: fileUrl,
        isDeviceAudio: true,
      };
      setMusicTracks((prev) => [customTrack, ...prev]);
      handleSelectTrack(customTrack);
    }
  };

  // Cleanup music playback on unmount
  useEffect(() => {
    return () => {
      stopAudioPreview();
    };
  }, []);

  // ── Location Tool States ──
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('Hyderabad');
  const [activeLocationTag, setActiveLocationTag] = useState<string>('Hyderabad');
  const [locationResults, setLocationResults] = useState<StoryLocation[]>(POPULAR_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<StoryLocation | null>(null);
  const [isLocationSearching, setIsLocationSearching] = useState(false);

  // Search locations via Nominatim API with fallback to POPULAR_LOCATIONS
  const handleSearchLocations = async () => {
    const q = locationSearchQuery.trim();
    if (!q) {
      setLocationResults(POPULAR_LOCATIONS);
      return;
    }
    setIsLocationSearching(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=15`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: StoryLocation[] = data.map((item: any, idx: number) => {
          const parts = (item.display_name || '').split(',');
          const mainTitle = parts[0]?.trim() || item.name || q;
          const subTitle = parts.slice(1, 4).join(',').trim() || parts.slice(1).join(',').trim();
          return {
            id: `osm_${item.place_id || idx}_${Date.now()}`,
            name: mainTitle,
            subtitle: subTitle || item.display_name,
            city: item.address?.city || item.address?.town || mainTitle,
            country: item.address?.country,
          };
        });
        setLocationResults(mapped);
      } else {
        const queryLower = q.toLowerCase();
        setLocationResults(
          POPULAR_LOCATIONS.filter(
            (l) =>
              l.name.toLowerCase().includes(queryLower) ||
              l.subtitle.toLowerCase().includes(queryLower)
          )
        );
      }
    } catch {
      const queryLower = q.toLowerCase();
      setLocationResults(
        POPULAR_LOCATIONS.filter(
          (l) =>
            l.name.toLowerCase().includes(queryLower) ||
            l.subtitle.toLowerCase().includes(queryLower)
        )
      );
    } finally {
      setIsLocationSearching(false);
    }
  };

  // Tag filter
  const handleLocationTagSelect = (tag: string) => {
    setActiveLocationTag(tag);
    setLocationSearchQuery(tag);
    const tagLower = tag.toLowerCase();
    const filtered = POPULAR_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(tagLower) ||
        l.subtitle.toLowerCase().includes(tagLower)
    );
    if (filtered.length > 0) {
      setLocationResults(filtered);
    } else {
      setLocationResults(POPULAR_LOCATIONS);
    }
  };

  // Select location
  const handleSelectLocation = (loc: StoryLocation) => {
    setSelectedLocation(loc);
    setIsLocationModalOpen(false);
  };

  useEffect(() => {
    if (activeTool === 'rotate') {
      setInitialRotationOnOpen(rotation);
    } else if (activeTool === 'adjust') {
      setInitialAdjustmentsOnOpen({ ...adjustments });
    } else if (activeTool === 'stickers') {
      setInitialStickersOnOpen([...stickers]);
    } else if (activeTool === 'text') {
      setInitialTextsOnOpen([...textOverlays]);
      if (selectedTextId) {
        const found = textOverlays.find((t) => t.id === selectedTextId);
        if (found) {
          setCurrentTextInput(found.text);
          setTextColor(found.color);
          setTextFont(found.fontFamily || 'Default');
        }
      }
    }
  }, [activeTool]);

  // Inject Google Fonts on Web for Bebas Neue, Montserrat, Pacifico, Playfair Display
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('hubb-google-fonts')) {
        const link = document.createElement('link');
        link.id = 'hubb-google-fonts';
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;700&family=Pacifico&family=Playfair+Display:wght@600&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  // ── Auto-Draft Tracking & Synchronization ──
  const latestStateRef = useRef({
    selectedMedia,
    caption,
    selectedFilter,
    adjustments,
    appliedCrop,
    aspectRatio,
    zoomLevel,
    rotation,
    stickers,
    textOverlays,
    selectedMusic,
    selectedLocation,
    hasPosted: false,
    activeDraftId: activeDraftIdRef.current,
  });

  useEffect(() => {
    latestStateRef.current = {
      selectedMedia,
      caption,
      selectedFilter,
      adjustments,
      appliedCrop,
      aspectRatio,
      zoomLevel,
      rotation,
      stickers,
      textOverlays,
      selectedMusic,
      selectedLocation,
      hasPosted: hasPostedRef.current,
      activeDraftId: activeDraftIdRef.current,
    };
  });

  const hasMediaOrEdits = () => {
    const s = latestStateRef.current;
    return Boolean(
      s.selectedMedia?.uri ||
      s.selectedMedia?.thumbnailUri ||
      s.caption.trim() ||
      s.textOverlays.length > 0 ||
      s.stickers.length > 0 ||
      s.selectedFilter !== 'Original' ||
      s.rotation !== 0 ||
      s.adjustments.blur !== 0 ||
      s.adjustments.temperature !== 0 ||
      s.adjustments.tint !== 0 ||
      s.adjustments.saturation !== 100 ||
      s.adjustments.vibrance !== 100 ||
      s.adjustments.sharpness !== 0 ||
      s.adjustments.opacity !== 100 ||
      s.appliedCrop !== null ||
      s.selectedMusic !== null ||
      s.selectedLocation !== null
    );
  };

  const autoSaveDraftDirect = (silent = true) => {
    if (hasPostedRef.current) return;
    const s = latestStateRef.current;
    const hasContent = Boolean(
      s.selectedMedia?.uri ||
      s.selectedMedia?.thumbnailUri ||
      s.caption.trim() ||
      s.textOverlays.length > 0 ||
      s.stickers.length > 0 ||
      s.selectedFilter !== 'Original' ||
      s.rotation !== 0 ||
      s.adjustments.blur !== 0 ||
      s.adjustments.temperature !== 0 ||
      s.adjustments.tint !== 0 ||
      s.adjustments.saturation !== 100 ||
      s.adjustments.vibrance !== 100 ||
      s.adjustments.sharpness !== 0 ||
      s.adjustments.opacity !== 100 ||
      s.appliedCrop !== null ||
      s.selectedMusic !== null ||
      s.selectedLocation !== null
    );
    if (!hasContent) return;

    const draftId = activeDraftIdRef.current || `draft_${Date.now()}`;
    activeDraftIdRef.current = draftId;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newDraft: SavedDraftItem = {
      id: draftId,
      mediaUri: s.selectedMedia?.uri || s.selectedMedia?.thumbnailUri || null,
      mediaType: s.selectedMedia?.type || 'image',
      caption: s.caption.trim(),
      savedAt: `Today, ${timeStr}`,
      selectedMedia: s.selectedMedia ? { ...s.selectedMedia } : null,
      filter: s.selectedFilter,
      adjustments: { ...s.adjustments },
      crop: s.appliedCrop ? { ...s.appliedCrop } : null,
      aspectRatio: s.aspectRatio,
      zoomLevel: s.zoomLevel,
      rotation: s.rotation,
      stickers: [...s.stickers],
      texts: [...s.textOverlays],
      music: s.selectedMusic ? { ...s.selectedMusic } : null,
      location: s.selectedLocation || null,
    };

    const currentDrafts = loadPersistedDrafts();
    const updated = [newDraft, ...currentDrafts.filter((d) => d.id !== draftId)];
    savePersistedDrafts(updated);
    setSavedDrafts(updated);
    setDraftsCount(updated.length);
    setDraftSavedTime('Just now');
    isDraftSavedRef.current = true;

    if (!silent) {
      Alert.alert('Draft Saved', 'Your HUBB draft has been saved successfully.');
    }
  };

  const handleExitWithAutoDraft = () => {
    stopAudio();
    if (!hasPostedRef.current && hasMediaOrEdits()) {
      autoSaveDraftDirect(true);
    }
    onClose();
  };

  const handleLoadDraft = (draft: SavedDraftItem) => {
    // 1. Remove from drafts list when resumed
    handleDeleteDraft(draft.id);
    activeDraftIdRef.current = null;
    isDraftSavedRef.current = false;

    // 2. Load draft media & configuration
    if (draft.selectedMedia) {
      setSelectedMedia(draft.selectedMedia);
    } else if (draft.mediaUri) {
      setSelectedMedia({
        uri: draft.mediaUri,
        type: draft.mediaType || 'image',
        fileName: 'draft_media',
      });
    }
    setCaption(draft.caption || '');
    if (draft.filter) setSelectedFilter(draft.filter);
    if (draft.adjustments) setAdjustments(draft.adjustments);
    if (draft.crop !== undefined) setAppliedCrop(draft.crop);
    if (draft.aspectRatio) setAspectRatio(draft.aspectRatio);
    if (draft.zoomLevel) setZoomLevel(draft.zoomLevel);
    if (draft.rotation !== undefined) {
      setRotation(draft.rotation);
      setRotationHistory([draft.rotation]);
      setHistoryIndex(0);
    }
    if (draft.stickers) setStickers(draft.stickers);
    if (draft.texts) setTextOverlays(draft.texts);
    if (draft.music !== undefined) setSelectedMusic(draft.music);
    if (draft.location !== undefined) setSelectedLocation(draft.location);

    // 3. Scroll up to the media section so user immediately sees their content
    setTimeout(() => {
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 50);

    Alert.alert('Draft Resumed', 'Your draft has been loaded into media and removed from drafts. You can continue editing or share it.');
  };

  const handleDeleteDraft = (draftId: string) => {
    if (activeDraftIdRef.current === draftId) {
      activeDraftIdRef.current = null;
    }
    const currentDrafts = loadPersistedDrafts();
    const updated = currentDrafts.filter((d) => d.id !== draftId);
    savePersistedDrafts(updated);
    setSavedDrafts(updated);
    setDraftsCount(updated.length);
  };

  // Hardware back press handler on Android
  useEffect(() => {
    const onBackPress = () => {
      if (activeTool) {
        setActiveTool(null);
        return true;
      }
      if (isPreviewMode) {
        setIsPreviewMode(false);
        return true;
      }
      handleExitWithAutoDraft();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [activeTool, isPreviewMode]);

  // Unmount auto-save cleanup
  useEffect(() => {
    return () => {
      stopAudioPreview();
      const s = latestStateRef.current;
      if (s.hasPosted) return;
      const hasContent = Boolean(
        s.selectedMedia?.uri ||
        s.selectedMedia?.thumbnailUri ||
        s.caption.trim() ||
        s.textOverlays.length > 0 ||
        s.stickers.length > 0 ||
        s.selectedFilter !== 'Original' ||
        s.rotation !== 0 ||
        s.adjustments.blur !== 0 ||
        s.adjustments.temperature !== 0 ||
        s.adjustments.tint !== 0 ||
        s.adjustments.saturation !== 100 ||
        s.adjustments.vibrance !== 100 ||
        s.adjustments.sharpness !== 0 ||
        s.adjustments.opacity !== 100 ||
        s.appliedCrop !== null ||
        s.selectedMusic !== null ||
        s.selectedLocation !== null
      );
      if (!hasContent) return;

      const draftId = s.activeDraftId || `draft_${Date.now()}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newDraft: SavedDraftItem = {
        id: draftId,
        mediaUri: s.selectedMedia?.uri || s.selectedMedia?.thumbnailUri || null,
        mediaType: s.selectedMedia?.type || 'image',
        caption: s.caption.trim(),
        savedAt: `Today, ${timeStr}`,
        selectedMedia: s.selectedMedia ? { ...s.selectedMedia } : null,
        filter: s.selectedFilter,
        adjustments: { ...s.adjustments },
        crop: s.appliedCrop ? { ...s.appliedCrop } : null,
        aspectRatio: s.aspectRatio,
        zoomLevel: s.zoomLevel,
        rotation: s.rotation,
        stickers: [...s.stickers],
        texts: [...s.textOverlays],
        music: s.selectedMusic ? { ...s.selectedMusic } : null,
        location: s.selectedLocation || null,
      };

      const existingDrafts = loadPersistedDrafts();
      const updated = [newDraft, ...existingDrafts.filter((d) => d.id !== draftId)];
      savePersistedDrafts(updated);
    };
  }, []);

  const SAMPLE_PALETTES = [
    '#3E2723', // deep warm mocha
    '#D7CCC8', // cream blazer
    '#5D4037', // rich cocoa
    '#8D6E63', // taupe
    '#2E7D32', // botanical foliage green
    '#1E293B', // dark slate
    '#7C3AED', // signature purple
    '#F59E0B', // amber highlight
  ];
  const [sampleColorIndex, setSampleColorIndex] = useState(0);

  const handleTextChange = (text: string) => {
    setCurrentTextInput(text);
    if (selectedTextId) {
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, text } : t))
      );
    }
  };

  const handleColorChange = (color: string) => {
    setTextColor(color);
    if (selectedTextId) {
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, color } : t))
      );
    }
  };

  const handleFontChange = (font: string) => {
    setTextFont(font);
    setIsFontDropdownOpen(false);
    if (selectedTextId) {
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, fontFamily: font } : t))
      );
    }
  };

  const handleSampleColorFromMedia = async () => {
    let nextColor = '';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          nextColor = result.sRGBHex;
        }
      } catch (err) {
        // Fallback to palette below
      }
    }
    if (!nextColor) {
      nextColor = SAMPLE_PALETTES[sampleColorIndex % SAMPLE_PALETTES.length];
      setSampleColorIndex((prev) => prev + 1);
    }
    handleColorChange(nextColor);
  };

  const handleIncreaseTextScale = () => {
    if (selectedTextId) {
      const newScale = Math.min(3.5, Number((((selectedTextOverlay?.scale || 1) + 0.2)).toFixed(1)));
      setTextScale(newScale);
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, scale: newScale } : t))
      );
    } else {
      setTextScale((prev) => Math.min(3.5, Number((prev + 0.2).toFixed(1))));
    }
  };

  const handleDecreaseTextScale = () => {
    if (selectedTextId) {
      const newScale = Math.max(0.4, Number((((selectedTextOverlay?.scale || 1) - 0.2)).toFixed(1)));
      setTextScale(newScale);
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, scale: newScale } : t))
      );
    } else {
      setTextScale((prev) => Math.max(0.4, Number((prev - 0.2).toFixed(1))));
    }
  };

  const handleRotateTextCCW = () => {
    if (selectedTextId) {
      const newRot = ((selectedTextOverlay?.rotation || 0) - 15 + 360) % 360;
      setTextRotation(newRot);
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, rotation: newRot } : t))
      );
    } else {
      setTextRotation((prev) => (prev - 15 + 360) % 360);
    }
  };

  const handleRotateTextCW = () => {
    if (selectedTextId) {
      const newRot = ((selectedTextOverlay?.rotation || 0) + 15) % 360;
      setTextRotation(newRot);
      setTextOverlays((prev) =>
        prev.map((t) => (t.id === selectedTextId ? { ...t, rotation: newRot } : t))
      );
    } else {
      setTextRotation((prev) => (prev + 15) % 360);
    }
  };

  const handleAddOrUpdateText = () => {
    const textToCommit = currentTextInput.trim();
    if (!textToCommit) {
      Alert.alert('Please enter text', 'Type some text in the input box before adding.');
      return;
    }

    if (selectedTextId) {
      setTextOverlays((prev) =>
        prev.map((t) =>
          t.id === selectedTextId
            ? {
                ...t,
                text: textToCommit,
                color: textColor,
                fontFamily: textFont,
                rotation: textRotation,
                scale: textScale,
              }
            : t
        )
      );
      setSelectedTextId(null);
      setCurrentTextInput('');
      setTextScale(1);
      setTextRotation(0);
    } else {
      const newId = `txt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newText: TextOverlay = {
        id: newId,
        text: textToCommit,
        color: textColor,
        fontFamily: textFont,
        fontSize: 26,
        x: liveTextPos.x,
        y: liveTextPos.y,
        rotation: textRotation,
        scale: textScale,
      };
      setTextOverlays((prev) => [...prev, newText]);
      setSelectedTextId(newId);
      setCurrentTextInput('');
      setLiveTextPos((prev) => ({
        x: 50,
        y: Math.min(75, prev.y + 12),
      }));
    }
    // Keep user in editor so they see their text on the canvas and can drag/style it!
  };

  const handleCancelText = () => {
    setTextOverlays(initialTextsOnOpen);
    setSelectedTextId(null);
    setCurrentTextInput('');
    setTextScale(1);
    setTextRotation(0);
    setActiveTool(null);
  };

  const handleApplyText = () => {
    let nextOverlays = [...textOverlays];
    const textToCommit = currentTextInput.trim();
    if (textToCommit) {
      if (selectedTextId) {
        nextOverlays = nextOverlays.map((t) =>
          t.id === selectedTextId
            ? {
                ...t,
                text: textToCommit,
                color: textColor,
                fontFamily: textFont,
                rotation: textRotation,
                scale: textScale,
              }
            : t
        );
      } else {
        const newId = `txt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        nextOverlays.push({
          id: newId,
          text: textToCommit,
          color: textColor,
          fontFamily: textFont,
          fontSize: 26,
          x: liveTextPos.x,
          y: liveTextPos.y,
          rotation: textRotation,
          scale: textScale,
        });
      }
    }
    setTextOverlays(nextOverlays);
    setSelectedTextId(null);
    setCurrentTextInput('');
    setTextScale(1);
    setTextRotation(0);
    setActiveTool(null);
  };

  const applyRotation = (newDeg: number, recordHistory: boolean = true) => {
    const normalized = Math.round(((newDeg % 360) + 360) % 360);
    setRotation(normalized);
    currentRotationRef.current = normalized;
    if (recordHistory) {
      setRotationHistory((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === normalized) return prev;
        const nextHistory = prev.slice(0, historyIndex + 1);
        return [...nextHistory, normalized];
      });
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const handleUndoRotate = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      const prevRot = rotationHistory[nextIdx];
      setRotation(prevRot);
      currentRotationRef.current = prevRot;
    } else {
      applyRotation((rotation - 90 + 360) % 360);
    }
  };

  const handleRedoRotate = () => {
    if (historyIndex < rotationHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const nextRot = rotationHistory[nextIdx];
      setRotation(nextRot);
      currentRotationRef.current = nextRot;
    } else {
      applyRotation((rotation + 90) % 360);
    }
  };

  const handleCancelRotate = () => {
    setRotation(initialRotationOnOpen);
    currentRotationRef.current = initialRotationOnOpen;
    setActiveTool(null);
  };

  const handleApplyRotate = () => {
    setActiveTool(null);
  };

  const rotateSliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        if (sliderTrackWidth > 0) {
          const ratio = Math.max(0, Math.min(1, x / sliderTrackWidth));
          const newDeg = Math.round(ratio * 360);
          rotationStartRef.current = newDeg;
          currentRotationRef.current = newDeg;
          setRotation(newDeg);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (sliderTrackWidth > 0) {
          const deltaDeg = (gestureState.dx / sliderTrackWidth) * 360;
          let newDeg = Math.round(rotationStartRef.current + deltaDeg);
          newDeg = Math.max(0, Math.min(360, newDeg));
          currentRotationRef.current = newDeg;
          setRotation(newDeg);
        }
      },
      onPanResponderRelease: () => {
        applyRotation(currentRotationRef.current);
      },
    })
  ).current;

  // Two-Finger Pinch to Zoom for Crop Page
  const cropPinchStartDistRef = useRef<number | null>(null);
  const cropPinchStartZoomRef = useRef<number>(zoomLevel);

  const handleCropTouchStart = (e: any) => {
    if (activeTool !== 'crop') return;
    const touches = e.nativeEvent?.touches;
    if (touches && touches.length === 2) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      cropPinchStartDistRef.current = Math.hypot(dx, dy);
      cropPinchStartZoomRef.current = zoomLevel;
    }
  };

  const handleCropTouchMove = (e: any) => {
    if (activeTool !== 'crop') return;
    const touches = e.nativeEvent?.touches;
    if (touches && touches.length === 2 && cropPinchStartDistRef.current) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / cropPinchStartDistRef.current;
      const newZoom = Math.min(300, Math.max(100, Math.round(cropPinchStartZoomRef.current * ratio)));
      setZoomLevel(newZoom);
    }
  };

  const handleCropTouchEnd = () => {
    cropPinchStartDistRef.current = null;
  };

  const getAspectRatioValue = (ratio: string): number | undefined => {
    switch (ratio) {
      case '1:1': return 1;
      case '4:5': return 4 / 5;
      case '3:4': return 3 / 4;
      case '16:9': return 16 / 9;
      case '9:16': return 9 / 16;
      case 'Story': return 9 / 16;
      default: return undefined;
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 100));
  const zoomPercent = (zoomLevel - 100) / 200;

  const handleApplyCrop = () => {
    setAppliedCrop({ aspect: aspectRatio, zoom: zoomLevel });
    setActiveTool(null);
  };

  const handleResetCrop = () => {
    setAspectRatio('Free');
    setZoomLevel(100);
    applyRotation(0);
    setAppliedCrop(null);
  };

  const zoomTrackWidth = 200; // approximate width of the slider track
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new zoom based on position (clamped 100 to 300)
        // dx is change in X. We need a way to track start.
        // It's easier to just compute it if we keep track of start, but we can do a simpler approach:
        // just use the event locationX if we only drag within the track.
        // For a more robust slider, we use gestureState.dx from the previous zoom level on start.
      },
    })
  ).current;

  // Let's implement a simpler stateful pan responder
  const currentZoomRef = useRef(zoomLevel);
  useEffect(() => {
    currentZoomRef.current = zoomLevel;
  }, [zoomLevel]);

  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        currentZoomRef.current = zoomLevel; // snapshot on start
      },
      onPanResponderMove: (evt, gestureState) => {
        const deltaZoom = (gestureState.dx / 150) * 200; // 150px track length approx
        let newZoom = Math.round(currentZoomRef.current + deltaZoom);
        if (newZoom > 300) newZoom = 300;
        if (newZoom < 100) newZoom = 100;
        setZoomLevel(newZoom);
      },
    })
  ).current;

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
    setCameraModalMode('camera_only');
    setIsCameraModalOpen(true);
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
    setCameraModalMode('change_media');
    setIsCameraModalOpen(true);
  };

  const handleSaveDraft = () => {
    if (!hasMediaOrEdits()) {
      Alert.alert('No Content', 'Please select a photo/video or add content before saving as a draft.');
      return;
    }
    autoSaveDraftDirect(false);
  };

  const handlePublish = () => {
    hasPostedRef.current = true;
    if (activeDraftIdRef.current) {
      const updated = loadPersistedDrafts().filter((d) => d.id !== activeDraftIdRef.current);
      savePersistedDrafts(updated);
      setSavedDrafts(updated);
      setDraftsCount(updated.length);
    }
    let finalTexts = [...textOverlays];
    const textToCommit = currentTextInput.trim();
    if (textToCommit) {
      if (selectedTextId) {
        finalTexts = finalTexts.map((t) =>
          t.id === selectedTextId
            ? {
                ...t,
                text: textToCommit,
                color: textColor,
                fontFamily: textFont,
                rotation: textRotation,
                scale: textScale,
              }
            : t
        );
      } else {
        finalTexts.push({
          id: `txt_${Date.now()}`,
          text: textToCommit,
          color: textColor,
          fontFamily: textFont,
          fontSize: 26,
          x: liveTextPos.x,
          y: liveTextPos.y,
          rotation: textRotation,
          scale: textScale,
        });
      }
    }

    const finalMedia =
      selectedMedia?.uri ||
      selectedMedia?.thumbnailUri ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';
    const isAdjusted =
      adjustments.temperature !== 0 ||
      adjustments.tint !== 0 ||
      adjustments.saturation !== 100 ||
      adjustments.vibrance !== 100 ||
      adjustments.sharpness !== 0 ||
      adjustments.blur !== 0 ||
      adjustments.opacity !== 100;

    stopAudioPreview();
    onPublishStory({
      mediaUri: finalMedia,
      caption: caption.trim() || 'Sharing my vibe with the world! ✨',
      mediaType: selectedMedia?.type ?? 'image',
      thumbnailUri: selectedMedia?.type === 'video' ? (selectedMedia?.thumbnailUri || undefined) : undefined,
      filter: selectedFilter !== 'Original' ? selectedFilter : undefined,
      crop: appliedCrop || (aspectRatio !== 'Free' ? { aspect: aspectRatio, zoom: zoomLevel } : undefined),
      rotation: rotation || undefined,
      adjustments: isAdjusted ? { ...adjustments } : undefined,
      stickers: stickers.length > 0 ? stickers : undefined,
      texts: finalTexts.length > 0 ? finalTexts : undefined,
      music: selectedMusic || undefined,
      location: selectedLocation || undefined,
    });
    setIsPreviewMode(false);
  };

  const renderMusicModal = () => (
    <Modal
      visible={isMusicModalOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        stopAudio();
        setIsMusicModalOpen(false);
      }}
    >
      <View style={styles.musicModalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            stopAudio();
            setIsMusicModalOpen(false);
          }}
        />
        <View style={[styles.musicSheetContainer, isDark && styles.musicSheetContainerDark]}>
          {/* 1. Top Header Row */}
          <View style={styles.musicSheetHeader}>
            <View style={styles.musicSheetHeaderLeft}>
              <View style={styles.musicSheetIconCircle}>
                <Feather name="music" size={17} color="#7C3AED" />
              </View>
              <Text style={[styles.musicSheetTitle, isDark && styles.musicSheetTitleDark]}>
                Add Music to HUBB
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.musicSheetCloseBtn, isDark && styles.musicSheetCloseBtnDark]}
              onPress={() => {
                stopAudio();
                setIsMusicModalOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={isDark ? '#E5E7EB' : '#4B5563'} />
            </TouchableOpacity>
          </View>

          {/* 2. Search Bar Row */}
          <View style={styles.musicSearchRow}>
            <TextInput
              style={[styles.musicSearchInput, isDark && styles.musicSearchInputDark]}
              placeholder="Search music, artists..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              value={musicSearchQuery}
              onChangeText={setMusicSearchQuery}
              onSubmitEditing={handleSearchMusic}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.musicSearchBtn}
              activeOpacity={0.8}
              onPress={handleSearchMusic}
            >
              {isMusicSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.musicSearchBtnText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 3. Horizontal Genre Pills */}
          <View style={styles.musicGenresWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.musicGenresScroll}
            >
              {MUSIC_GENRES.map((genre) => {
                const isSelected = activeMusicGenre === genre;
                return (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.musicGenreTag,
                      isSelected && styles.musicGenreTagSelected,
                      isDark && !isSelected && styles.musicGenreTagDark,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleGenreSelect(genre)}
                  >
                    <Text
                      style={[
                        styles.musicGenreTagText,
                        isSelected && styles.musicGenreTagTextSelected,
                        isDark && !isSelected && styles.musicGenreTagTextDark,
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 4. Import from Device Box */}
          <View style={[styles.musicImportBox, isDark && styles.musicImportBoxDark]}>
            <View style={styles.musicImportLeft}>
              <View style={styles.musicImportFolderIcon}>
                <Text style={{ fontSize: 24 }}>📁</Text>
              </View>
              <View style={styles.musicImportTextGroup}>
                <Text style={[styles.musicImportTitle, isDark && styles.musicImportTitleDark]}>
                  Import from Device
                </Text>
                <Text style={styles.musicImportSubtitle}>
                  MP3, WAV, M4A, AAC, OGG, WebM (Max 100MB)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.musicChooseFileBtn, isDark && styles.musicChooseFileBtnDark]}
              activeOpacity={0.75}
              onPress={handleImportDeviceAudio}
            >
              <Text style={styles.musicChooseFileText}>Choose File</Text>
            </TouchableOpacity>

            {/* Hidden HTML input for web audio pick */}
            {Platform.OS === 'web' && (
              <input
                id="hubb-audio-file-input"
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={handleWebAudioPicked}
              />
            )}
          </View>

          {/* 5. Track List (Scrollable) */}
          <ScrollView
            style={styles.musicTrackList}
            contentContainerStyle={styles.musicTrackListContent}
            showsVerticalScrollIndicator={false}
          >
            {musicTracks.length === 0 ? (
              <View style={styles.musicEmptyState}>
                <Feather name="music" size={32} color="#D1D5DB" />
                <Text style={styles.musicEmptyText}>No songs found. Try another search!</Text>
              </View>
            ) : (
              musicTracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                const isSelected = selectedMusic?.id === track.id;
                return (
                  <View
                    key={track.id}
                    style={[styles.musicTrackRow, isDark && styles.musicTrackRowDark]}
                  >
                    {/* Artwork with play/pause touch */}
                    <TouchableOpacity
                      style={styles.musicArtworkWrap}
                      activeOpacity={0.8}
                      onPress={() => togglePlayMusic(track)}
                    >
                      <Image source={{ uri: track.artwork }} style={styles.musicArtwork} />
                      <View
                        style={[
                          styles.musicArtworkPlayOverlay,
                          isPlaying && styles.musicArtworkPlayOverlayActive,
                        ]}
                      >
                        {isPlaying ? (
                          <Ionicons name="pause" size={18} color="#FFFFFF" />
                        ) : (
                          <Ionicons
                            name="play"
                            size={18}
                            color="#FFFFFF"
                            style={{ marginLeft: 2 }}
                          />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Title & Artist */}
                    <TouchableOpacity
                      style={styles.musicTrackInfo}
                      activeOpacity={0.7}
                      onPress={() => togglePlayMusic(track)}
                    >
                      <View style={styles.musicTitleRow}>
                        <Text
                          style={[styles.musicTrackTitle, isDark && styles.musicTrackTitleDark]}
                          numberOfLines={1}
                        >
                          {track.title}
                        </Text>
                      </View>
                      <Text style={styles.musicTrackArtist} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </TouchableOpacity>

                    {/* Select Button */}
                    <TouchableOpacity
                      style={[
                        styles.musicSelectBtn,
                        isSelected && styles.musicSelectBtnSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectTrack(track)}
                    >
                      <Text style={styles.musicSelectBtnText}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderLocationModal = () => (
    <Modal
      visible={isLocationModalOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsLocationModalOpen(false)}
    >
      <View style={styles.musicModalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setIsLocationModalOpen(false)}
        />
        <View style={[styles.musicSheetContainer, isDark && styles.musicSheetContainerDark]}>
          {/* Header Row */}
          <View style={styles.musicSheetHeader}>
            <View style={styles.musicSheetHeaderLeft}>
              <View style={styles.locSheetIconCircle}>
                <Text style={{ fontSize: 16 }}>📍</Text>
              </View>
              <Text style={[styles.musicSheetTitle, isDark && styles.musicSheetTitleDark]}>
                Add Location to HUBB
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.musicSheetCloseBtn, isDark && styles.musicSheetCloseBtnDark]}
              onPress={() => setIsLocationModalOpen(false)}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={isDark ? '#E5E7EB' : '#4B5563'} />
            </TouchableOpacity>
          </View>

          {/* Search Row */}
          <View style={styles.locSearchRow}>
            <TextInput
              style={[styles.locSearchInput, isDark && styles.locSearchInputDark]}
              placeholder="Search location..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              value={locationSearchQuery}
              onChangeText={setLocationSearchQuery}
              onSubmitEditing={handleSearchLocations}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.musicSearchBtn}
              activeOpacity={0.8}
              onPress={handleSearchLocations}
            >
              {isLocationSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.musicSearchBtnText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Location Tags Horizontal Scroll */}
          <View style={styles.locTagsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.locTagsScroll}
            >
              {POPULAR_LOCATION_TAGS.map((tag) => {
                const isSelected = activeLocationTag.toLowerCase() === tag.toLowerCase();
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.locTagBtn,
                      isSelected && styles.locTagBtnSelected,
                      isDark && !isSelected && styles.locTagBtnDark,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleLocationTagSelect(tag)}
                  >
                    <Text
                      style={[
                        styles.locTagBtnText,
                        isSelected && styles.locTagBtnTextSelected,
                        isDark && !isSelected && styles.locTagBtnTextDark,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Location Results List */}
          <ScrollView
            style={styles.locResultsList}
            contentContainerStyle={styles.locResultsContent}
            showsVerticalScrollIndicator={false}
          >
            {locationResults.length === 0 ? (
              <View style={styles.musicEmptyState}>
                <Feather name="map-pin" size={32} color="#D1D5DB" />
                <Text style={styles.musicEmptyText}>No locations found. Try another search!</Text>
              </View>
            ) : (
              locationResults.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <View
                    key={loc.id}
                    style={[styles.locItemRow, isDark && styles.locItemRowDark]}
                  >
                    {/* Left Pin Icon in Soft Circle */}
                    <View style={styles.locItemPinCircle}>
                      <Text style={{ fontSize: 16 }}>📍</Text>
                    </View>

                    {/* Middle Title and Subtitle */}
                    <TouchableOpacity
                      style={styles.locItemInfo}
                      activeOpacity={0.7}
                      onPress={() => handleSelectLocation(loc)}
                    >
                      <Text
                        style={[styles.locItemTitle, isDark && styles.locItemTitleDark]}
                        numberOfLines={1}
                      >
                        {loc.name}
                      </Text>
                      <Text style={styles.locItemSubtitle} numberOfLines={1}>
                        {loc.subtitle}
                      </Text>
                    </TouchableOpacity>

                    {/* Right Select Button */}
                    <TouchableOpacity
                      style={[
                        styles.musicSelectBtn,
                        isSelected && styles.musicSelectBtnSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectLocation(loc)}
                    >
                      <Text style={styles.musicSelectBtnText}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const renderCalendarModal = () => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startDayOfWeek = new Date(calYear, calMonth, 1).getDay();

    const blanks = Array.from({ length: startDayOfWeek });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isDaySelected = (day: number) => {
      const dStr = String(day).padStart(2, '0');
      const mStr = String(calMonth + 1).padStart(2, '0');
      return scheduledDate === `${dStr}-${mStr}-${calYear}`;
    };

    const isDayToday = (day: number) => {
      const t = new Date();
      return (
        t.getDate() === day &&
        t.getMonth() === calMonth &&
        t.getFullYear() === calYear
      );
    };

    const handleSelectDay = (day: number) => {
      const dStr = String(day).padStart(2, '0');
      const mStr = String(calMonth + 1).padStart(2, '0');
      setScheduledDate(`${dStr}-${mStr}-${calYear}`);
    };

    const handleConfirmDate = () => {
      setIsCalendarOpen(false);
    };

    const handlePrevMonth = () => {
      if (calMonth === 0) {
        setCalMonth(11);
        setCalYear((prev) => prev - 1);
      } else {
        setCalMonth((prev) => prev - 1);
      }
    };

    const handleNextMonth = () => {
      if (calMonth === 11) {
        setCalMonth(0);
        setCalYear((prev) => prev + 1);
      } else {
        setCalMonth((prev) => prev + 1);
      }
    };

    const setQuickDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      const dStr = String(d.getDate()).padStart(2, '0');
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const yStr = d.getFullYear();
      setScheduledDate(`${dStr}-${mStr}-${yStr}`);
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());
    };

    return (
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <View style={styles.pickerModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCalendarOpen(false)}
          />
          <View style={[styles.calendarModalCard, isDark && styles.calendarModalCardDark]}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeaderLeft}>
                <View style={[styles.pickerIconCircle, { backgroundColor: isDark ? '#3D256D' : '#EDE8FD' }]}>
                  <Feather name="calendar" size={18} color="#7C3AED" />
                </View>
                <View>
                  <Text style={[styles.pickerTitle, isDark && styles.pickerTitleDark]}>
                    Select Date
                  </Text>
                  <Text style={[styles.pickerSubtitle, isDark && styles.pickerSubtitleDark]}>
                    Choose when your HUBB goes live
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.pickerCloseBtn, isDark && styles.pickerCloseBtnDark]}
                activeOpacity={0.7}
                onPress={() => setIsCalendarOpen(false)}
              >
                <Feather name="x" size={18} color={isDark ? '#DDD' : '#444'} />
              </TouchableOpacity>
            </View>

            {/* Month & Year Navigation */}
            <View style={[styles.calendarNavRow, isDark && styles.calendarNavRowDark]}>
              <TouchableOpacity
                style={[styles.calendarNavBtn, isDark && styles.calendarNavBtnDark]}
                activeOpacity={0.7}
                onPress={handlePrevMonth}
              >
                <Feather name="chevron-left" size={20} color={isDark ? '#C4A8FF' : '#6535EA'} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonthYearText, isDark && styles.calendarMonthYearTextDark]}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                style={[styles.calendarNavBtn, isDark && styles.calendarNavBtnDark]}
                activeOpacity={0.7}
                onPress={handleNextMonth}
              >
                <Feather name="chevron-right" size={20} color={isDark ? '#C4A8FF' : '#6535EA'} />
              </TouchableOpacity>
            </View>

            {/* Weekday column headers */}
            <View style={styles.calendarWeekdaysRow}>
              {WEEKDAY_NAMES.map((name, idx) => (
                <View key={idx} style={styles.calendarWeekdayCol}>
                  <Text
                    style={[
                      styles.calendarWeekdayText,
                      (idx === 0 || idx === 6) && styles.calendarWeekendText,
                      isDark && styles.calendarWeekdayTextDark,
                    ]}
                  >
                    {name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.calendarGrid}>
              {blanks.map((_, idx) => (
                <View key={`b_${idx}`} style={styles.calendarDayCellEmpty} />
              ))}
              {days.map((day) => {
                const selected = isDaySelected(day);
                const today = isDayToday(day);
                return (
                  <TouchableOpacity
                    key={`d_${day}`}
                    style={[
                      styles.calendarDayCell,
                      isDark && styles.calendarDayCellDark,
                      today && !selected && styles.calendarDayTodayCell,
                      selected && styles.calendarDaySelectedCell,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isDark && styles.calendarDayTextDark,
                        today && !selected && styles.calendarDayTodayText,
                        selected && styles.calendarDaySelectedText,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick date presets */}
            <View style={styles.pickerPresetsRow}>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => setQuickDate(0)}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => setQuickDate(1)}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => setQuickDate(7)}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>Next Week</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.pickerBottomBar}>
              <View style={styles.pickerSelectedInfoWrap}>
                <Text style={[styles.pickerSelectedLabel, isDark && styles.pickerSelectedLabelDark]}>
                  Scheduled Date:
                </Text>
                <Text style={[styles.pickerSelectedValue, isDark && styles.pickerSelectedValueDark]}>
                  {scheduledDate || 'None'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pickerConfirmBtn}
                activeOpacity={0.88}
                onPress={handleConfirmDate}
              >
                <LinearGradient
                  colors={['#6535EA', '#9D4EDD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pickerConfirmBtnGradient}
                >
                  <Text style={styles.pickerConfirmBtnText}>Confirm Date</Text>
                  <Feather name="check" size={17} color="#FFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const renderClockModal = () => {
    const handleConfirmTime = () => {
      const formatted = `${String(clockHour).padStart(2, '0')}:${clockMinute} ${clockPeriod}`;
      setScheduledTime(formatted);
      setIsClockOpen(false);
    };

    const handleSetQuickTime = (type: 'now' | 'plus1h' | 'morning' | 'evening') => {
      const d = new Date();
      if (type === 'now') {
        let h = d.getHours();
        const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const m = Math.floor(d.getMinutes() / 5) * 5;
        setClockHour(h);
        setClockMinute(String(m).padStart(2, '0'));
        setClockPeriod(p);
      } else if (type === 'plus1h') {
        let h = d.getHours() + 1;
        const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const m = Math.floor(d.getMinutes() / 5) * 5;
        setClockHour(h);
        setClockMinute(String(m).padStart(2, '0'));
        setClockPeriod(p);
      } else if (type === 'morning') {
        setClockHour(9);
        setClockMinute('00');
        setClockPeriod('AM');
      } else if (type === 'evening') {
        setClockHour(6);
        setClockMinute('00');
        setClockPeriod('PM');
      }
    };

    return (
      <Modal
        visible={isClockOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsClockOpen(false)}
      >
        <View style={styles.pickerModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsClockOpen(false)}
          />
          <View style={[styles.calendarModalCard, isDark && styles.calendarModalCardDark]}>
            {/* Header */}
            <View style={styles.pickerHeader}>
              <View style={styles.pickerHeaderLeft}>
                <View style={[styles.pickerIconCircle, { backgroundColor: isDark ? '#3D256D' : '#EDE8FD' }]}>
                  <Feather name="clock" size={18} color="#7C3AED" />
                </View>
                <View>
                  <Text style={[styles.pickerTitle, isDark && styles.pickerTitleDark]}>
                    Select Time
                  </Text>
                  <Text style={[styles.pickerSubtitle, isDark && styles.pickerSubtitleDark]}>
                    Pick the exact publish time
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.pickerCloseBtn, isDark && styles.pickerCloseBtnDark]}
                activeOpacity={0.7}
                onPress={() => setIsClockOpen(false)}
              >
                <Feather name="x" size={18} color={isDark ? '#DDD' : '#444'} />
              </TouchableOpacity>
            </View>

            {/* Big Digital Display Card */}
            <View style={[styles.clockDisplayCard, isDark && styles.clockDisplayCardDark]}>
              <View style={styles.clockDigitBox}>
                <Text style={styles.clockDigitValue}>
                  {String(clockHour).padStart(2, '0')}
                </Text>
                <Text style={styles.clockDigitSub}>HOUR</Text>
              </View>
              <Text style={styles.clockColonText}>:</Text>
              <View style={styles.clockDigitBox}>
                <Text style={styles.clockDigitValue}>
                  {clockMinute}
                </Text>
                <Text style={styles.clockDigitSub}>MINUTE</Text>
              </View>

              {/* AM / PM Toggle switch inside card */}
              <View style={styles.clockPeriodWrap}>
                <TouchableOpacity
                  style={[
                    styles.clockPeriodBtn,
                    clockPeriod === 'AM' && styles.clockPeriodBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setClockPeriod('AM')}
                >
                  <Text
                    style={[
                      styles.clockPeriodText,
                      clockPeriod === 'AM' && styles.clockPeriodTextActive,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.clockPeriodBtn,
                    clockPeriod === 'PM' && styles.clockPeriodBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setClockPeriod('PM')}
                >
                  <Text
                    style={[
                      styles.clockPeriodText,
                      clockPeriod === 'PM' && styles.clockPeriodTextActive,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hour Selector */}
            <Text style={[styles.clockSectionLabel, isDark && styles.clockSectionLabelDark]}>
              Hour (1 - 12)
            </Text>
            <View style={styles.clockGrid}>
              {HOURS.map((h) => {
                const isSelected = clockHour === h;
                return (
                  <TouchableOpacity
                    key={`h_${h}`}
                    style={[
                      styles.clockPillBtn,
                      isDark && styles.clockPillBtnDark,
                      isSelected && styles.clockPillBtnActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setClockHour(h)}
                  >
                    <Text
                      style={[
                        styles.clockPillText,
                        isDark && styles.clockPillTextDark,
                        isSelected && styles.clockPillTextActive,
                      ]}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Minute Selector */}
            <Text style={[styles.clockSectionLabel, isDark && styles.clockSectionLabelDark, { marginTop: 12 }]}>
              Minute (5m steps)
            </Text>
            <View style={styles.clockGrid}>
              {MINUTES.map((m) => {
                const isSelected = clockMinute === m;
                return (
                  <TouchableOpacity
                    key={`m_${m}`}
                    style={[
                      styles.clockPillBtn,
                      isDark && styles.clockPillBtnDark,
                      isSelected && styles.clockPillBtnActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setClockMinute(m)}
                  >
                    <Text
                      style={[
                        styles.clockPillText,
                        isDark && styles.clockPillTextDark,
                        isSelected && styles.clockPillTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick time presets */}
            <View style={styles.pickerPresetsRow}>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => handleSetQuickTime('now')}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => handleSetQuickTime('plus1h')}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>+1 Hour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => handleSetQuickTime('morning')}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>9:00 AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerPresetChip, isDark && styles.pickerPresetChipDark]}
                activeOpacity={0.7}
                onPress={() => handleSetQuickTime('evening')}
              >
                <Text style={[styles.pickerPresetText, isDark && styles.pickerPresetTextDark]}>6:00 PM</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.pickerBottomBar}>
              <View style={styles.pickerSelectedInfoWrap}>
                <Text style={[styles.pickerSelectedLabel, isDark && styles.pickerSelectedLabelDark]}>
                  Scheduled Time:
                </Text>
                <Text style={[styles.pickerSelectedValue, isDark && styles.pickerSelectedValueDark]}>
                  {String(clockHour).padStart(2, '0')}:{clockMinute} {clockPeriod}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pickerConfirmBtn}
                activeOpacity={0.88}
                onPress={handleConfirmTime}
              >
                <LinearGradient
                  colors={['#6535EA', '#9D4EDD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pickerConfirmBtnGradient}
                >
                  <Text style={styles.pickerConfirmBtnText}>Set Time</Text>
                  <Feather name="check" size={17} color="#FFF" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMediaRequiredModal = () => (
    <Modal
      visible={isMediaRequiredModalOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsMediaRequiredModalOpen(false)}
    >
      <View style={styles.centeredModalBackdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setIsMediaRequiredModalOpen(false)}
        />
        <View style={[styles.centeredAlertCard, isDark && styles.centeredAlertCardDark]}>
          <View style={styles.alertIconGlowWrap}>
            <LinearGradient
              colors={['#8B5CF6', '#6535EA']}
              style={styles.alertIconCircle}
            >
              <Feather name="image" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.alertTitle, isDark && styles.alertTitleDark]}>
            Add Media First
          </Text>

          <Text style={[styles.alertMessage, isDark && styles.alertMessageDark]}>
            Please select an image or video to start editing with image tools, filters, crop, stickers, and rotation!
          </Text>

          <View style={styles.alertActionsStack}>
            <TouchableOpacity
              style={styles.alertPrimaryBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsMediaRequiredModalOpen(false);
                handleOpenPhotos();
              }}
            >
              <Feather name="folder" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.alertPrimaryBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.alertSecondaryBtn, isDark && styles.alertSecondaryBtnDark]}
              activeOpacity={0.8}
              onPress={() => {
                setIsMediaRequiredModalOpen(false);
                setIsCameraModalOpen(true);
              }}
            >
              <Feather name="camera" size={17} color={isDark ? '#C4A8FF' : '#6535EA'} style={{ marginRight: 8 }} />
              <Text style={[styles.alertSecondaryBtnText, isDark && styles.alertSecondaryBtnTextDark]}>
                Open Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alertCancelBtn}
              activeOpacity={0.7}
              onPress={() => setIsMediaRequiredModalOpen(false)}
            >
              <Text style={[styles.alertCancelText, isDark && styles.alertCancelTextDark]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderInitialView = () => (
    <View style={[styles.modalRoot, isDark && styles.modalRootDark]}>
      {/* Atmosphere Background Gradient like in Home Page */}
      <LinearGradient
        colors={
          isDark
            ? ['#140C2C', '#1B0E3C', '#0A0518']
            : ['#E5F0FF', '#D8E8FC', '#C8DFFA']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Header Row with Back to Home & Title */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={handleExitWithAutoDraft}
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
          ref={mainScrollViewRef}
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
              <View style={styles.mediaPreviewSquareContainer}>
                <View style={[
                  styles.mediaPreviewSquare, 
                  isDark && styles.mediaPreviewSquareDark,
                ]}>
                  {selectedMedia.type === 'video' ? (
                    <VideoPreviewPlayer
                      uri={selectedMedia.uri}
                      duration={selectedMedia.duration}
                      thumbnailUri={selectedMedia.thumbnailUri}
                      scale={1}
                      rotation={rotation}
                      adjustments={adjustments}
                      contentFit="cover"
                      showControls={false}
                      style={styles.mediaPreviewImageSquare}
                    />
                  ) : (
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={[
                        styles.mediaPreviewImageSquare,
                        {
                          opacity: adjustments.opacity / 100,
                          transform: [{ rotate: `${rotation}deg` }],
                          ...getAdjustmentsFilterStyle(adjustments),
                        },
                      ]}
                      blurRadius={adjustments.blur}
                      resizeMode="cover"
                    />
                  )}
                  {/* Applied Adjustments & Filter */}
                  <MediaAdjustmentsOverlay adjustments={adjustments} filter={selectedFilter} />
                  {/* Applied Stickers on Initial Preview */}
                  {stickers.map((stk) => (
                    <View
                      key={stk.id}
                      style={{
                        position: 'absolute',
                        left: `${stk.x}%`,
                        top: `${stk.y}%`,
                        transform: [
                          { translateX: -16 },
                          { translateY: -16 },
                          { rotate: `${stk.rotation}deg` },
                          { scale: stk.scale * 0.75 },
                        ],
                      }}
                      pointerEvents="none"
                    >
                      <Text style={{ fontSize: 28 }}>{stk.emoji}</Text>
                    </View>
                  ))}
                  {/* Applied Texts on Initial Preview */}
                  {textOverlays.map((txt) => (
                    <View
                      key={txt.id}
                      style={{
                        position: 'absolute',
                        left: `${txt.x}%`,
                        top: `${txt.y}%`,
                        transform: [
                          { translateX: -30 },
                          { translateY: -10 },
                          { rotate: `${txt.rotation}deg` },
                          { scale: txt.scale * 0.7 },
                        ],
                      }}
                      pointerEvents="none"
                    >
                      <Text
                        style={{
                          fontSize: Math.round(txt.fontSize * 0.65),
                          color: txt.color,
                          fontFamily: getFontFamilyStyle(txt.fontFamily),
                          fontWeight: txt.fontFamily === 'Bebas Neue' ? '900' : '700',
                          textShadowColor: txt.color === '#FFFFFF' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {txt.text}
                      </Text>
                    </View>
                  ))}
                  {/* Applied Location Tag on Initial Preview */}
                  {selectedLocation && selectedLocation.placedOnMedia && (
                    <View
                      style={{
                        position: 'absolute',
                        left: `${selectedLocation.x ?? 50}%`,
                        top: `${selectedLocation.y ?? 25}%`,
                        transform: [{ translateX: -35 }, { translateY: -12 }],
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        borderRadius: 14,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      }}
                      pointerEvents="none"
                    >
                      <Text style={{ fontSize: 11, marginRight: 4 }}>📍</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                        {selectedLocation.name}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.removeMediaBtnSquare}
                    onPress={() => setSelectedMedia(null)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Add More Media Button */}
                <TouchableOpacity
                  style={[styles.addMoreSquare, isDark && styles.addMoreSquareDark]}
                  onPress={handleChangeMedia}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={28} color={isDark ? '#8A7BB2' : '#6535EA'} />
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
              </View>
            )}

            {selectedMedia && (
              <Text style={styles.reorderText}>You can drag to reorder media</Text>
            )}

            {/* Attached Music Card */}
            {selectedMusic && (
              <View style={[styles.attachedMusicCard, isDark && styles.attachedMusicCardDark]}>
                <Image source={{ uri: selectedMusic.artwork }} style={styles.attachedMusicCover} />
                <View style={styles.attachedMusicInfo}>
                  <View style={styles.attachedMusicTitleRow}>
                    <Feather name="music" size={13} color="#7C3AED" style={{ marginRight: 5 }} />
                    <Text
                      style={[styles.attachedMusicTitle, isDark && styles.attachedMusicTitleDark]}
                      numberOfLines={1}
                    >
                      {selectedMusic.title}
                    </Text>
                  </View>
                  <Text style={styles.attachedMusicArtist} numberOfLines={1}>
                    {selectedMusic.artist}
                  </Text>
                </View>
                <View style={styles.attachedMusicActions}>
                  <TouchableOpacity
                    style={styles.attachedMusicPlayBtn}
                    onPress={() => togglePlayMusic(selectedMusic)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={playingTrackId === selectedMusic.id ? 'pause' : 'play'}
                      size={16}
                      color="#7C3AED"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.attachedMusicChangeBtn}
                    onPress={() => setIsMusicModalOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachedMusicChangeText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.attachedMusicRemoveBtn}
                    onPress={() => {
                      stopAudio();
                      setSelectedMusic(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Attached Location Card */}
            {selectedLocation && (
              <View style={[styles.attachedLocCard, isDark && styles.attachedLocCardDark]}>
                <View style={styles.attachedLocIconWrap}>
                  <Text style={{ fontSize: 18 }}>📍</Text>
                </View>
                <View style={styles.attachedLocInfo}>
                  <Text
                    style={[styles.attachedLocName, isDark && styles.attachedLocNameDark]}
                    numberOfLines={1}
                  >
                    {selectedLocation.name}
                  </Text>
                  <Text style={styles.attachedLocSubtitle} numberOfLines={1}>
                    {selectedLocation.subtitle}
                  </Text>
                </View>
                <View style={styles.attachedLocActions}>
                  <TouchableOpacity
                    style={[
                      styles.attachedLocPlaceBtn,
                      selectedLocation.placedOnMedia && styles.attachedLocPlaceBtnActive,
                      isDark && styles.attachedLocPlaceBtnDark,
                    ]}
                    onPress={() => {
                      if (!selectedMedia) {
                        setIsMediaRequiredModalOpen(true);
                        return;
                      }
                      setSelectedLocation((prev) =>
                        prev
                          ? {
                              ...prev,
                              placedOnMedia: !prev.placedOnMedia,
                              x: prev.x ?? 50,
                              y: prev.y ?? 25,
                            }
                          : null
                      );
                    }}
                    activeOpacity={0.75}
                  >
                    <Feather
                      name={selectedLocation.placedOnMedia ? 'check' : 'move'}
                      size={12}
                      color={selectedLocation.placedOnMedia ? '#FFFFFF' : (isDark ? '#C4A8FF' : '#6535EA')}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.attachedLocPlaceText,
                        selectedLocation.placedOnMedia && styles.attachedLocPlaceTextActive,
                        isDark && styles.attachedLocPlaceTextDark,
                      ]}
                    >
                      {selectedLocation.placedOnMedia ? 'On Media' : 'Place on Media'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.attachedLocChangeBtn}
                    onPress={() => setIsLocationModalOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.attachedLocChangeText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.attachedLocRemoveBtn}
                    onPress={() => setSelectedLocation(null)}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={15} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
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
                    style={styles.toolColNew}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (!selectedMedia) {
                        setIsMediaRequiredModalOpen(true);
                        return;
                      }
                      if (
                        tool.id === 'filters' ||
                        tool.id === 'crop' ||
                        tool.id === 'rotate' ||
                        tool.id === 'adjust' ||
                        tool.id === 'stickers' ||
                        tool.id === 'text'
                      ) {
                        setActiveTool(tool.id);
                      } else if (tool.id === 'music') {
                        setIsMusicModalOpen(true);
                      } else if (tool.id === 'location') {
                        setIsLocationModalOpen(true);
                      } else {
                        Alert.alert('Coming Soon', `The ${tool.label} tool is under construction.`);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.toolBtnNew,
                        isDark && styles.toolBtnNewDark,
                        tool.id === 'music' && selectedMusic && styles.toolBtnNewActiveMusic,
                        tool.id === 'location' && selectedLocation && styles.toolBtnNewActiveMusic,
                      ]}
                    >
                      <Feather
                        name={tool.icon}
                        size={22}
                        color={
                          (tool.id === 'music' && selectedMusic) ||
                          (tool.id === 'location' && selectedLocation)
                            ? '#7C3AED'
                            : isDark
                            ? '#C4A8FF'
                            : '#6535EA'
                        }
                      />
                      {((tool.id === 'music' && selectedMusic) ||
                        (tool.id === 'location' && selectedLocation)) && (
                        <View style={styles.musicToolBadge}>
                          <Feather name="check" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.toolLabelNew, isDark && styles.toolLabelNewDark]}>
                      {tool.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── CARD 3: HUBBS DETAILS & SCHEDULING ── */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitleCentered, isDark && styles.cardTitleCenteredDark]}>
              HUBBs Details & Scheduling
            </Text>

            {/* Sub-card 1: Caption / HUBBs Text */}
            <View style={[styles.detailsSubCard, isDark && styles.detailsSubCardDark]}>
              <Text style={[styles.detailsSubCardTitle, isDark && styles.detailsSubCardTitleDark]}>
                Caption / HUBBs Text
              </Text>
              <View style={[styles.captionInputBox, isDark && styles.captionInputBoxDark]}>
                <TextInput
                  style={[styles.captionTextInput, isDark && styles.captionTextInputDark]}
                  placeholder={'Write a HUBB caption...\n#hashtags @mentions'}
                  placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                  multiline
                  numberOfLines={4}
                  value={caption}
                  onChangeText={setCaption}
                />
              </View>
            </View>

            {/* Sub-card 2: Scheduling */}
            <View style={[styles.detailsSubCard, isDark && styles.detailsSubCardDark]}>
              <TouchableOpacity
                style={styles.schedulingCardRow}
                activeOpacity={0.85}
                onPress={() => setIsScheduling((prev) => !prev)}
              >
                <Text
                  style={[
                    styles.detailsSubCardTitle,
                    isDark && styles.detailsSubCardTitleDark,
                    { marginBottom: 0 },
                  ]}
                >
                  Scheduling
                </Text>
                <View style={styles.schedulingToggleWrap}>
                  <Text
                    style={[
                      styles.schedulingStatusText,
                      isDark && styles.schedulingStatusTextDark,
                      isScheduling && styles.schedulingStatusTextActive,
                    ]}
                  >
                    {isScheduling ? 'Enabled' : 'Disabled'}
                  </Text>
                  <Switch
                    value={isScheduling}
                    onValueChange={setIsScheduling}
                    trackColor={{ false: '#DDD6FE', true: '#7C3AED' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#DDD6FE"
                  />
                </View>
              </TouchableOpacity>

              {/* Date & Time fields when enabled (Image 1) */}
              {isScheduling && (
                <View style={styles.scheduleFieldsRow}>
                  {/* Date Column */}
                  <View style={styles.scheduleFieldCol}>
                    <Text style={[styles.scheduleFieldLabel, isDark && styles.scheduleFieldLabelDark]}>
                      Date / dated
                    </Text>
                    <TouchableOpacity
                      style={[styles.scheduleInputWrap, isDark && styles.scheduleInputWrapDark]}
                      activeOpacity={0.75}
                      onPress={openCalendarModal}
                    >
                      <TextInput
                        style={[styles.scheduleTextInput, isDark && styles.scheduleTextInputDark]}
                        value={scheduledDate}
                        onChangeText={setScheduledDate}
                        placeholder="DD-MM-YYYY"
                        placeholderTextColor={isDark ? '#8A7BB2' : '#9CA3AF'}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={openCalendarModal}
                        style={{ padding: 4 }}
                      >
                        <Feather
                          name="calendar"
                          size={18}
                          color={isDark ? '#C4A8FF' : '#6535EA'}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>

                  {/* Time Column */}
                  <View style={styles.scheduleFieldCol}>
                    <Text style={[styles.scheduleFieldLabel, isDark && styles.scheduleFieldLabelDark]}>
                      Time
                    </Text>
                    <TouchableOpacity
                      style={[styles.scheduleInputWrap, isDark && styles.scheduleInputWrapDark]}
                      activeOpacity={0.75}
                      onPress={openClockModal}
                    >
                      <TextInput
                        style={[styles.scheduleTextInput, isDark && styles.scheduleTextInputDark]}
                        value={scheduledTime}
                        onChangeText={setScheduledTime}
                        placeholder="HH:mm"
                        placeholderTextColor={isDark ? '#8A7BB2' : '#9CA3AF'}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={openClockModal}
                        style={{ padding: 4 }}
                      >
                        <Feather
                          name="clock"
                          size={18}
                          color={isDark ? '#C4A8FF' : '#6535EA'}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Sub-card 3: Media Layouts */}
            <View style={[styles.detailsSubCard, isDark && styles.detailsSubCardDark]}>
              <Text style={[styles.detailsSubCardTitle, isDark && styles.detailsSubCardTitleDark]}>
                Media Layouts
              </Text>
              <Text
                style={[
                  styles.mediaLayoutsSubText,
                  isDark && styles.mediaLayoutsSubTextDark,
                ]}
              >
                Upload two or more media items to enable layouts.
              </Text>
            </View>
          </View>

          {/* ── CARD 4: DRAFTS ── */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            <Text style={[styles.cardTitleCentered, isDark && styles.cardTitleCenteredDark]}>
              Drafts ({savedDrafts.length})
            </Text>

            {savedDrafts.length === 0 ? (
              <View style={[styles.draftsDashedBox, isDark && styles.draftsDashedBoxDark]}>
                {/* SVG Archive / Storage Crate Icon */}
                <View style={styles.draftsBoxIconWrap}>
                  <Svg width={54} height={54} viewBox="0 0 54 54" fill="none">
                    <Rect
                      x="7"
                      y="14"
                      width="40"
                      height="10"
                      rx="3"
                      stroke="#A78BFA"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M10 24L12 40C12.3 42 14 43.5 16 43.5H38C40 43.5 41.7 42 42 40L44 24"
                      stroke="#A78BFA"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Rect
                      x="22"
                      y="29"
                      width="10"
                      height="4"
                      rx="2"
                      stroke="#A78BFA"
                      strokeWidth="2.4"
                    />
                  </Svg>
                </View>
                <Text style={[styles.draftsEmptyTitle, isDark && styles.draftsEmptyTitleDark]}>
                  No Drafts Yet
                </Text>
                <Text style={[styles.draftsEmptySub, isDark && styles.draftsEmptySubDark]}>
                  Your saved HUBBs will appear here.
                </Text>
                <TouchableOpacity
                  style={[styles.startNewHubbBtn, isDark && styles.startNewHubbBtnDark]}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleOpenPhotos();
                  }}
                >
                  <Text style={styles.startNewHubbBtnText}>Start a new HUBB</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {savedDrafts.map((draft, idx) => (
                  <TouchableOpacity
                    key={draft.id}
                    style={[styles.savedDraftRow, isDark && styles.savedDraftRowDark]}
                    activeOpacity={0.75}
                    onPress={() => handleLoadDraft(draft)}
                  >
                    <View style={styles.savedDraftThumbWrap}>
                      {draft.mediaUri ? (
                        <Image source={{ uri: draft.mediaUri }} style={styles.savedDraftThumb} />
                      ) : (
                        <View style={styles.savedDraftThumbPlaceholder}>
                          <Feather name="file-text" size={20} color="#7C3AED" />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[styles.savedDraftTitle, isDark && styles.savedDraftTitleDark]}
                        numberOfLines={1}
                      >
                        {draft.caption || `HUBB Draft #${savedDrafts.length - idx}`}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <Text style={styles.savedDraftTime}>Saved: {draft.savedAt}</Text>
                        <View style={[styles.draftResumeBadge, isDark && styles.draftResumeBadgeDark]}>
                          <Text style={[styles.draftResumeBadgeText, isDark && styles.draftResumeBadgeTextDark]}>
                            Tap to resume
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.savedDraftDeleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={(e) => {
                        // @ts-ignore
                        e?.stopPropagation?.();
                        handleDeleteDraft(draft.id);
                      }}
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.startNewHubbBtn,
                    isDark && styles.startNewHubbBtnDark,
                    { marginTop: 6 },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleOpenPhotos();
                  }}
                >
                  <Text style={styles.startNewHubbBtnText}>Start a new HUBB</Text>
                </TouchableOpacity>
              </View>
            )}
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
            onPress={() => setIsPreviewMode(true)}
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

        {/* ── CAMERA PICKER BOTTOM SHEET MODAL (LAYER SCREEN) ── */}
        <Modal
          visible={isCameraModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsCameraModalOpen(false)}
        >
          <TouchableOpacity 
            style={styles.cameraModalBackdrop}
            activeOpacity={1}
            onPress={() => setIsCameraModalOpen(false)}
          >
            <View 
              style={[styles.cameraModalSheet, isDark && styles.cameraModalSheetDark]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.cameraModalHandle} />

              <Text style={[styles.cameraModalTitle, isDark && styles.cameraModalTitleDark]}>
                Camera
              </Text>

              {/* 1st Option: Take Photo */}
              <TouchableOpacity
                style={[styles.cameraOptionRow, isDark && styles.cameraOptionRowDark]}
                activeOpacity={0.7}
                onPress={() => {
                  setIsCameraModalOpen(false);
                  launchCamera('images');
                }}
              >
                <View style={[styles.cameraOptionIconWrap, isDark && styles.cameraOptionIconWrapDark]}>
                  <Feather name="camera" size={22} color={isDark ? '#C4A8FF' : '#6535EA'} />
                </View>
                <View style={styles.cameraOptionTextWrap}>
                  <Text style={[styles.cameraOptionTitle, isDark && styles.cameraOptionTitleDark]}>
                    Take Photo
                  </Text>
                  <Text style={[styles.cameraOptionDesc, isDark && styles.cameraOptionDescDark]}>
                    Capture a photo using device camera
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={isDark ? '#8A7BB2' : '#AAA'} />
              </TouchableOpacity>

              {/* 2nd Option: Record Video */}
              <TouchableOpacity
                style={[styles.cameraOptionRow, isDark && styles.cameraOptionRowDark]}
                activeOpacity={0.7}
                onPress={() => {
                  setIsCameraModalOpen(false);
                  launchCamera('videos');
                }}
              >
                <View style={[styles.cameraOptionIconWrap, isDark && styles.cameraOptionIconWrapDark]}>
                  <Feather name="video" size={22} color={isDark ? '#C4A8FF' : '#6535EA'} />
                </View>
                <View style={styles.cameraOptionTextWrap}>
                  <Text style={[styles.cameraOptionTitle, isDark && styles.cameraOptionTitleDark]}>
                    Record Video
                  </Text>
                  <Text style={[styles.cameraOptionDesc, isDark && styles.cameraOptionDescDark]}>
                    Record video clips with audio
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={isDark ? '#8A7BB2' : '#AAA'} />
              </TouchableOpacity>

              {/* Optional: Photo Library if in change media mode */}
              {cameraModalMode === 'change_media' && (
                <TouchableOpacity
                  style={[styles.cameraOptionRow, isDark && styles.cameraOptionRowDark]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsCameraModalOpen(false);
                    handleOpenPhotos();
                  }}
                >
                  <View style={[styles.cameraOptionIconWrap, isDark && styles.cameraOptionIconWrapDark]}>
                    <Feather name="image" size={22} color={isDark ? '#C4A8FF' : '#6535EA'} />
                  </View>
                  <View style={styles.cameraOptionTextWrap}>
                    <Text style={[styles.cameraOptionTitle, isDark && styles.cameraOptionTitleDark]}>
                      Photo Library
                    </Text>
                    <Text style={[styles.cameraOptionDesc, isDark && styles.cameraOptionDescDark]}>
                      Choose from device photos & videos
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={isDark ? '#8A7BB2' : '#AAA'} />
                </TouchableOpacity>
              )}

              {/* Bottom Option: Cancel */}
              <TouchableOpacity
                style={[styles.cameraCancelBtn, isDark && styles.cameraCancelBtnDark]}
                activeOpacity={0.8}
                onPress={() => setIsCameraModalOpen(false)}
              >
                <Text style={[styles.cameraCancelText, isDark && styles.cameraCancelTextDark]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Add Music to HUBB Modal */}
        {renderMusicModal()}

        {/* Add Location to HUBB Modal */}
        {renderLocationModal()}

        {/* Visible Calendar Picker Modal */}
        {renderCalendarModal()}

        {/* Visible Clock / Time Picker Modal */}
        {renderClockModal()}

        {/* Media Required Alert Modal */}
        {renderMediaRequiredModal()}
      </SafeAreaView>
    </View>
  );

  const renderPreviewAndPublishView = () => {
    const displayMediaUri =
      selectedMedia?.uri ||
      selectedMedia?.thumbnailUri ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80';

    const isVideoMedia =
      selectedMedia?.type === 'video' ||
      (selectedMedia?.fileName &&
        /\.(mp4|mov|m4v|3gp|mkv|webm)$/i.test(selectedMedia.fileName)) ||
      (selectedMedia?.uri &&
        /\.(mp4|mov|m4v|3gp|mkv|webm)(\?.*)?$/i.test(selectedMedia.uri));

    return (
      <View style={[styles.modalRoot, isDark && styles.modalRootDark]}>
        {/* Atmosphere Background Gradient like in Home Page */}
        <LinearGradient
          colors={
            isDark
              ? ['#140C2C', '#1B0E3C', '#0A0518']
              : ['#E5F0FF', '#D8E8FC', '#C8DFFA']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
          {/* 1. Header Row (Image 2) */}
          <View style={[styles.header, isDark && styles.previewHeaderDark]}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => setIsPreviewMode(false)}
            >
              <Feather name="arrow-left" size={17} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back to Edit</Text>
            </TouchableOpacity>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
                Preview & Publish
              </Text>
              <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
                Review your HUB before sharing.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.resetRotationBtn, isDark && styles.resetRotationBtnDark, { paddingHorizontal: 12, paddingVertical: 7 }]}
              activeOpacity={0.8}
              onPress={handleExitWithAutoDraft}
              accessibilityLabel="Close and Save Draft"
            >
              <Feather name="x" size={15} color={isDark ? '#DDD4FA' : '#6535EA'} />
              <Text style={[styles.resetRotationText, isDark && styles.resetRotationTextDark, { marginLeft: 4 }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. Main Scroll Content with Comparison Slider */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Outer White / Themed Card */}
            <View style={[styles.previewCardOuter, isDark && styles.previewCardOuterDark]}>
              {/* Inner Black Viewport Canvas */}
              <View
                ref={previewContainerRef}
                style={[
                  styles.previewCanvas,
                  Platform.OS === 'web' && ({ touchAction: 'none' } as any),
                ]}
                {...(Platform.OS === 'web'
                  ? {
                      onPointerDown: (e: any) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const updatePos = (clientX: number) => {
                          if (rect && rect.width > 0) {
                            const pct = Math.max(
                              0,
                              Math.min(
                                100,
                                Math.round(((clientX - rect.left) / rect.width) * 100)
                              )
                            );
                            setPreviewSliderPos(pct);
                          }
                        };

                        const startX = e.clientX ?? e.touches?.[0]?.clientX;
                        if (startX !== undefined) updatePos(startX);

                        const onMove = (ev: any) => {
                          const x = ev.clientX ?? ev.touches?.[0]?.clientX;
                          if (x !== undefined) updatePos(x);
                        };

                        const onEnd = () => {
                          window.removeEventListener('pointermove', onMove);
                          window.removeEventListener('pointerup', onEnd);
                          window.removeEventListener('touchmove', onMove);
                          window.removeEventListener('touchend', onEnd);
                        };

                        window.addEventListener('pointermove', onMove, { passive: false });
                        window.addEventListener('pointerup', onEnd);
                        window.addEventListener('touchmove', onMove, { passive: false });
                        window.addEventListener('touchend', onEnd);
                      },
                    }
                  : {})}
              >
                {/* Top Labels: RAW HUB & EDITED HUB */}
                <View style={styles.previewLabelsRow} pointerEvents="none">
                  <Text style={styles.rawHubLabel}>RAW HUB</Text>
                  <Text style={styles.editedHubLabel}>EDITED HUB</Text>
                </View>

                {/* Base Layer: EDITED HUB (Identical 100% size) */}
                <View style={StyleSheet.absoluteFill}>
                  {isVideoMedia ? (
                    <VideoPreviewPlayer
                      uri={selectedMedia!.uri}
                      duration={selectedMedia?.duration}
                      thumbnailUri={selectedMedia?.thumbnailUri}
                      scale={1}
                      rotation={rotation}
                      adjustments={adjustments}
                      contentFit="cover"
                      showControls={false}
                      style={styles.previewMediaFill}
                    />
                  ) : (
                    <Image
                      source={{ uri: displayMediaUri }}
                      style={[
                        styles.previewMediaFill,
                        {
                          opacity: adjustments.opacity / 100,
                          transform: [{ rotate: `${rotation}deg` }],
                          ...getAdjustmentsFilterStyle(adjustments),
                        },
                      ]}
                      blurRadius={adjustments.blur}
                      resizeMode="cover"
                    />
                  )}
                  {/* Applied Adjustments & Filter */}
                  <MediaAdjustmentsOverlay adjustments={adjustments} filter={selectedFilter} />
                  {/* Applied Stickers */}
                  {stickers.map((stk) => (
                    <View
                      key={stk.id}
                      style={{
                        position: 'absolute',
                        left: `${stk.x}%`,
                        top: `${stk.y}%`,
                        transform: [
                          { translateX: -16 },
                          { translateY: -16 },
                          { rotate: `${stk.rotation}deg` },
                          { scale: stk.scale * 0.9 },
                        ],
                      }}
                      pointerEvents="none"
                    >
                      <Text style={{ fontSize: 32 }}>{stk.emoji}</Text>
                    </View>
                  ))}
                  {/* Applied Texts */}
                  {textOverlays.map((txt) => (
                    <View
                      key={txt.id}
                      style={{
                        position: 'absolute',
                        left: `${txt.x}%`,
                        top: `${txt.y}%`,
                        transform: [
                          { translateX: -40 },
                          { translateY: -14 },
                          { rotate: `${txt.rotation || 0}deg` },
                          { scale: (txt.scale || 1) * 0.9 },
                        ],
                      }}
                      pointerEvents="none"
                    >
                      <Text
                        style={{
                          fontSize: Math.round(txt.fontSize * 0.9),
                          color: txt.color,
                          fontFamily: getFontFamilyStyle(txt.fontFamily),
                          fontWeight: txt.fontFamily === 'Bebas Neue' ? '900' : '700',
                          textShadowColor:
                            txt.color === '#FFFFFF'
                              ? 'rgba(0,0,0,0.8)'
                              : 'rgba(0,0,0,0.4)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {txt.text}
                      </Text>
                    </View>
                  ))}
                  {/* Applied Location Tag on Preview */}
                  {selectedLocation && selectedLocation.placedOnMedia && (
                    <View
                      style={{
                        position: 'absolute',
                        left: `${selectedLocation.x ?? 50}%`,
                        top: `${selectedLocation.y ?? 25}%`,
                        transform: [{ translateX: -40 }, { translateY: -12 }],
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        borderRadius: 14,
                        paddingHorizontal: 9,
                        paddingVertical: 4.5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                      pointerEvents="none"
                    >
                      <Text style={{ fontSize: 12, marginRight: 4 }}>📍</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                        {selectedLocation.name}
                      </Text>
                    </View>
                  )}

                  {/* Video Badge if video */}
                  {isVideoMedia && (
                    <View style={styles.previewVideoBadge}>
                      <Feather
                        name="video"
                        size={13}
                        color="#FFFFFF"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.previewVideoBadgeText}>Video HUBB</Text>
                    </View>
                  )}
                </View>

                {/* Overlay Layer: RAW HUB (Pixel-for-pixel identical size, clipped by sliderPos) */}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    Platform.OS === 'web'
                      ? ({
                          clipPath: `polygon(0 0, ${previewSliderPos}% 0, ${previewSliderPos}% 100%, 0 100%)`,
                          WebkitClipPath: `polygon(0 0, ${previewSliderPos}% 0, ${previewSliderPos}% 100%, 0 100%)`,
                        } as any)
                      : {
                          width: `${previewSliderPos}%`,
                          overflow: 'hidden',
                        },
                  ]}
                  pointerEvents="none"
                >
                  <Image
                    source={{ uri: displayMediaUri }}
                    style={styles.previewMediaFill}
                    resizeMode="cover"
                  />
                  {/* Video Badge in RAW layer as well */}
                  {isVideoMedia && (
                    <View style={styles.previewVideoBadge}>
                      <Feather
                        name="video"
                        size={13}
                        color="#FFFFFF"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.previewVideoBadgeText}>Video HUBB</Text>
                    </View>
                  )}
                </View>

                {/* Vertical Divider Line */}
                <View
                  style={[
                    styles.previewDividerLine,
                    { left: `${previewSliderPos}%` },
                  ]}
                  pointerEvents="none"
                />

                {/* Centered Circular Handle `<>` */}
                <View
                  style={[
                    styles.previewSliderHandle,
                    { left: `${previewSliderPos}%` },
                  ]}
                  {...previewPanResponder.panHandlers}
                >
                  <View style={styles.handleCodeIconWrap}>
                    <Text style={styles.sliderHandleText}>{'<>'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* 3. Bottom Sticky Action Bar (Image 2) */}
          <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
            {/* Back to Edit Button */}
            <TouchableOpacity
              style={[styles.previewBottomBackBtn, isDark && styles.previewBottomBackBtnDark]}
              activeOpacity={0.8}
              onPress={() => setIsPreviewMode(false)}
            >
              <Feather name="arrow-left" size={16} color={isDark ? '#C4A8FF' : '#6535EA'} />
              <Text
                style={[
                  styles.previewBottomBackBtnText,
                  isDark && styles.previewBottomBackBtnTextDark,
                ]}
              >
                Back to Edit
              </Text>
            </TouchableOpacity>

            {/* Share your HUB Button */}
            <TouchableOpacity
              style={styles.shareHubBtnWrap}
              activeOpacity={0.88}
              onPress={() => {
                handlePublish();
              }}
            >
              <LinearGradient
                colors={['#6535EA', '#9D4EDD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareHubBtnGradient}
              >
                <Text style={styles.shareHubBtnText}>Share your HUB</Text>
                <Feather name="send" size={17} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  if (isPreviewMode) {
    return renderPreviewAndPublishView();
  }

  if (
    activeTool === 'filters' ||
    activeTool === 'crop' ||
    activeTool === 'rotate' ||
    activeTool === 'adjust' ||
    activeTool === 'stickers' ||
    activeTool === 'text'
  ) {
    return (
      <View style={[styles.editorRoot, isDark && styles.editorRootDark]}>
        {/* Atmosphere Background Gradient like in Home Page */}
        <LinearGradient
          colors={
            isDark
              ? ['#140C2C', '#1B0E3C', '#0A0518']
              : ['#E5F0FF', '#D8E8FC', '#C8DFFA']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Editor Header Toolbar */}
          <View style={[styles.editorToolbar, isDark && styles.editorToolbarDark]}>
            <View style={styles.editorToolbarLeft}>
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isDark && styles.toolbarIconBtnDark]} 
                activeOpacity={0.7}
                onPress={() => setActiveTool(null)}
                accessibilityLabel="Back to Share HUBBs"
              >
                <Feather name="arrow-left" size={17} color={isDark ? '#C4A8FF' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isDark && styles.toolbarIconBtnDark]} 
                activeOpacity={0.7}
                onPress={handleUndoRotate}
                accessibilityLabel="Undo Rotate"
              >
                <Feather name="corner-up-left" size={17} color={isDark ? '#C4A8FF' : '#666'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isDark && styles.toolbarIconBtnDark]} 
                activeOpacity={0.7}
                onPress={handleRedoRotate}
                accessibilityLabel="Redo Rotate"
              >
                <Feather name="corner-up-right" size={17} color={isDark ? '#C4A8FF' : '#666'} />
              </TouchableOpacity>

              {/* Active Category Pill */}
              <View 
                style={[styles.toolbarCategoryPill, isDark && styles.toolbarCategoryPillDark]} 
              >
                <Feather
                  name={activeTool === 'text' ? 'type' : activeTool === 'stickers' ? 'star' : activeTool === 'adjust' ? 'sliders' : activeTool === 'crop' ? 'crop' : activeTool === 'filters' ? 'aperture' : 'rotate-cw'}
                  size={14}
                  color={isDark ? '#C4A8FF' : '#6535EA'}
                  style={{ marginRight: 5 }}
                />
                <Text 
                  style={[styles.toolbarCategoryText, isDark && styles.toolbarCategoryTextDark]} 
                  numberOfLines={1}
                >
                  {activeTool === 'text' ? 'Text' : activeTool === 'stickers' ? 'Stickers' : activeTool === 'adjust' ? 'Adjust' : activeTool === 'crop' ? 'Crop' : activeTool === 'filters' ? 'Filters' : 'Rotate'}
                </Text>
              </View>
            </View>

            {/* Done Editing Button - NEVER cut off */}
            <TouchableOpacity 
              style={[styles.doneEditingBtn, isDark && styles.doneEditingBtnDark]} 
              activeOpacity={0.8}
              onPress={() => {
                if (activeTool === 'text') {
                  handleApplyText();
                } else {
                  setActiveTool(null);
                }
              }}
              accessibilityLabel="Done Editing"
            >
              <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.doneEditingText} numberOfLines={1}>Done Editing</Text>
            </TouchableOpacity>
          </View>

          {/* Main Media Edit Area */}
          <View style={styles.editorMediaArea}>
            <View 
              style={[
                styles.editorMediaContainer, 
                ((activeTool === 'crop' && aspectRatio !== 'Free') || (appliedCrop && appliedCrop.aspect !== 'Free'))
                  ? { height: undefined, width: '100%', aspectRatio: getAspectRatioValue(activeTool === 'crop' ? aspectRatio : appliedCrop!.aspect) }
                  : {}
              ]}
              onLayout={(e) => setMediaContainerLayout(e.nativeEvent.layout)}
              onTouchStart={handleCropTouchStart}
              onTouchMove={handleCropTouchMove}
              onTouchEnd={handleCropTouchEnd}
            >
              {selectedMedia?.type === 'video' ? (
                <VideoPreviewPlayer
                  uri={selectedMedia.uri}
                  duration={selectedMedia.duration}
                  thumbnailUri={selectedMedia.thumbnailUri}
                  scale={zoomLevel / 100}
                  rotation={rotation}
                  adjustments={adjustments}
                  contentFit="contain"
                  style={styles.editorMediaImage}
                />
              ) : (
                <Image 
                  source={{ uri: selectedMedia?.uri || selectedMedia?.thumbnailUri || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800' }} 
                  style={[
                    styles.editorMediaImage, 
                    { 
                      opacity: adjustments.opacity / 100,
                      transform: [
                        { scale: zoomLevel / 100 },
                        { rotate: `${rotation}deg` }
                      ],
                      ...getAdjustmentsFilterStyle(adjustments),
                    }
                  ]} 
                  blurRadius={adjustments.blur}
                  resizeMode="contain" 
                />
              )}
              
              {/* Temperature, Tint & Filter Overlay */}
              <MediaAdjustmentsOverlay adjustments={adjustments} filter={selectedFilter} />

              {/* Draggable Stickers Overlay */}
              {stickers.map((stk) => (
                <DraggableSticker
                  key={stk.id}
                  sticker={stk}
                  isSelected={activeTool === 'stickers' && selectedStickerId === stk.id}
                  containerWidth={mediaContainerLayout.width}
                  containerHeight={mediaContainerLayout.height}
                  onSelect={() => {
                    setActiveTool('stickers');
                    setSelectedStickerId(stk.id);
                  }}
                  onDelete={() => {
                    setStickers((prev) => prev.filter((s) => s.id !== stk.id));
                    if (selectedStickerId === stk.id) setSelectedStickerId(null);
                  }}
                  onUpdatePosition={(newX, newY) => {
                    setStickers((prev) =>
                      prev.map((s) => (s.id === stk.id ? { ...s, x: newX, y: newY } : s))
                    );
                  }}
                  onUpdateScale={(newScale) => {
                    setStickers((prev) =>
                      prev.map((s) => (s.id === stk.id ? { ...s, scale: newScale } : s))
                    );
                  }}
                  onUpdateRotation={(newRot) => {
                    setStickers((prev) =>
                      prev.map((s) => (s.id === stk.id ? { ...s, rotation: newRot } : s))
                    );
                  }}
                />
              ))}

              {/* Draggable Location Tag Overlay (when placed on media) */}
              {selectedLocation && selectedLocation.placedOnMedia && (
                <DraggableLocationTag
                  location={selectedLocation}
                  isSelected={false}
                  containerWidth={mediaContainerLayout.width}
                  containerHeight={mediaContainerLayout.height}
                  onSelect={() => {}}
                  onDelete={() => {
                    setSelectedLocation((prev) => (prev ? { ...prev, placedOnMedia: false } : null));
                  }}
                  onUpdatePosition={(newX, newY) => {
                    setSelectedLocation((prev) => (prev ? { ...prev, x: newX, y: newY } : null));
                  }}
                />
              )}

              {/* Draggable Text Overlays */}
              {textOverlays.map((txt) => (
                <DraggableText
                  key={txt.id}
                  item={txt}
                  isSelected={activeTool === 'text' && selectedTextId === txt.id}
                  containerWidth={mediaContainerLayout.width}
                  containerHeight={mediaContainerLayout.height}
                  isDark={isDark}
                  onSelect={() => {
                    setActiveTool('text');
                    setSelectedTextId(txt.id);
                    setCurrentTextInput(txt.text);
                    setTextColor(txt.color);
                    setTextFont(txt.fontFamily || 'Default');
                    setTextScale(txt.scale || 1);
                    setTextRotation(txt.rotation || 0);
                  }}
                  onDelete={() => {
                    setTextOverlays((prev) => prev.filter((t) => t.id !== txt.id));
                    if (selectedTextId === txt.id) {
                      setSelectedTextId(null);
                      setCurrentTextInput('');
                      setTextScale(1);
                      setTextRotation(0);
                    }
                  }}
                  onRotate={() => {
                    const newRot = ((txt.rotation || 0) + 15) % 360;
                    setTextRotation(newRot);
                    setTextOverlays((prev) =>
                      prev.map((t) => (t.id === txt.id ? { ...t, rotation: newRot } : t))
                    );
                  }}
                  onResize={() => {
                    let newScale = Number(((txt.scale || 1) + 0.2).toFixed(1));
                    if (newScale > 2.5) newScale = 0.8;
                    setTextScale(newScale);
                    setTextOverlays((prev) =>
                      prev.map((t) => (t.id === txt.id ? { ...t, scale: newScale } : t))
                    );
                  }}
                  onUpdatePosition={(newX, newY) => {
                    setTextOverlays((prev) =>
                      prev.map((t) => (t.id === txt.id ? { ...t, x: newX, y: newY } : t))
                    );
                  }}
                />
              ))}

              {/* Live Preview of text being typed on image */}
              {activeTool === 'text' && currentTextInput.trim().length > 0 && !selectedTextId && (
                <LivePreviewDraggableText
                  text={currentTextInput}
                  color={textColor}
                  fontFamily={textFont}
                  pos={liveTextPos}
                  rotation={textRotation}
                  scale={textScale}
                  containerWidth={mediaContainerLayout.width}
                  containerHeight={mediaContainerLayout.height}
                  onUpdatePos={(newPos) => setLiveTextPos(newPos)}
                />
              )}

              {activeTool === 'crop' && (
                <View style={[StyleSheet.absoluteFill, styles.cropBoxSimulatorBorder]}>
                  <View style={[styles.cropHandle, styles.cropHandleTopLeft]} />
                  <View style={[styles.cropHandle, styles.cropHandleTopRight]} />
                  <View style={[styles.cropHandle, styles.cropHandleBottomLeft]} />
                  <View style={[styles.cropHandle, styles.cropHandleBottomRight]} />
                  <View style={[styles.cropHandle, styles.cropHandleTopCenter]} />
                  <View style={[styles.cropHandle, styles.cropHandleBottomCenter]} />
                  <View style={[styles.cropHandle, styles.cropHandleLeftCenter]} />
                  <View style={[styles.cropHandle, styles.cropHandleRightCenter]} />
                </View>
              )}
            </View>
          </View>

          {/* Tool Specific Bottom Sheet */}
          <View style={[styles.editorBottomSheet, isDark && styles.editorBottomSheetDark]}>
            {activeTool === 'filters' && (
              <View>
                <View style={styles.sheetHeader}>
                  <Feather name="aperture" size={20} color="#6535EA" />
                  <Text style={[styles.sheetTitle, isDark && styles.sheetTitleDark]}>Filters</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sheetFiltersGrid}
                >
                  {FILTERS.map((filter) => {
                    const isSelected = selectedFilter === filter;
                    return (
                      <TouchableOpacity
                        key={filter}
                        style={[styles.sheetFilterItem, isSelected && styles.sheetFilterItemActive]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedFilter(filter)}
                      >
                        <View style={styles.sheetFilterPreviewContainer}>
                          <Image
                            source={{ uri: selectedMedia?.uri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
                            style={styles.sheetFilterPreviewImage}
                            resizeMode="cover"
                          />
                          <View 
                            style={[StyleSheet.absoluteFill, { backgroundColor: FILTER_STYLES[filter] || 'transparent', borderRadius: 14 }]} 
                            pointerEvents="none" 
                          />
                        </View>
                        <Text style={[styles.sheetFilterName, isSelected && styles.sheetFilterNameActive]}>
                          {filter}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {activeTool === 'crop' && (
              <View>
                <View style={styles.sheetHeader}>
                  <Feather name="crop" size={20} color={isDark ? '#C4A8FF' : '#6535EA'} />
                  <Text style={[styles.sheetTitle, isDark && styles.sheetTitleDark]}>Crop & Aspect</Text>
                </View>

                {/* Pinch to Zoom Indicator */}
                <View style={[styles.cropZoomInfoBar, isDark && styles.cropZoomInfoBarDark]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="maximize-2" size={14} color={isDark ? '#C4A8FF' : '#6535EA'} style={{ marginRight: 6 }} />
                    <Text style={[styles.cropZoomInfoText, isDark && styles.cropZoomInfoTextDark]}>
                      Pinch to Zoom: <Text style={{ fontWeight: '800' }}>{zoomLevel}%</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.cropZoomStepBtn, isDark && styles.cropZoomStepBtnDark]}
                      onPress={() => setZoomLevel((z) => Math.max(100, z - 10))}
                      activeOpacity={0.7}
                      accessibilityLabel="Zoom out"
                    >
                      <Feather name="minus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cropZoomStepBtn, isDark && styles.cropZoomStepBtnDark]}
                      onPress={() => setZoomLevel((z) => Math.min(300, z + 10))}
                      activeOpacity={0.7}
                      accessibilityLabel="Zoom in"
                    >
                      <Feather name="plus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                    </TouchableOpacity>
                    {zoomLevel !== 100 && (
                      <TouchableOpacity
                        style={[styles.cropZoomResetBtn, isDark && styles.cropZoomResetBtnDark]}
                        onPress={() => setZoomLevel(100)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cropZoomResetText}>100%</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.sheetAspectGrid}>
                  {['Free', '1:1', '4:5', '3:4', '16:9', '9:16', 'Story'].map((ratio) => (
                    <TouchableOpacity
                      key={ratio}
                      style={[styles.sheetAspectBtn, aspectRatio === ratio && styles.sheetAspectBtnActive]}
                      activeOpacity={0.7}
                      onPress={() => setAspectRatio(ratio)}
                    >
                      <Text style={[styles.sheetAspectBtnText, aspectRatio === ratio && styles.sheetAspectBtnTextActive]}>
                        {ratio}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {activeTool === 'rotate' && (
              <View style={styles.rotatePanelExact}>
                {/* 1. Header: Icon + Rotate */}
                <View style={styles.sheetHeaderExact}>
                  <Feather name="rotate-cw" size={20} color={isDark ? '#C4A8FF' : '#6535EA'} style={{ marginRight: 8 }} />
                  <Text style={[styles.sheetTitleExact, isDark && styles.sheetTitleExactDark]}>
                    Rotate
                  </Text>
                </View>

                {/* 2. Current Rotation Card */}
                <View style={[styles.currentRotCardExact, isDark && styles.currentRotCardExactDark]}>
                  <Text style={[styles.currentRotLabelExact, isDark && styles.currentRotLabelExactDark]}>
                    Current Rotation
                  </Text>
                  <View style={[styles.currentRotBadgeExact, isDark && styles.currentRotBadgeExactDark]}>
                    <Text style={[styles.currentRotBadgeTextExact, isDark && styles.currentRotBadgeTextExactDark]}>
                      {rotation % 360}°
                    </Text>
                  </View>
                </View>

                {/* 3. 90° CCW and 90° CW Buttons */}
                <View style={styles.rotateStepsRowExact}>
                  <TouchableOpacity
                    style={[styles.rotateStepBtnExact, isDark && styles.rotateStepBtnExactDark]}
                    activeOpacity={0.75}
                    onPress={() => applyRotation((rotation - 90 + 360) % 360)}
                  >
                    <Feather name="rotate-ccw" size={17} color={isDark ? '#EDE7FF' : '#111827'} style={{ marginRight: 8 }} />
                    <Text style={[styles.rotateStepBtnTextExact, isDark && styles.rotateStepBtnTextExactDark]}>
                      90° CCW
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.rotateStepBtnExact, isDark && styles.rotateStepBtnExactDark]}
                    activeOpacity={0.75}
                    onPress={() => applyRotation((rotation + 90) % 360)}
                  >
                    <Feather name="rotate-cw" size={17} color={isDark ? '#EDE7FF' : '#111827'} style={{ marginRight: 8 }} />
                    <Text style={[styles.rotateStepBtnTextExact, isDark && styles.rotateStepBtnTextExactDark]}>
                      90° CW
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 4. Preset Angles Row (0°, 90°, 180°, 270°) */}
                <View style={styles.presetDegreesRowExact}>
                  {[0, 90, 180, 270].map((deg) => {
                    const isSelected = (rotation % 360) === deg;
                    return (
                      <TouchableOpacity
                        key={deg}
                        style={[
                          styles.presetDegBtnExact,
                          isDark && styles.presetDegBtnExactDark,
                          isSelected && (isDark ? styles.presetDegBtnExactActiveDark : styles.presetDegBtnExactActive),
                        ]}
                        activeOpacity={0.75}
                        onPress={() => applyRotation(deg)}
                      >
                        <Text
                          style={[
                            styles.presetDegBtnTextExact,
                            isDark && styles.presetDegBtnTextExactDark,
                            isSelected && (isDark ? styles.presetDegBtnTextExactActiveDarkText : styles.presetDegBtnTextExactActiveText),
                          ]}
                        >
                          {deg}°
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 5. Fine Angle Header & Step Buttons */}
                <View style={styles.fineAngleHeaderExact}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.fineAngleTitleExact, isDark && styles.fineAngleTitleExactDark]}>
                      Fine Angle
                    </Text>
                    <Text style={[styles.fineAngleRangeExact, isDark && styles.fineAngleRangeExactDark, { marginLeft: 8 }]}>
                      ({rotation % 360}°)
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.cropZoomStepBtn, isDark && styles.cropZoomStepBtnDark]}
                      onPress={() => applyRotation((rotation - 1 + 360) % 360)}
                      activeOpacity={0.7}
                      accessibilityLabel="Decrease 1 degree"
                    >
                      <Feather name="minus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cropZoomStepBtn, isDark && styles.cropZoomStepBtnDark]}
                      onPress={() => applyRotation((rotation + 1) % 360)}
                      activeOpacity={0.7}
                      accessibilityLabel="Increase 1 degree"
                    >
                      <Feather name="plus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cropZoomStepBtn, isDark && styles.cropZoomStepBtnDark, { paddingHorizontal: 6 }]}
                      onPress={() => applyRotation((rotation + 5) % 360)}
                      activeOpacity={0.7}
                      accessibilityLabel="Increase 5 degrees"
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#C4A8FF' : '#6535EA' }}>+5°</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Slider Track with Blue Thumb */}
                <View
                  style={styles.sliderTouchAreaExact}
                  onLayout={(e) => setSliderTrackWidth(e.nativeEvent.layout.width)}
                  {...(Platform.OS !== 'web' ? rotateSliderPanResponder.panHandlers : {})}
                >
                  <View 
                    style={[styles.sliderTrackLineExact, isDark && styles.sliderTrackLineExactDark]}
                    pointerEvents="none"
                  >
                    <View
                      style={[
                        styles.sliderTrackFilledExact,
                        { width: `${Math.min(100, Math.max(0, (rotation / 360) * 100))}%` },
                      ]}
                      pointerEvents="none"
                    />
                  </View>
                  <View
                    style={[
                      styles.sliderThumbExact,
                      {
                        left: `${Math.min(100, Math.max(0, (rotation / 360) * 100))}%`,
                        transform: [{ translateX: -8 }],
                      },
                    ]}
                    pointerEvents="none"
                  />
                  {Platform.OS === 'web' && (
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={rotation % 360}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        applyRotation(val, false);
                      }}
                      onMouseUp={(e: any) => applyRotation(Number(e.target.value), true)}
                      onTouchEnd={(e: any) => applyRotation(Number(e.target.value), true)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 10,
                        margin: 0,
                        padding: 0,
                      }}
                    />
                  )}
                </View>

                {/* 6. Cancel & Apply Buttons Row */}
                <View style={styles.modalActionButtonsRowExact}>
                  <TouchableOpacity
                    style={[styles.cancelBtnExact, isDark && styles.cancelBtnExactDark]}
                    activeOpacity={0.8}
                    onPress={handleCancelRotate}
                  >
                    <Text style={[styles.cancelBtnTextExact, isDark && styles.cancelBtnTextExactDark]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyBtnExact}
                    activeOpacity={0.85}
                    onPress={handleApplyRotate}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.applyBtnGradientExact}
                    >
                      <Text style={styles.applyBtnTextExact}>Apply</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTool === 'adjust' && (
              <View style={styles.adjustPanelContainer}>
                {/* Header: Sliders icon + Adjust + Reset button */}
                <View style={styles.sheetHeaderWithAction}>
                  <View style={styles.sheetHeaderLeft}>
                    <Feather name="sliders" size={20} color={isDark ? '#C4A8FF' : '#6535EA'} />
                    <Text style={[styles.sheetTitle, isDark && styles.sheetTitleDark]}>Adjust</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                    style={[styles.resetRotationBtn, isDark && styles.resetRotationBtnDark]}
                    activeOpacity={0.7}
                  >
                    <Feather name="rotate-ccw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} style={{ marginRight: 4 }} />
                    <Text style={[styles.resetRotationText, isDark && styles.resetRotationTextDark]}>Reset All</Text>
                  </TouchableOpacity>
                </View>

                {/* Scrollable list of Adjustments */}
                <ScrollView
                  style={{ maxHeight: 290 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {ADJUSTMENT_SLIDERS.map((slider) => {
                    const val = adjustments[slider.id as keyof ImageAdjustments];

                    return (
                      <AdjustSliderItem
                        key={slider.id}
                        id={slider.id}
                        label={slider.label}
                        min={slider.min}
                        max={slider.max}
                        val={val}
                        defaultVal={slider.defaultVal}
                        isDark={isDark}
                        onChange={(newVal) => {
                          setAdjustments((prev) => ({ ...prev, [slider.id]: newVal }));
                        }}
                        onReset={() => {
                          setAdjustments((prev) => ({ ...prev, [slider.id]: slider.defaultVal }));
                        }}
                      />
                    );
                  })}
                </ScrollView>

                {/* Cancel & Apply Action Buttons */}
                <View style={styles.modalActionButtonsRowExact}>
                  <TouchableOpacity
                    style={[styles.cancelBtnExact, isDark && styles.cancelBtnExactDark]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setAdjustments(initialAdjustmentsOnOpen);
                      setActiveTool(null);
                    }}
                  >
                    <Text style={[styles.cancelBtnTextExact, isDark && styles.cancelBtnTextExactDark]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyBtnExact}
                    activeOpacity={0.85}
                    onPress={() => setActiveTool(null)}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.applyBtnGradientExact}
                    >
                      <Text style={styles.applyBtnTextExact}>Apply</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTool === 'stickers' && (
              <View style={styles.stickersPanelContainer}>
                {/* Header: Star icon + Stickers + Clear All */}
                <View style={styles.sheetHeaderWithAction}>
                  <View style={styles.sheetHeaderLeft}>
                    <Feather name="star" size={20} color={isDark ? '#C4A8FF' : '#6535EA'} />
                    <Text style={[styles.sheetTitle, isDark && styles.sheetTitleDark]}>Stickers</Text>
                  </View>
                  {stickers.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setStickers([]);
                        setSelectedStickerId(null);
                      }}
                      style={[styles.resetRotationBtn, isDark && styles.resetRotationBtnDark]}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={13} color={isDark ? '#FF8585' : '#EF4444'} style={{ marginRight: 4 }} />
                      <Text style={[styles.resetRotationText, { color: isDark ? '#FF8585' : '#EF4444' }]}>Clear All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Selected Sticker Fine-Tune Card (if a sticker is selected) */}
                {selectedSticker && (
                  <View style={[styles.selectedStickerCard, isDark && styles.selectedStickerCardDark]}>
                    <View style={styles.selectedStickerCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 24 }}>{selectedSticker.emoji}</Text>
                        <Text style={[styles.selectedStickerLabel, isDark && styles.selectedStickerLabelDark]}>
                          Selected Sticker
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.stickerDeselectBtn}
                          onPress={() => setSelectedStickerId(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stickerDeselectBtnText}>Deselect</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stickerDeleteBtn}
                          onPress={() => {
                            setStickers((prev) => prev.filter((s) => s.id !== selectedSticker.id));
                            setSelectedStickerId(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Feather name="trash-2" size={13} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Scale & Rotation Steppers */}
                    <View style={styles.stickerControlsGrid}>
                      <View style={styles.stickerControlItem}>
                        <Text style={[styles.stickerControlLabel, isDark && styles.stickerControlLabelDark]}>
                          Size: {Math.round(selectedSticker.scale * 100)}%
                        </Text>
                        <View style={styles.stickerStepperRow}>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={() => {
                              const newScale = Math.max(0.4, Number((selectedSticker.scale - 0.2).toFixed(1)));
                              setStickers((prev) =>
                                prev.map((s) => (s.id === selectedSticker.id ? { ...s, scale: newScale } : s))
                              );
                            }}
                          >
                            <Feather name="minus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={() => {
                              const newScale = Math.min(3.5, Number((selectedSticker.scale + 0.2).toFixed(1)));
                              setStickers((prev) =>
                                prev.map((s) => (s.id === selectedSticker.id ? { ...s, scale: newScale } : s))
                              );
                            }}
                          >
                            <Feather name="plus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.stickerControlItem}>
                        <Text style={[styles.stickerControlLabel, isDark && styles.stickerControlLabelDark]}>
                          Rotate: {selectedSticker.rotation}°
                        </Text>
                        <View style={styles.stickerStepperRow}>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={() => {
                              const newRot = (selectedSticker.rotation - 15 + 360) % 360;
                              setStickers((prev) =>
                                prev.map((s) => (s.id === selectedSticker.id ? { ...s, rotation: newRot } : s))
                              );
                            }}
                          >
                            <Feather name="rotate-ccw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={() => {
                              const newRot = (selectedSticker.rotation + 15) % 360;
                              setStickers((prev) =>
                                prev.map((s) => (s.id === selectedSticker.id ? { ...s, rotation: newRot } : s))
                              );
                            }}
                          >
                            <Feather name="rotate-cw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Category Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stickerCategoriesRow}
                >
                  {Object.keys(STICKER_CATEGORIES).map((cat) => {
                    const isCatSelected = stickerCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.stickerCategoryPill,
                          isDark && styles.stickerCategoryPillDark,
                          isCatSelected && styles.stickerCategoryPillActive,
                          isCatSelected && isDark && styles.stickerCategoryPillActiveDark,
                        ]}
                        activeOpacity={0.75}
                        onPress={() => setStickerCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.stickerCategoryText,
                            isDark && styles.stickerCategoryTextDark,
                            isCatSelected && styles.stickerCategoryTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Emojis Grid */}
                <ScrollView
                  style={{ maxHeight: selectedSticker ? 120 : 180 }}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.stickerEmojiGrid}
                >
                  {STICKER_CATEGORIES[stickerCategory]?.map((emoji, idx) => (
                    <TouchableOpacity
                      key={`${emoji}-${idx}`}
                      style={[styles.stickerEmojiBtn, isDark && styles.stickerEmojiBtnDark]}
                      activeOpacity={0.7}
                      onPress={() => {
                        const newId = `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                        const newSticker: StickerOverlay = {
                          id: newId,
                          emoji,
                          x: 45 + Math.floor(Math.random() * 10),
                          y: 45 + Math.floor(Math.random() * 10),
                          scale: 1,
                          rotation: 0,
                        };
                        setStickers((prev) => [...prev, newSticker]);
                        setSelectedStickerId(newId);
                      }}
                    >
                      <Text style={styles.stickerEmojiGlyph}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Cancel & Apply Action Buttons */}
                <View style={styles.modalActionButtonsRowExact}>
                  <TouchableOpacity
                    style={[styles.cancelBtnExact, isDark && styles.cancelBtnExactDark]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setStickers(initialStickersOnOpen);
                      setSelectedStickerId(null);
                      setActiveTool(null);
                    }}
                  >
                    <Text style={[styles.cancelBtnTextExact, isDark && styles.cancelBtnTextExactDark]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyBtnExact}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedStickerId(null);
                      setActiveTool(null);
                    }}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.applyBtnGradientExact}
                    >
                      <Text style={styles.applyBtnTextExact}>Apply</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTool === 'text' && (
              <View style={styles.textPanelContainer}>
                {/* Header: Type icon + Text + Clear All */}
                <View style={styles.sheetHeaderWithAction}>
                  <View style={styles.sheetHeaderLeft}>
                    <Feather name="type" size={20} color="#7C3AED" style={{ marginRight: 8 }} />
                    <Text style={[styles.sheetTitle, isDark && styles.sheetTitleDark]}>Text</Text>
                  </View>
                  {textOverlays.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setTextOverlays([]);
                        setSelectedTextId(null);
                        setCurrentTextInput('');
                      }}
                      style={[styles.resetRotationBtn, isDark && styles.resetRotationBtnDark]}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name="trash-2"
                        size={13}
                        color={isDark ? '#FF8585' : '#EF4444'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.resetRotationText, { color: isDark ? '#FF8585' : '#EF4444' }]}>
                        Clear All
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Text Input Box */}
                <View style={[styles.textInputBoxContainer, isDark && styles.textInputBoxContainerDark]}>
                  <TextInput
                    style={[styles.textInputField, isDark && styles.textInputFieldDark]}
                    placeholder="Enter text..."
                    placeholderTextColor={isDark ? '#8A7BB2' : '#9CA3AF'}
                    value={currentTextInput}
                    onChangeText={handleTextChange}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                  />
                </View>

                {/* Selected Text Fine-Tune Card (matching stickers) */}
                {selectedTextOverlay && (
                  <View style={[styles.selectedStickerCard, isDark && styles.selectedStickerCardDark]}>
                    <View style={styles.selectedStickerCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <Feather name="type" size={16} color="#7C3AED" />
                        <Text
                          style={[styles.selectedStickerLabel, isDark && styles.selectedStickerLabelDark]}
                          numberOfLines={1}
                        >
                          {selectedTextOverlay.text || 'Selected Text'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={styles.stickerDeselectBtn}
                          onPress={() => {
                            setSelectedTextId(null);
                            setCurrentTextInput('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stickerDeselectBtnText}>Deselect</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stickerDeleteBtn}
                          onPress={() => {
                            setTextOverlays((prev) => prev.filter((t) => t.id !== selectedTextOverlay.id));
                            setSelectedTextId(null);
                            setCurrentTextInput('');
                          }}
                          activeOpacity={0.7}
                        >
                          <Feather name="trash-2" size={13} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Scale & Rotation Steppers */}
                    <View style={styles.stickerControlsGrid}>
                      <View style={[styles.stickerControlItem, isDark && { backgroundColor: '#1E143B' }]}>
                        <Text style={[styles.stickerControlLabel, isDark && styles.stickerControlLabelDark]}>
                          Size: {Math.round((selectedTextOverlay.scale || 1) * 100)}%
                        </Text>
                        <View style={styles.stickerStepperRow}>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleDecreaseTextScale}
                          >
                            <Feather name="minus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleIncreaseTextScale}
                          >
                            <Feather name="plus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={[styles.stickerControlItem, isDark && { backgroundColor: '#1E143B' }]}>
                        <Text style={[styles.stickerControlLabel, isDark && styles.stickerControlLabelDark]}>
                          Rotate: {selectedTextOverlay.rotation || 0}°
                        </Text>
                        <View style={styles.stickerStepperRow}>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleRotateTextCCW}
                          >
                            <Feather name="rotate-ccw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleRotateTextCW}
                          >
                            <Feather name="rotate-cw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Adjust Size & Rotation when adding new text */}
                {!selectedTextOverlay && currentTextInput.trim().length > 0 && (
                  <View style={[styles.selectedStickerCard, isDark && styles.selectedStickerCardDark, { marginBottom: 12 }]}>
                    <View style={styles.stickerControlsGrid}>
                      <View style={[styles.stickerControlItem, isDark && { backgroundColor: '#1E143B' }]}>
                        <Text style={[styles.stickerControlLabel, isDark && styles.stickerControlLabelDark]}>
                          Size: {Math.round(textScale * 100)}%
                        </Text>
                        <View style={styles.stickerStepperRow}>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleDecreaseTextScale}
                          >
                            <Feather name="minus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleIncreaseTextScale}
                          >
                            <Feather name="plus" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={[styles.stickerControlItem, isDark && { backgroundColor: '#1E143B' }]}>
                        <Text style={[styles.stickerControlLabel, isDark && styles.stickerControlLabelDark]}>
                          Rotate: {textRotation}°
                        </Text>
                        <View style={styles.stickerStepperRow}>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleRotateTextCCW}
                          >
                            <Feather name="rotate-ccw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.adjustStepBtn, isDark && styles.adjustStepBtnDark]}
                            onPress={handleRotateTextCW}
                          >
                            <Feather name="rotate-cw" size={13} color={isDark ? '#C4A8FF' : '#6535EA'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Quick Select Existing Overlays */}
                {!selectedTextOverlay && textOverlays.length > 0 && currentTextInput.trim().length === 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.textColorSectionLabel, isDark && styles.textColorSectionLabelDark, { marginBottom: 8, fontSize: 12 }]}>
                      Tap text to adjust size or rotate:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {textOverlays.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.stickerCategoryPill,
                            isDark && styles.stickerCategoryPillDark,
                            { flexDirection: 'row', alignItems: 'center', gap: 6 },
                          ]}
                          onPress={() => {
                            setSelectedTextId(t.id);
                            setCurrentTextInput(t.text);
                            setTextColor(t.color);
                            setTextFont(t.fontFamily || 'Default');
                            setTextScale(t.scale || 1);
                            setTextRotation(t.rotation || 0);
                          }}
                        >
                          <Feather name="type" size={12} color="#7C3AED" />
                          <Text
                            style={[styles.stickerCategoryText, isDark && styles.stickerCategoryTextDark]}
                            numberOfLines={1}
                          >
                            {t.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Text Color Label & Sample from Media Button */}
                <View style={styles.textColorHeaderRow}>
                  <Text style={[styles.textColorSectionLabel, isDark && styles.textColorSectionLabelDark]}>
                    Text Color
                  </Text>
                  <TouchableOpacity
                    style={[styles.sampleMediaBtn, isDark && styles.sampleMediaBtnDark]}
                    onPress={handleSampleColorFromMedia}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="eyedrop-outline" size={14} color="#7C3AED" style={{ marginRight: 5 }} />
                    <Text style={[styles.sampleMediaBtnText, isDark && styles.sampleMediaBtnTextDark]}>
                      Sample from Media
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 11 Color Swatches Row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.textPaletteScroll}
                >
                  {TEXT_PALETTE_COLORS.map((c) => {
                    const isSelected = textColor === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorSwatchWrap,
                          isSelected && styles.colorSwatchWrapSelected,
                          isSelected && isDark && styles.colorSwatchWrapSelectedDark,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleColorChange(c)}
                      >
                        <View
                          style={[
                            styles.colorSwatchCircle,
                            { backgroundColor: c },
                            (c === '#FFFFFF' || c === '#E5E7EB') && styles.colorSwatchLightBorder,
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Font Selector Row (Right Aligned Pill) */}
                <View style={styles.fontDropdownRow}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={[styles.fontDropdownPill, isDark && styles.fontDropdownPillDark]}
                    activeOpacity={0.8}
                    onPress={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                  >
                    <Text
                      style={[
                        styles.fontDropdownCurrentText,
                        isDark && styles.fontDropdownCurrentTextDark,
                        { fontFamily: getFontFamilyStyle(textFont) },
                      ]}
                    >
                      {textFont}
                    </Text>
                    <Feather
                      name={isFontDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={isDark ? '#DDD4FA' : '#1F2937'}
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Font Options Dropdown Menu */}
                {isFontDropdownOpen && (
                  <View style={[styles.fontDropdownMenuCard, isDark && styles.fontDropdownMenuCardDark]}>
                    {TEXT_FONTS.map((font) => {
                      const isFontSelected = textFont === font;
                      return (
                        <TouchableOpacity
                          key={font}
                          style={[
                            styles.fontDropdownOption,
                            isFontSelected && styles.fontDropdownOptionActive,
                            isFontSelected && isDark && styles.fontDropdownOptionActiveDark,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleFontChange(font)}
                        >
                          <Text
                            style={[
                              styles.fontDropdownOptionText,
                              isDark && styles.fontDropdownOptionTextDark,
                              isFontSelected && styles.fontDropdownOptionTextActive,
                              { fontFamily: getFontFamilyStyle(font) },
                            ]}
                          >
                            {font}
                          </Text>
                          {isFontSelected && <Feather name="check" size={14} color="#7C3AED" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Cancel, Add/Update & Apply Action Buttons */}
                <View style={styles.modalActionButtonsRowExact}>
                  <TouchableOpacity
                    style={[styles.cancelBtnExact, isDark && styles.cancelBtnExactDark]}
                    activeOpacity={0.8}
                    onPress={handleCancelText}
                  >
                    <Text style={[styles.cancelBtnTextExact, isDark && styles.cancelBtnTextExactDark]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  {currentTextInput.trim().length > 0 && (
                    <TouchableOpacity
                      style={[styles.addTextActionBtnExact, styles.addTextActionBtnActive]}
                      activeOpacity={0.85}
                      onPress={handleAddOrUpdateText}
                    >
                      <Text style={styles.addTextActionBtnTextExact}>
                        {selectedTextId ? 'Update' : '+ Add More'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.applyBtnExact}
                    activeOpacity={0.85}
                    onPress={handleApplyText}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.applyBtnGradientExact}
                    >
                      <Text style={styles.applyBtnTextExact}>Apply</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          {/* Add Music to HUBB Modal */}
          {renderMusicModal()}
          {/* Add Location to HUBB Modal */}
          {renderLocationModal()}
        </SafeAreaView>
      </View>
    );
  }

  return renderInitialView();
}

const styles = StyleSheet.create({
  modalRoot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E5F0FF',
    zIndex: 100,
  },
  modalRootDark: {
    backgroundColor: '#100824',
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

  // ── HUBBs Details & Scheduling & Drafts ──
  cardTitleCentered: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#211054',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardTitleCenteredDark: {
    color: '#EDE7FF',
  },
  detailsSubCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE7FF',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 14,
  },
  detailsSubCardDark: {
    borderColor: '#3D2A70',
    backgroundColor: '#231644',
  },
  detailsSubCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#211054',
    marginBottom: 10,
  },
  detailsSubCardTitleDark: {
    color: '#EDE7FF',
  },
  captionInputBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    minHeight: 88,
  },
  captionInputBoxDark: {
    borderColor: '#3D2A70',
    backgroundColor: '#1B1137',
  },
  captionTextInput: {
    fontSize: 14.5,
    color: '#211054',
    textAlignVertical: 'top',
    minHeight: 70,
    outlineStyle: 'none' as any,
    lineHeight: 20,
  },
  captionTextInputDark: {
    color: '#EDE7FF',
  },
  schedulingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schedulingToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schedulingStatusText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  schedulingStatusTextDark: {
    color: '#A99BD1',
  },
  schedulingStatusTextActive: {
    color: '#6535EA',
    fontWeight: '700',
  },
  scheduleFieldsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  scheduleFieldCol: {
    flex: 1,
  },
  scheduleFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  scheduleFieldLabelDark: {
    color: '#C4A8FF',
  },
  scheduleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scheduleInputWrapDark: {
    borderColor: '#3D2A70',
    backgroundColor: '#1B1137',
  },
  scheduleTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#1F1D2B',
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  scheduleTextInputDark: {
    color: '#EDE7FF',
  },
  mediaLayoutsSubText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    fontWeight: '500',
  },
  mediaLayoutsSubTextDark: {
    color: '#A99BD1',
  },

  // ── Preview & Publish Screen Styles (Image 2) ──
  previewHeaderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  previewCardOuter: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE7FF',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  previewCardOuterDark: {
    backgroundColor: '#1C1138',
    borderColor: '#32205E',
  },
  previewCanvas: {
    backgroundColor: '#0A0518',
    borderRadius: 22,
    height: 520,
    overflow: 'hidden',
    position: 'relative',
    userSelect: 'none' as any,
  },
  previewLabelsRow: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  rawHubLabel: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  editedHubLabel: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  previewMediaFill: {
    width: '100%',
    height: '100%',
  },
  previewDividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: -1.25 }],
    zIndex: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  previewVideoBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    zIndex: 25,
  },
  previewVideoBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  previewSliderHandle: {
    position: 'absolute',
    top: '50%',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#6535EA',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -23 }, { translateY: -23 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    cursor: 'ew-resize' as any,
  },
  handleCodeIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderHandleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -1,
  },
  previewBottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6535EA',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  previewBottomBackBtnDark: {
    borderColor: '#A78BFA',
    backgroundColor: '#26164C',
  },
  previewBottomBackBtnText: {
    color: '#6535EA',
    fontSize: 14.5,
    fontWeight: '700',
  },
  previewBottomBackBtnTextDark: {
    color: '#C4A8FF',
  },
  shareHubBtnWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  shareHubBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
  },
  shareHubBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },

  // Drafts
  draftsDashedBox: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF9FF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftsDashedBoxDark: {
    borderColor: '#4A3582',
    backgroundColor: '#1E1438',
  },
  draftsBoxIconWrap: {
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftsEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211054',
    marginBottom: 6,
    textAlign: 'center',
  },
  draftsEmptyTitleDark: {
    color: '#EDE7FF',
  },
  draftsEmptySub: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  draftsEmptySubDark: {
    color: '#A99BD1',
  },
  startNewHubbBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNewHubbBtnDark: {
    borderColor: '#A78BFA',
    backgroundColor: '#26164C',
  },
  startNewHubbBtnText: {
    color: '#6535EA',
    fontSize: 14.5,
    fontWeight: '700',
  },
  savedDraftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E8E5F7',
    marginBottom: 8,
  },
  savedDraftRowDark: {
    backgroundColor: '#231644',
    borderColor: '#3D2A70',
  },
  savedDraftThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedDraftThumb: {
    width: '100%',
    height: '100%',
  },
  savedDraftThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedDraftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#211054',
  },
  savedDraftTitleDark: {
    color: '#EDE7FF',
  },
  savedDraftTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  savedDraftDeleteBtn: {
    padding: 8,
  },
  draftResumeBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  draftResumeBadgeDark: {
    backgroundColor: '#3E2675',
  },
  draftResumeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  draftResumeBadgeTextDark: {
    color: '#D4B8FF',
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

  // Filters Overlay
  filtersOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 300,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  filtersOverlayDark: {
    backgroundColor: '#1C1138',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7FF',
  },
  filtersHeaderDark: {
    borderBottomColor: '#32205E',
  },
  filtersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filtersTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#211054',
  },
  filtersTitleDark: {
    color: '#EDE7FF',
  },
  filtersCloseBtn: {
    padding: 4,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    paddingBottom: 150,
  },
  filterItem: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterPreviewContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3EEFF',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  filterPreviewContainerActive: {
    borderColor: '#6535EA',
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#211054',
    textAlign: 'center',
  },
  filterNameDark: {
    color: '#D4C6FF',
  },
  filterNameActive: {
    color: '#6535EA',
    fontWeight: '800',
  },

  // Crop Overlay
  cropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(50,50,50,0.85)',
    zIndex: 400,
    justifyContent: 'space-between',
  },
  cropOverlayDark: {
    backgroundColor: 'rgba(10,5,20,0.95)',
  },
  cropPreviewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  cropSimulatorWrapper: {
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropPreviewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  cropBoxSimulatorBorder: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cropHandle: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
  },
  cropHandleTopLeft: { top: -7, left: -7 },
  cropHandleTopRight: { top: -7, right: -7 },
  cropHandleBottomLeft: { bottom: -7, left: -7 },
  cropHandleBottomRight: { bottom: -7, right: -7 },
  cropHandleTopCenter: { top: -7, left: '50%', marginLeft: -7 },
  cropHandleBottomCenter: { bottom: -7, left: '50%', marginLeft: -7 },
  cropHandleLeftCenter: { top: '50%', left: -7, marginTop: -7 },
  cropHandleRightCenter: { top: '50%', right: -7, marginTop: -7 },

  cropBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  cropBottomSheetDark: {
    backgroundColor: '#1C1138',
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211054',
  },
  cropTitleDark: {
    color: '#EDE7FF',
  },
  aspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  aspectBtn: {
    flexBasis: '48%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2D8FD',
    alignItems: 'center',
  },
  aspectBtnDark: {
    borderColor: '#3D2A70',
  },
  aspectBtnActive: {
    borderColor: '#6535EA',
    backgroundColor: '#F3EEFF',
  },
  aspectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#211054',
  },
  aspectBtnTextDark: {
    color: '#EDE7FF',
  },
  aspectBtnTextActive: {
    color: '#6535EA',
  },
  zoomContainer: {
    backgroundColor: '#FAF8FE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2D8FD',
    marginBottom: 24,
  },
  zoomContainerDark: {
    backgroundColor: '#231644',
    borderColor: '#3D2A70',
  },
  zoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  zoomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#211054',
  },
  zoomTitleDark: {
    color: '#EDE7FF',
  },
  zoomPercentBadge: {
    backgroundColor: '#EBE2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomPercentText: {
    color: '#6535EA',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2D8FD',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  zoomTrackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  zoomThumb: {
    position: 'absolute',
    left: '30%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    marginLeft: -9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cropActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cropActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
  },
  cropActionBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211054',
  },
  cropApplyBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6535EA',
    alignItems: 'center',
  },
  cropApplyBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // --- NEW STYLES FOR REDESIGN ---
  mediaPreviewSquareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaPreviewSquare: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D4FF',
    backgroundColor: '#F7F4FF',
  },
  mediaPreviewSquareDark: {
    borderColor: '#3C276E',
    backgroundColor: '#1E1436',
  },
  mediaPreviewImageSquare: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtnSquare: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreSquare: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2D4FF',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  addMoreSquareDark: {
    borderColor: '#3C276E',
    backgroundColor: '#0F0821',
  },
  reorderText: {
    color: '#666',
    fontSize: 13,
    marginTop: 10,
  },
  toolColNew: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  toolBtnNew: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2D4FF',
  },
  toolBtnNewDark: {
    backgroundColor: '#2A1C4C',
    borderColor: '#4A3485',
  },
  toolLabelNew: {
    fontSize: 11,
    color: '#444',
    fontWeight: '500',
  },
  toolLabelNewDark: {
    color: '#DED5F8',
  },
  
  // Editor Styles
  editorRoot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E5F0FF',
    zIndex: 200,
  },
  editorRootDark: {
    backgroundColor: '#100824',
  },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 8,
    paddingBottom: 10,
    width: '100%',
  },
  editorToolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  toolbarIconBtn: {
    width: 33,
    height: 33,
    borderRadius: 8,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toolbarCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EEFA',
    borderRadius: 8,
    height: 33,
    paddingHorizontal: 8,
    flexShrink: 1,
    borderWidth: 1,
    borderColor: '#EAE2F8',
  },
  toolbarCategoryPillDark: {
    backgroundColor: '#27174F',
    borderColor: '#3D2873',
  },
  toolbarCategoryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6535EA',
  },
  toolbarCategoryTextDark: {
    color: '#C4A8FF',
  },
  toolbarIconBtnWide: {
    flexDirection: 'row',
    height: 33,
    borderRadius: 8,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  toolbarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  doneEditingBtn: {
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    flexShrink: 0,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  doneEditingBtnDark: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  doneEditingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  editorMediaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  editorMediaContainer: {
    width: '100%',
    height: '90%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  editorMediaImage: {
    width: '100%',
    height: '100%',
  },
  editorBottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  sheetFiltersGrid: {
    paddingBottom: 10,
    gap: 12,
  },
  sheetFilterItem: {
    alignItems: 'center',
  },
  sheetFilterItemActive: {
  },
  sheetFilterPreviewContainer: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    marginBottom: 8,
  },
  sheetFilterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  sheetFilterName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sheetFilterNameActive: {
    color: '#6535EA',
  },
  sheetAspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetAspectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    minWidth: '22%',
    alignItems: 'center',
  },
  sheetAspectBtnActive: {
    borderColor: '#9A50FF',
    backgroundColor: '#F3EEFF',
  },
  sheetAspectBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  sheetAspectBtnTextActive: {
    color: '#9A50FF',
  },

  // Camera Picker Modal / Layer Screen Styles
  cameraModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  cameraModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  cameraModalSheetDark: {
    backgroundColor: '#1C1138',
  },
  cameraModalHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#E2D8FD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cameraModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211054',
    marginBottom: 16,
  },
  cameraModalTitleDark: {
    color: '#EDE7FF',
  },
  cameraOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECE7FF',
  },
  cameraOptionRowDark: {
    backgroundColor: '#27194A',
    borderColor: '#3D2A70',
  },
  cameraOptionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cameraOptionIconWrapDark: {
    backgroundColor: '#372466',
  },
  cameraOptionTextWrap: {
    flex: 1,
  },
  cameraOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#211054',
    marginBottom: 2,
  },
  cameraOptionTitleDark: {
    color: '#EDE7FF',
  },
  cameraOptionDesc: {
    fontSize: 12.5,
    color: '#7667A5',
  },
  cameraOptionDescDark: {
    color: '#A99BD1',
  },
  cameraCancelBtn: {
    backgroundColor: '#F2F0F7',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cameraCancelBtnDark: {
    backgroundColor: '#2C1D54',
  },
  cameraCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6535EA',
  },
  cameraCancelTextDark: {
    color: '#C4A8FF',
  },

  // Editor Dark & Rotate Tool Exact Styles
  rotatePanelExact: {
    paddingBottom: 4,
  },
  sheetHeaderExact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitleExact: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  sheetTitleExactDark: {
    color: '#FFFFFF',
  },
  currentRotCardExact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  currentRotCardExactDark: {
    backgroundColor: '#231648',
    borderColor: '#37246B',
  },
  currentRotLabelExact: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111827',
  },
  currentRotLabelExactDark: {
    color: '#EDE7FF',
  },
  currentRotBadgeExact: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9,
  },
  currentRotBadgeExactDark: {
    backgroundColor: '#3B2075',
  },
  currentRotBadgeTextExact: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  currentRotBadgeTextExactDark: {
    color: '#EDE7FF',
  },
  rotateStepsRowExact: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rotateStepBtnExact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 13,
  },
  rotateStepBtnExactDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  rotateStepBtnTextExact: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  rotateStepBtnTextExactDark: {
    color: '#EDE7FF',
  },
  presetDegreesRowExact: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetDegBtnExact: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 11,
  },
  presetDegBtnExactDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  presetDegBtnExactActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#A855F7',
    borderWidth: 1.5,
  },
  presetDegBtnExactActiveDark: {
    backgroundColor: '#3E1D7C',
    borderColor: '#C084FC',
    borderWidth: 1.5,
  },
  presetDegBtnTextExact: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  presetDegBtnTextExactDark: {
    color: '#DDD4FA',
  },
  presetDegBtnTextExactActiveText: {
    color: '#7E22CE',
  },
  presetDegBtnTextExactActiveDarkText: {
    color: '#E9D5FF',
  },
  fineAngleHeaderExact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fineAngleTitleExact: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
  },
  fineAngleTitleExactDark: {
    color: '#EDE7FF',
  },
  fineAngleRangeExact: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6B7280',
  },
  fineAngleRangeExactDark: {
    color: '#A79BC8',
  },
  sliderTouchAreaExact: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 18,
    width: '100%',
  },
  sliderTrackLineExact: {
    width: '100%',
    height: 6,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderTrackLineExactDark: {
    backgroundColor: '#37246B',
  },
  sliderTrackFilledExact: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  sliderThumbExact: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    top: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  modalActionButtonsRowExact: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtnExact: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnExactDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  cancelBtnTextExact: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cancelBtnTextExactDark: {
    color: '#EDE7FF',
  },
  applyBtnExact: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyBtnGradientExact: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnTextExact: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toolbarRotateDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBEBEB',
    borderRadius: 10,
    height: 38,
    overflow: 'hidden',
  },
  toolbarRotateDropdownBtnDark: {
    backgroundColor: '#27174F',
  },
  toolbarRotateDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  toolbarRotateDropdownDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#D1D5DB',
  },
  toolbarRotateDropdownDividerDark: {
    backgroundColor: '#432F73',
  },
  toolbarRotateDropdownRight: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  editorToolbarDark: {
    backgroundColor: '#190E35',
  },
  toolbarIconBtnDark: {
    backgroundColor: '#27174F',
  },
  editorBottomSheetDark: {
    backgroundColor: '#1C1138',
  },
  sheetTitleDark: {
    color: '#EDE7FF',
  },
  sheetHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetRotationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3EEFF',
  },
  resetRotationBtnDark: {
    backgroundColor: '#2E1C59',
  },
  resetRotationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6535EA',
  },
  resetRotationTextDark: {
    color: '#D4B8FF',
  },

  // Adjust Tool Styles
  adjustPanelContainer: {
    paddingBottom: 4,
  },
  adjustSliderRow: {
    marginBottom: 14,
    width: '100%',
  },
  adjustSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adjustSliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  adjustSliderLabelDark: {
    color: '#EDE7FF',
  },
  adjustControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adjustStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustStepBtnDark: {
    backgroundColor: '#2E1C59',
  },
  adjustValueBadge: {
    backgroundColor: '#F3EEFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustValueBadgeDark: {
    backgroundColor: '#2E1C59',
  },
  adjustValueBadgeActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  adjustValueBadgeActiveDark: {
    backgroundColor: '#3D2075',
    borderColor: '#C4A8FF',
  },
  adjustValueBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6535EA',
  },
  adjustValueBadgeTextDark: {
    color: '#D4B8FF',
  },
  adjustValueBadgeTextActive: {
    color: '#7C3AED',
  },
  adjustTrackContainer: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  adjustTrackLine: {
    width: '100%',
    height: 6,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  adjustTrackLineDark: {
    backgroundColor: '#37246B',
  },
  adjustTrackCenterNotch: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 8,
    top: -1,
    backgroundColor: '#9CA3AF',
    marginLeft: -1,
    borderRadius: 1,
    zIndex: 2,
  },
  adjustTrackCenterNotchDark: {
    backgroundColor: '#6B52A3',
  },
  adjustTrackFilled: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: '#6535EA',
    borderRadius: 3,
  },
  adjustTrackFilledDark: {
    backgroundColor: '#8B5CF6',
  },
  adjustThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6535EA',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    top: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 3,
    zIndex: 3,
  },
  adjustThumbDark: {
    backgroundColor: '#8B5CF6',
  },

  // Stickers Tool Styles
  stickersPanelContainer: {
    paddingBottom: 4,
  },
  selectedStickerCard: {
    backgroundColor: '#F8F5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  selectedStickerCardDark: {
    backgroundColor: '#27174F',
    borderColor: '#43297A',
  },
  selectedStickerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectedStickerLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211054',
  },
  selectedStickerLabelDark: {
    color: '#EDE7FF',
  },
  stickerDeselectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EBE5FA',
  },
  stickerDeselectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6535EA',
  },
  stickerDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerControlsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stickerControlItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickerControlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  stickerControlLabelDark: {
    color: '#DDD4FA',
  },
  stickerStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stickerCategoriesRow: {
    gap: 8,
    paddingBottom: 10,
  },
  stickerCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stickerCategoryPillDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  stickerCategoryPillActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#A855F7',
    borderWidth: 1.5,
  },
  stickerCategoryPillActiveDark: {
    backgroundColor: '#3E1D7C',
    borderColor: '#C084FC',
    borderWidth: 1.5,
  },
  stickerCategoryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  stickerCategoryTextDark: {
    color: '#DDD4FA',
  },
  stickerCategoryTextActive: {
    color: '#7E22CE',
  },
  stickerEmojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 12,
    justifyContent: 'flex-start',
  },
  stickerEmojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmojiBtnDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  stickerEmojiGlyph: {
    fontSize: 26,
  },
  stickerOverlayItem: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  stickerOverlayItemSelected: {
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  stickerEmojiGlyphOverlay: {
    fontSize: 36,
  },
  stickerDeleteMiniBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },
  stickerResizeMiniBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6535EA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },
  stickerRotateMiniBtn: {
    position: 'absolute',
    bottom: -8,
    left: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },
  // Text Tool Bottom Sheet Styles
  textPanelContainer: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  textInputBoxContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 14,
  },
  textInputBoxContainerDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  textInputField: {
    fontSize: 15,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
  textInputFieldDark: {
    color: '#FFFFFF',
  },
  textColorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textColorSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  textColorSectionLabelDark: {
    color: '#DDD4FA',
  },
  sampleMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sampleMediaBtnDark: {
    backgroundColor: '#351F66',
    borderColor: '#5B37A6',
  },
  sampleMediaBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sampleMediaBtnTextDark: {
    color: '#C4A8FF',
  },
  textPaletteScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  colorSwatchWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchWrapSelected: {
    borderColor: '#9CA3AF',
  },
  colorSwatchWrapSelectedDark: {
    borderColor: '#C4A8FF',
  },
  colorSwatchCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorSwatchLightBorder: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  fontDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    marginBottom: 16,
  },
  fontDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 140,
  },
  fontDropdownPillDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  fontDropdownCurrentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fontDropdownCurrentTextDark: {
    color: '#FFFFFF',
  },
  fontDropdownMenuCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  fontDropdownMenuCardDark: {
    backgroundColor: '#27194D',
    borderColor: '#3D2873',
  },
  fontDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  fontDropdownOptionActive: {
    backgroundColor: '#F3E8FF',
  },
  fontDropdownOptionActiveDark: {
    backgroundColor: '#351F66',
  },
  fontDropdownOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  fontDropdownOptionTextDark: {
    color: '#DDD4FA',
  },
  fontDropdownOptionTextActive: {
    fontWeight: '700',
    color: '#7C3AED',
  },
  addTextActionBtnExact: {
    flex: 1,
    backgroundColor: '#BA97F4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#BA97F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addTextActionBtnActive: {
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
  },
  addTextActionBtnTextExact: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textOverlayItem: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    cursor: 'pointer',
  },
  textOverlayItemSelected: {
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    borderRadius: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  textOverlayContent: {
    textAlign: 'center',
  },
  textDeleteMiniBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },
  textActionMiniBtn: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 3,
  },

  // ── Music Tool Styles ──
  attachedMusicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  attachedMusicCardDark: {
    backgroundColor: '#1E192B',
    borderColor: '#372B52',
  },
  attachedMusicCover: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  attachedMusicInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  attachedMusicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachedMusicTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  attachedMusicTitleDark: {
    color: '#F9FAFB',
  },
  attachedMusicArtist: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  attachedMusicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachedMusicPlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachedMusicChangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
  },
  attachedMusicChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  attachedMusicRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtnNewActiveMusic: {
    borderColor: '#7C3AED',
    borderWidth: 1.5,
    backgroundColor: '#EDE9FE',
  },
  musicToolBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  musicSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(101, 53, 234, 0.18)',
    borderBottomWidth: 0,
    maxHeight: '82%',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 20,
  },
  musicSheetContainerDark: {
    backgroundColor: '#1E192B',
    borderColor: 'rgba(196, 168, 255, 0.3)',
  },
  musicSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  musicSheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  musicSheetIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  musicSheetTitleDark: {
    color: '#F9FAFB',
  },
  musicSheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicSheetCloseBtnDark: {
    backgroundColor: '#2E2742',
  },
  musicSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  musicSearchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },
  musicSearchInputDark: {
    backgroundColor: '#2A233D',
    color: '#F9FAFB',
  },
  musicSearchBtn: {
    backgroundColor: '#7C3AED',
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicSearchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  musicGenresWrapper: {
    marginBottom: 12,
  },
  musicGenresScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  musicGenreTag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  musicGenreTagDark: {
    backgroundColor: 'transparent',
  },
  musicGenreTagSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  musicGenreTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  musicGenreTagTextDark: {
    color: '#D1D5DB',
  },
  musicGenreTagTextSelected: {
    color: '#7C3AED',
  },
  musicImportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAF9FF',
    marginBottom: 14,
  },
  musicImportBoxDark: {
    borderColor: '#373050',
    backgroundColor: '#262038',
  },
  musicImportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  musicImportFolderIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicImportTextGroup: {
    flex: 1,
  },
  musicImportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  musicImportTitleDark: {
    color: '#F9FAFB',
  },
  musicImportSubtitle: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  musicChooseFileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  musicChooseFileBtnDark: {
    backgroundColor: '#352B52',
    borderColor: '#59448E',
  },
  musicChooseFileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  musicTrackList: {
    maxHeight: 370,
  },
  musicTrackListContent: {
    paddingBottom: 24,
  },
  musicTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  musicTrackRowDark: {
    borderBottomColor: '#2B2440',
  },
  musicArtworkWrap: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E192B',
  },
  musicArtwork: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  musicArtworkPlayOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicArtworkPlayOverlayActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.55)',
  },
  musicTrackInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  musicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicTrackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  musicTrackTitleDark: {
    color: '#F9FAFB',
  },
  musicTrackArtist: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  musicSelectBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  musicSelectBtnSelected: {
    backgroundColor: '#059669',
  },
  musicSelectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  musicEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  musicEmptyText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 13,
  },

  // ── Location Tool Styles ──
  locSheetIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  locSearchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111827',
  },
  locSearchInputDark: {
    backgroundColor: '#2A233D',
    borderColor: '#433860',
    color: '#F9FAFB',
  },
  locTagsWrapper: {
    marginBottom: 14,
  },
  locTagsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locTagBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  locTagBtnDark: {
    backgroundColor: 'transparent',
  },
  locTagBtnSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  locTagBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  locTagBtnTextDark: {
    color: '#9CA3AF',
  },
  locTagBtnTextSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  locResultsList: {
    maxHeight: 380,
  },
  locResultsContent: {
    paddingBottom: 24,
  },
  locItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locItemRowDark: {
    borderBottomColor: '#2B2440',
  },
  locItemPinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locItemInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  locItemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  locItemTitleDark: {
    color: '#F9FAFB',
  },
  locItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  attachedLocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  attachedLocCardDark: {
    backgroundColor: '#1E192B',
    borderColor: '#372B52',
  },
  attachedLocIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachedLocInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  attachedLocName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  attachedLocNameDark: {
    color: '#F9FAFB',
  },
  attachedLocSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  attachedLocActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachedLocChangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
  },
  attachedLocChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  attachedLocRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Calendar & Clock Picker Styles
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  calendarModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(101, 53, 234, 0.22)',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 25,
  },
  calendarModalCardDark: {
    backgroundColor: '#1E1635',
    borderColor: 'rgba(196, 168, 255, 0.35)',
    borderWidth: 1.5,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1D2B',
  },
  pickerTitleDark: {
    color: '#EDE8FD',
  },
  pickerSubtitle: {
    fontSize: 12,
    color: '#8A7BB2',
    marginTop: 1,
  },
  pickerSubtitleDark: {
    color: '#A99BD1',
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCloseBtnDark: {
    backgroundColor: '#2A1F45',
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F3FF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  calendarNavRowDark: {
    backgroundColor: '#2A1F45',
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarNavBtnDark: {
    backgroundColor: '#3B2A63',
  },
  calendarMonthYearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#211054',
  },
  calendarMonthYearTextDark: {
    color: '#EDE8FD',
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekdayCol: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A7BB2',
  },
  calendarWeekdayTextDark: {
    color: '#A99BD1',
  },
  calendarWeekendText: {
    color: '#E11D48',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  calendarDayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  calendarDayCellDark: {},
  calendarDayTodayCell: {
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  calendarDaySelectedCell: {
    backgroundColor: '#6535EA',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F1D2B',
  },
  calendarDayTextDark: {
    color: '#DDD6FE',
  },
  calendarDayTodayText: {
    fontWeight: '700',
    color: '#7C3AED',
  },
  calendarDaySelectedText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pickerPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingTop: 4,
  },
  pickerPresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F4EFFE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  pickerPresetChipDark: {
    backgroundColor: '#2A1F45',
    borderColor: '#4C357A',
  },
  pickerPresetText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6535EA',
  },
  pickerPresetTextDark: {
    color: '#C4A8FF',
  },
  pickerBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBFB',
  },
  pickerSelectedInfoWrap: {
    flex: 1,
    marginRight: 10,
  },
  pickerSelectedLabel: {
    fontSize: 11,
    color: '#8A7BB2',
  },
  pickerSelectedLabelDark: {
    color: '#A99BD1',
  },
  pickerSelectedValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6535EA',
    marginTop: 1,
  },
  pickerSelectedValueDark: {
    color: '#C4A8FF',
  },
  pickerConfirmBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  pickerConfirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  pickerConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  clockDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1238',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  clockDisplayCardDark: {
    backgroundColor: '#110A22',
    borderWidth: 1,
    borderColor: '#3D256D',
  },
  clockDigitBox: {
    alignItems: 'center',
    minWidth: 55,
  },
  clockDigitValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  clockDigitSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#A78BFA',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  clockColonText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#A78BFA',
    marginHorizontal: 10,
    marginTop: -8,
  },
  clockPeriodWrap: {
    marginLeft: 18,
    backgroundColor: '#2A1A4E',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  clockPeriodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  clockPeriodBtnActive: {
    backgroundColor: '#7C3AED',
  },
  clockPeriodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7BB2',
  },
  clockPeriodTextActive: {
    color: '#FFFFFF',
  },
  clockSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  clockSectionLabelDark: {
    color: '#C4A8FF',
  },
  clockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  clockPillBtn: {
    width: `${(100 - 30) / 6}%`,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2D8FD',
  },
  clockPillBtnDark: {
    backgroundColor: '#2A1F45',
    borderColor: '#412C6E',
  },
  clockPillBtnActive: {
    backgroundColor: '#6535EA',
    borderColor: '#6535EA',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  clockPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#211054',
  },
  clockPillTextDark: {
    color: '#DDD6FE',
  },
  clockPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Attached Location Place on Media Toggle */
  attachedLocPlaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3EEFF',
    borderWidth: 1,
    borderColor: '#E2D8FD',
    marginRight: 6,
  },
  attachedLocPlaceBtnActive: {
    backgroundColor: '#6535EA',
    borderColor: '#6535EA',
  },
  attachedLocPlaceBtnDark: {
    backgroundColor: '#2A1F45',
    borderColor: '#412C6E',
  },
  attachedLocPlaceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6535EA',
  },
  attachedLocPlaceTextActive: {
    color: '#FFFFFF',
  },
  attachedLocPlaceTextDark: {
    color: '#C4A8FF',
  },

  /* Draggable Location Tag Overlay */
  draggableLocOverlayItem: {
    position: 'absolute',
    zIndex: 60,
    transform: [{ translateX: -40 }, { translateY: -15 }],
  },
  draggableLocOverlayItemSelected: {
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: 16,
  },
  draggableLocBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  draggableLocBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 160,
  },

  /* Crop Zoom Info & Controls */
  cropZoomInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9E2FC',
    marginBottom: 12,
  },
  cropZoomInfoBarDark: {
    backgroundColor: '#22193B',
    borderColor: '#382759',
  },
  cropZoomInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4C1D95',
  },
  cropZoomInfoTextDark: {
    color: '#DDD6FE',
  },
  cropZoomStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropZoomStepBtnDark: {
    backgroundColor: '#332356',
  },
  cropZoomResetBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E5DEFF',
  },
  cropZoomResetBtnDark: {
    backgroundColor: '#3D2B66',
  },
  cropZoomResetText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6535EA',
  },

  /* Centered Alert Modal / Popups */
  centeredModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centeredAlertCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(101, 53, 234, 0.22)',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  centeredAlertCardDark: {
    backgroundColor: '#1E1538',
    borderColor: 'rgba(196, 168, 255, 0.35)',
    shadowColor: '#A78BFA',
    shadowOpacity: 0.3,
  },
  alertIconGlowWrap: {
    marginBottom: 16,
  },
  alertIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertTitleDark: {
    color: '#F9FAFB',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  alertMessageDark: {
    color: '#C4A8FF',
  },
  alertActionsStack: {
    width: '100%',
    gap: 10,
  },
  alertPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6535EA',
    borderRadius: 14,
    paddingVertical: 13,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  alertPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  alertSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EEFF',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2D8FD',
  },
  alertSecondaryBtnDark: {
    backgroundColor: '#2A1F45',
    borderColor: '#453073',
  },
  alertSecondaryBtnText: {
    color: '#6535EA',
    fontSize: 14.5,
    fontWeight: '700',
  },
  alertSecondaryBtnTextDark: {
    color: '#C4A8FF',
  },
  alertCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  alertCancelTextDark: {
    color: '#8A7BB2',
  },
});
