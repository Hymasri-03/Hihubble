export interface FilterPreset {
  id: string;
  name: string;
  color: string;
  cssFilter: string;
  description: string;
  icon: string;
}

export const INSTAGRAM_FILTERS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    color: 'transparent',
    cssFilter: 'none',
    description: 'Original photo without modifications',
    icon: 'sparkles-outline',
  },
  {
    id: 'clarendon',
    name: 'Clarendon',
    color: 'rgba(124, 58, 237, 0.12)',
    cssFilter: 'contrast(1.25) saturate(1.3) brightness(1.05)',
    description: 'Brightens highlights and deepens shadows for high punch',
    icon: 'flash-outline',
  },
  {
    id: 'gingham',
    name: 'Gingham',
    color: 'rgba(254, 243, 199, 0.18)',
    cssFilter: 'brightness(1.05) hue-rotate(-10deg) sepia(0.2)',
    description: 'Vintage subtle warmth with soft diffused highlights',
    icon: 'film-outline',
  },
  {
    id: 'juno',
    name: 'Juno',
    color: 'rgba(236, 72, 153, 0.14)',
    cssFilter: 'contrast(1.18) saturate(1.4) sepia(0.12)',
    description: 'Intense colors with rich pinks and warm cosmic tones',
    icon: 'planet-outline',
  },
  {
    id: 'lark',
    name: 'Lark',
    color: 'rgba(6, 182, 212, 0.12)',
    cssFilter: 'contrast(0.95) brightness(1.15) saturate(1.1)',
    description: 'Bright and airy atmosphere with cool greens and blues',
    icon: 'sunny-outline',
  },
  {
    id: 'moon',
    name: 'Moon',
    color: 'rgba(0, 0, 0, 0.35)',
    cssFilter: 'grayscale(1) contrast(1.2) brightness(1.08)',
    description: 'Crisp black & white with bright luminous highlights',
    icon: 'moon-outline',
  },
  {
    id: 'ludwig',
    name: 'Ludwig',
    color: 'rgba(245, 158, 11, 0.12)',
    cssFilter: 'contrast(1.08) saturate(1.08) brightness(1.05)',
    description: 'Minimalist clean warmth for portraits and architecture',
    icon: 'aperture-outline',
  },
  {
    id: 'valencia',
    name: 'Valencia',
    color: 'rgba(251, 191, 36, 0.16)',
    cssFilter: 'sepia(0.28) contrast(1.08) brightness(1.08)',
    description: 'Nostalgic antique golden glow and subtle fade',
    icon: 'color-palette-outline',
  },
  {
    id: 'slumber',
    name: 'Slumber',
    color: 'rgba(167, 139, 250, 0.14)',
    cssFilter: 'saturate(0.7) brightness(1.05) sepia(0.3)',
    description: 'Dreamy, romantic retro haze with softened colors',
    icon: 'cloudy-night-outline',
  },
  {
    id: 'crema',
    name: 'Crema',
    color: 'rgba(255, 237, 213, 0.16)',
    cssFilter: 'contrast(1.05) brightness(1.05) saturate(0.9) sepia(0.18)',
    description: 'Smooth cream tones that flatter skin and backgrounds',
    icon: 'cafe-outline',
  },
  {
    id: 'aden',
    name: 'Aden',
    color: 'rgba(244, 114, 182, 0.15)',
    cssFilter: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)',
    description: 'Soft pastel glow with dreamy desaturated contrast',
    icon: 'flower-outline',
  },
  {
    id: 'perpetua',
    name: 'Perpetua',
    color: 'rgba(16, 185, 129, 0.12)',
    cssFilter: 'contrast(1.1) brightness(1.05) saturate(1.15)',
    description: 'Fresh earthy greens with crisp vibrant daylight',
    icon: 'leaf-outline',
  },
  {
    id: 'reyes',
    name: 'Reyes',
    color: 'rgba(254, 215, 170, 0.15)',
    cssFilter: 'sepia(0.22) brightness(1.12) contrast(0.85) saturate(0.75)',
    description: 'Dusty, sun-bleached vintage road trip feel',
    icon: 'compass-outline',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    color: 'rgba(217, 119, 6, 0.22)',
    cssFilter: 'sepia(0.55) contrast(1.1) brightness(1.02)',
    description: 'Golden 70s analog film warmth',
    icon: 'camera-outline',
  },
  {
    id: 'noir',
    name: 'Noir',
    color: 'rgba(0, 0, 0, 0.55)',
    cssFilter: 'grayscale(1) contrast(1.35) brightness(0.95)',
    description: 'Dramatic deep cinema film noir style',
    icon: 'contrast-outline',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    color: 'rgba(6, 182, 212, 0.22)',
    cssFilter: 'contrast(1.2) hue-rotate(180deg) saturate(1.4)',
    description: 'Electric neon cyan & magenta futuristic glow',
    icon: 'hardware-chip-outline',
  },
];

export const getFilterById = (filterId?: string): FilterPreset => {
  if (!filterId) return INSTAGRAM_FILTERS[0];
  return INSTAGRAM_FILTERS.find((f) => f.id === filterId) || INSTAGRAM_FILTERS[0];
};
