/**
 * HiHubble — welcome splash screen (React Native / TypeScript)
 *
 * Concept: "Hellos become HiHubble" — greetings in many languages fly in,
 * merge into one bubble, Hubble drops in from the top, lands and winks. The
 * wordmark bounces in, the heart drops onto the "ı", and the splash pops open
 * like a bubble to reveal the app. About 2.7 s total, light + dark theme,
 * tap to skip, respects "Reduce motion".
 *
 * Requirements:
 *   - React Native >= 0.73 (uses the `transformOrigin` style)
 *   - react-native-svg
 *
 * Usage: render it ON TOP of your app (it is absolutely positioned):
 *   <View style={{ flex: 1 }}>
 *     <YourApp />
 *     {showSplash && (
 *       <HiHubbleSplash ready={appReady} onFinish={() => setShowSplash(false)} />
 *     )}
 *   </View>
 */
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Mask,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type HiHubbleSplashProps = {
  /** 'auto' follows the phone's dark mode. Default 'light'. */
  theme?: 'auto' | 'light' | 'dark';
  /** Splash stays until this is true / resolves (and minDuration has passed). Default true. */
  ready?: boolean | Promise<unknown>;
  /** ms the full animation gets to play. Default 2700. */
  minDuration?: number;
  /** Safety cap in ms. Default 9000. */
  maxDuration?: number;
  /** Tap anywhere to skip (after ~0.9 s). Default true. */
  skippable?: boolean;
  /** Only show on the first launch of this JS session. Default false. */
  oncePerSession?: boolean;
  /** Called once the splash is completely gone. */
  onFinish?: () => void;
  /** Tagline under the wordmark. Default: Say **hi** to your people */
  tagline?: ReactNode;
  mascotSource?: ImageSourcePropType;
  /** Open eyeball used for the wink. */
  eyeSource?: ImageSourcePropType;
  /** Skin layer that hides the drawn wink until it happens. */
  eyeSkinSource?: ImageSourcePropType;
  /** Loaded font family names (e.g. from @expo-google-fonts/fredoka). System font if omitted. */
  fonts?: { medium?: string; semibold?: string; bold?: string };
  /** Extra bottom spacing for the typing loader (e.g. safe-area bottom inset). */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
};

type EaseFn = (t: number) => number;
type Interp = ReturnType<Animated.Value['interpolate']>;
type Frame = [at: number, value: number, easing?: EaseFn];

/* ------------------------------------------------------------------ */
/* Easing + keyframe helper                                           */
/* ------------------------------------------------------------------ */

const LINEAR: EaseFn = (t) => t;
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_IN = Easing.bezier(0.42, 0, 1, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const CHIP_EASE = Easing.bezier(0.55, 0, 0.75, 0.25);
const RING_EASE = Easing.bezier(0.2, 0.7, 0.3, 1);
const LAND_FALL = Easing.bezier(0.45, 0, 0.9, 0.5);
const WINK_EASE = Easing.bezier(0.5, 0, 0.85, 0.45);
const LETTER_EASE = Easing.bezier(0.34, 1.7, 0.6, 1);
const DROP_EASE = Easing.bezier(0.3, 0, 0.5, 1);
const HOLE_EASE = Easing.bezier(0.7, 0, 0.25, 1);

/**
 * CSS-style @keyframes on top of a 0→1 progress value.
 * Each segment gets its own easing (like animation-timing-function in CSS),
 * sampled into a plain interpolation so it runs on the native driver.
 */
function kf(p: Animated.Value, frames: Frame[], ease: EaseFn = LINEAR, samples = 10): Interp {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i < frames.length - 1; i++) {
    const [a, va, ez = ease] = frames[i];
    const [b, vb] = frames[i + 1];
    const n = ez === LINEAR ? 1 : samples;
    for (let s = 0; s < n; s++) {
      const t = s / n;
      inputRange.push(a + (b - a) * t);
      outputRange.push(va + (vb - va) * ez(t));
    }
  }
  const [lastAt, lastV] = frames[frames.length - 1];
  inputRange.push(lastAt);
  outputRange.push(lastV);
  return p.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
}

const deg = (v: Interp) =>
  v.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));

/* ------------------------------------------------------------------ */
/* Theme                                                              */
/* ------------------------------------------------------------------ */

type RGBA = [color: string, opacity: number];

const LIGHT = {
  violet: '#7B3FE4',
  violet2: '#9D6BFF',
  ink: '#2B1668',
  ink2: '#4B2BA3',
  pink: '#FF4FA3',
  muted: '#6D5E98',
  bg0: '#FFFFFF',
  bg1: '#F6F1FF',
  bg2: '#E7DBFF',
  bgGlow: ['#9D6BFF', 0.2] as RGBA,
  chipBg: '#FFFFFF',
  chipEdge: 'transparent',
  chipShadow: '#4B2BA3',
  chipShadowOpacity: 0.16,
  bokehHi: ['#FFFFFF', 0.9] as RGBA,
  bokehLo: ['#9D6BFF', 0.18] as RGBA,
  glow: ['#7B3FE4', 0.28] as RGBA,
  floor: ['#2B1668', 0.28] as RGBA,
  bodyShadow: '#3C148C',
  bodyShadowOpacity: 0.18,
  letterShadow: 'rgba(60,20,140,0.18)',
  tagAccent: '#7B3FE4',
};

const DARK: typeof LIGHT = {
  violet: '#8F5CFF',
  violet2: '#C3A6FF',
  ink: '#D9CEFF',
  ink2: '#FFFFFF',
  pink: '#FF4FA3',
  muted: '#A99CCB',
  bg0: '#241757',
  bg1: '#130C2E',
  bg2: '#07051A',
  bgGlow: ['#7B3FE4', 0.38],
  chipBg: '#221A45',
  chipEdge: 'rgba(255,255,255,0.08)',
  chipShadow: '#000000',
  chipShadowOpacity: 0.45,
  bokehHi: ['#D6C4FF', 0.35],
  bokehLo: ['#8F5CFF', 0.14],
  glow: ['#8F5CFF', 0.42],
  floor: ['#000000', 0.55],
  bodyShadow: '#8F5CFF',
  bodyShadowOpacity: 0.35,
  letterShadow: 'rgba(0,0,0,0.35)',
  tagAccent: '#C3A6FF',
};

/* ------------------------------------------------------------------ */
/* Static content                                                     */
/* ------------------------------------------------------------------ */

// text, start offset x/y (vmin), avatar colour, delay (s), alt style
const GREETINGS: [string, number, number, string, number, boolean][] = [
  ['hi!', -32, -50, '#FFB86B', 0.0, false],
  ['hola', 34, -40, '#6BD4FF', 0.05, true],
  ['नमस्ते', -34, 14, '#FF7EB6', 0.1, true],
  ['salut', 34, 24, '#7BE0A0', 0.03, false],
  ['hey 👋', -22, 54, '#B892FF', 0.14, false],
  ['ciao', 26, 58, '#FFD66B', 0.08, true],
];

// left %, top %, size px
const BOKEH: [number, number, number][] = [
  [8, 14, 46], [82, 10, 30], [90, 62, 54], [6, 72, 34], [70, 86, 22], [24, 40, 16], [76, 38, 14],
];

const DEFAULT_MASCOT = require('./assets/splash/mascot.png');
const DEFAULT_EYE = require('./assets/splash/mascot-eye-open.png');
const DEFAULT_SKIN = require('./assets/splash/mascot-eye-skin.png');

const HEART_PATH =
  'M16 28.2C7.4 22.4 1.2 16.7 1.2 9.6 1.2 4.9 4.8 1.2 9.2 1.2c2.8 0 5.2 1.5 6.8 3.8 1.6-2.3 4-3.8 6.8-3.8 4.4 0 8 3.7 8 8.4 0 7.1-6.2 12.8-14.8 18.6z';

function Heart({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 32 29">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF8CC6" />
          <Stop offset="1" stopColor="#F0288A" />
        </LinearGradient>
      </Defs>
      <Path fill={`url(#${id})`} d={HEART_PATH} />
      <Ellipse cx="9.5" cy="7.6" rx="3.4" ry="2.2" fill="#fff" opacity={0.55} transform="rotate(-30 9.5 7.6)" />
    </Svg>
  );
}

let seenThisSession = false;

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function HiHubbleSplash({
  theme = 'light',
  ready = true,
  minDuration = 2700,
  maxDuration = 9000,
  skippable = true,
  oncePerSession = false,
  onFinish,
  tagline,
  mascotSource = DEFAULT_MASCOT,
  eyeSource = DEFAULT_EYE,
  eyeSkinSource = DEFAULT_SKIN,
  fonts,
  bottomInset = 0,
  style,
}: HiHubbleSplashProps) {
  const scheme = useColorScheme();
  const dark = theme === 'dark' || (theme === 'auto' && scheme === 'dark');
  const C = dark ? DARK : LIGHT;

  const win = useWindowDimensions();
  const [size, setSize] = useState({ w: win.width, h: win.height });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width && height && (width !== size.w || height !== size.h)) setSize({ w: width, h: height });
  };

  const [skipSession] = useState(() => {
    if (!oncePerSession) return false;
    if (seenThisSession) return true;
    seenThisSession = true;
    return false;
  });

  const [reduce, setReduce] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'playing' | 'waiting' | 'closing' | 'done'>('playing');
  const [canSkip, setCanSkip] = useState(false);

  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  /* ---------- animated values (one 0→1 progress per element) ---------- */
  const A = useMemo(
    () => ({
      bokeh: BOKEH.map(() => new Animated.Value(0)),
      drift: new Animated.Value(0),
      glow: new Animated.Value(0),
      breathe: new Animated.Value(0),
      chips: GREETINGS.map(() => new Animated.Value(0)),
      rings: [new Animated.Value(0), new Animated.Value(0)],
      blob: new Animated.Value(0),
      shadow: new Animated.Value(0),
      body: new Animated.Value(0),
      wink: new Animated.Value(0),
      sparks: [new Animated.Value(0), new Animated.Value(0)],
      letters: Array.from({ length: 8 }, () => new Animated.Value(0)),
      heart: new Animated.Value(0),
      beat: new Animated.Value(0),
      burst: new Animated.Value(0),
      minis: [new Animated.Value(0), new Animated.Value(0)],
      tag: new Animated.Value(0),
      typing: new Animated.Value(0),
      dots: [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)],
      stageOut: new Animated.Value(0),
      rootOpacity: new Animated.Value(1),
      hole: new Animated.Value(0), // JS driver (animates an SVG prop)
    }),
    [],
  );

  /* ---------- lifecycle: ready / min / max / close ---------- */
  const readyRef = useRef(false);
  const minRef = useRef(false);
  const closedRef = useRef(false);
  const reduceRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    setPhase('closing');
    const r = reduceRef.current;
    if (r) {
      Animated.timing(A.rootOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(A.stageOut, { toValue: 1, duration: 320, easing: EASE_IN, useNativeDriver: true }).start();
      Animated.timing(A.hole, { toValue: 1, delay: 120, duration: 550, easing: HOLE_EASE, useNativeDriver: false }).start();
      Animated.timing(A.rootOpacity, { toValue: 0, delay: 450, duration: 200, easing: EASE, useNativeDriver: true }).start();
    }
    later(() => {
      setPhase('done');
      onFinishRef.current?.();
    }, r ? 280 : 700);
  }, [A]);

  const check = useCallback(() => {
    if (readyRef.current && minRef.current) close();
    else if (minRef.current) setPhase((p) => (p === 'playing' ? 'waiting' : p));
  }, [close]);

  // skipped because of oncePerSession
  useEffect(() => {
    if (skipSession) onFinishRef.current?.();
  }, [skipSession]);

  // reduce motion
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => alive && setReduce(!!v))
      .catch(() => alive && setReduce(false));
    return () => {
      alive = false;
    };
  }, []);

  // ready prop
  useEffect(() => {
    if (ready === true) {
      readyRef.current = true;
      check();
      return;
    }
    if (ready === false) return;
    let alive = true;
    Promise.resolve(ready)
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        readyRef.current = true;
        check();
      });
    return () => {
      alive = false;
    };
  }, [ready, check]);

  // start the timeline
  useEffect(() => {
    if (reduce === null || skipSession) return;
    reduceRef.current = reduce;
    const running: Animated.CompositeAnimation[] = [];
    const go = (v: Animated.Value, delay: number, duration: number) => {
      const a = Animated.timing(v, { toValue: 1, delay, duration, easing: LINEAR, useNativeDriver: true });
      running.push(a);
      a.start();
    };
    const loop = (anim: Animated.CompositeAnimation, delay = 0) => {
      const a = Animated.sequence([Animated.delay(delay), Animated.loop(anim)]);
      running.push(a);
      a.start();
    };

    later(() => {
      minRef.current = true;
      check();
    }, reduce ? 700 : minDuration);
    later(close, maxDuration);
    if (skippable) later(() => setCanSkip(true), 900);

    if (reduce) {
      [A.glow, A.blob, A.shadow, A.body, A.wink, A.heart, A.beat, A.tag, ...A.bokeh, ...A.letters].forEach((v) =>
        v.setValue(1),
      );
    } else {
      A.bokeh.forEach((v, i) => go(v, i * 60, 800));
      loop(
        Animated.sequence([
          Animated.timing(A.drift, { toValue: 1, duration: 7000, easing: EASE_IN_OUT, useNativeDriver: true }),
          Animated.timing(A.drift, { toValue: 0, duration: 7000, easing: EASE_IN_OUT, useNativeDriver: true }),
        ]),
      );
      GREETINGS.forEach((g, i) => go(A.chips[i], g[4] * 1000, 660));
      go(A.blob, 300, 850);
      go(A.shadow, 300, 1100);
      go(A.body, 300, 1100);
      go(A.glow, 750, 600);
      loop(Animated.timing(A.breathe, { toValue: 1, duration: 2400, easing: LINEAR, useNativeDriver: true }), 1400);
      go(A.rings[0], 800, 900);
      go(A.rings[1], 920, 900);
      go(A.wink, 1420, 240);
      go(A.sparks[0], 1520, 700);
      go(A.sparks[1], 1600, 700);
      go(A.letters[0], 980, 600);
      go(A.letters[1], 1030, 600);
      for (let i = 0; i < 6; i++) go(A.letters[i + 2], 1100 + i * 50, 600);
      go(A.heart, 1600, 620);
      go(A.burst, 2040, 600);
      go(A.beat, 2200, 500);
      go(A.minis[0], 2200, 900);
      go(A.minis[1], 2300, 900);
      go(A.tag, 1920, 500);
    }
    return () => {
      running.forEach((a) => a.stop());
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, skipSession]);

  // typing loader (only if the app is still loading after the animation)
  useEffect(() => {
    if (phase !== 'waiting') return;
    Animated.timing(A.typing, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const loops = A.dots.map((v, i) =>
      Animated.sequence([
        Animated.delay(i * 150),
        Animated.loop(Animated.timing(v, { toValue: 1, duration: 1100, easing: LINEAR, useNativeDriver: true })),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [phase, A]);

  /* ---------- sizes (CSS clamp()/vmin equivalents) ---------- */
  const { w, h } = size;
  const vmin = Math.min(w, h) / 100;
  const M = clamp(118, 34 * vmin, 190);
  const HH = M * 1.27;
  const fs = clamp(40, 12 * vmin, 72);
  const chipFs = clamp(12, 3.3 * vmin, 15);
  const tagFs = clamp(13, 3.7 * vmin, 17);
  const gap = clamp(14, 3.6 * vmin, 26);

  /* ---------- interpolations ---------- */
  const I = useMemo(() => {
    const land = (frames: Frame[]) => kf(A.body, frames);
    const bodyFrames = (v: [number, number, number, number, number]): Frame[] => [
      [0, v[0], LAND_FALL],
      [0.44, v[1], EASE_OUT],
      [0.52, v[2], EASE_OUT],
      [0.66, v[3], EASE_IN],
      [0.8, v[4], EASE],
      [1, v[1]],
    ];
    const hw = 0.5 * fs;
    return {
      bodyTy: land(bodyFrames([-0.8 * h, 0, 0, -0.07 * HH, 0])),
      bodySx: land(bodyFrames([0.92, 1, 1.14, 0.95, 1.04])),
      bodySy: land(bodyFrames([1.1, 1, 0.82, 1.06, 0.96])),
      bodyOp: kf(A.body, [[0, 0], [0.001, 1], [1, 1]]),

      shadowS: kf(A.shadow, [[0, 0.2], [0.44, 1], [0.52, 1.12], [0.66, 0.96], [1, 1]]),
      shadowOp: kf(A.shadow, [[0, 0], [0.44, 1], [1, 1]]),

      blobS: kf(A.blob, [[0, 0.001], [0.3, 1.15], [0.42, 0.95], [0.54, 1], [1, 1.9]], EASE_OUT),
      blobOp: kf(A.blob, [[0, 1], [0.54, 1], [1, 0]], EASE_OUT),

      rings: A.rings.map((r) => ({
        op: kf(r, [[0, 0], [0.001, 0.9, RING_EASE], [1, 0]]),
        s: kf(r, [[0, 0.7], [1, 2.3]], RING_EASE),
      })),

      glowOp: kf(A.glow, [[0, 0], [1, 1]], EASE_OUT),
      glowS: kf(A.breathe, [[0, 1], [0.5, 1.08], [1, 1]], EASE_IN_OUT),

      chips: GREETINGS.map(([, x, y], i) => {
        const p = A.chips[i];
        return {
          op: kf(p, [[0, 0], [0.18, 1], [1, 0.2]], CHIP_EASE),
          tx: kf(p, [[0, x * vmin], [0.18, 0.9 * x * vmin], [1, 0]], CHIP_EASE),
          ty: kf(p, [[0, y * vmin], [0.18, 0.9 * y * vmin], [1, 0]], CHIP_EASE),
          s: kf(p, [[0, 0.7], [0.18, 1], [1, 0.15]], CHIP_EASE),
        };
      }),

      eyeBallSy: kf(A.wink, [[0, 1, WINK_EASE], [0.54, 0.1], [1, 0.1]]),
      eyeBallOp: kf(A.wink, [[0, 1], [0.54, 1], [0.56, 0], [1, 0]]),
      eyeSkinOp: kf(A.wink, [[0, 1], [0.54, 1], [0.56, 0], [1, 0]]),

      sparks: A.sparks.map((p, i) => {
        const [sx, sy] = i === 0 ? [-10, -10] : [-12, 2];
        return {
          op: kf(p, [[0, 0], [0.4, 1], [1, 0]], EASE_OUT),
          s: kf(p, [[0, 0.001], [0.4, 1.2], [1, 0.4]], EASE_OUT),
          r: deg(kf(p, [[0, 0], [0.4, 45], [1, 90]], EASE_OUT)),
          tx: kf(p, [[0, 0], [0.4, 0], [1, sx]], EASE_OUT),
          ty: kf(p, [[0, 0], [0.4, 0], [1, sy]], EASE_OUT),
        };
      }),

      letters: A.letters.map((p) => ({
        op: kf(p, [[0, 0], [0.6, 1], [1, 1]]),
        ty: kf(p, [[0, 0.55 * fs], [1, 0]], LETTER_EASE),
        s: kf(p, [[0, 0.5], [1, 1]], LETTER_EASE),
        r: deg(kf(p, [[0, -10], [1, 0]], LETTER_EASE)),
      })),

      heartOp: kf(A.heart, [[0, 0], [0.3, 1], [1, 1]], DROP_EASE),
      heartTy: kf(A.heart, [[0, -2.4 * fs], [0.62, 0], [0.8, -0.08 * fs], [1, 0]], DROP_EASE),
      heartSx: Animated.multiply(
        kf(A.heart, [[0, 0.5], [0.62, 1.28], [0.8, 0.92], [1, 1]], DROP_EASE),
        kf(A.beat, [[0, 1], [0.3, 1.28], [0.55, 0.96], [0.75, 1.1], [1, 1]], EASE_IN_OUT),
      ),
      heartSy: Animated.multiply(
        kf(A.heart, [[0, 0.5], [0.62, 0.72], [0.8, 1.1], [1, 1]], DROP_EASE),
        kf(A.beat, [[0, 1], [0.3, 1.28], [0.55, 0.96], [0.75, 1.1], [1, 1]], EASE_IN_OUT),
      ),
      heartR: deg(kf(A.heart, [[0, -25], [0.62, 0], [1, 0]], DROP_EASE)),

      burstOp: kf(A.burst, [[0, 0], [0.001, 0.9, EASE_OUT], [1, 0]]),
      burstS: kf(A.burst, [[0, 0.6], [1, 2.6]], EASE_OUT),

      minis: A.minis.map((p, i) => {
        const [mx, mr] = i === 0 ? [-0.5, -20] : [0.55, 18];
        return {
          op: kf(p, [[0, 0], [0.25, 1], [1, 0]], EASE_OUT),
          tx: kf(p, [[0, 0], [1, mx * fs]], EASE_OUT),
          ty: kf(p, [[0, 0], [1, -1.1 * fs]], EASE_OUT),
          s: kf(p, [[0, 0.4], [1, 1]], EASE_OUT),
          r: deg(kf(p, [[0, 0], [1, mr]], EASE_OUT)),
        };
      }),
      hw,

      tagOp: kf(A.tag, [[0, 0], [1, 1]], EASE_OUT),
      tagTy: kf(A.tag, [[0, 8], [1, 0]], EASE_OUT),

      dots: A.dots.map((p) => ({
        ty: kf(p, [[0, 0], [0.3, -4], [0.6, 0], [1, 0]], EASE_IN_OUT),
        op: kf(p, [[0, 0.45], [0.3, 1], [0.6, 0.45], [1, 0.45]], EASE_IN_OUT),
      })),

      stageOp: kf(A.stageOut, [[0, 1], [1, 0]]),
      stageS: kf(A.stageOut, [[0, 1], [1, 1.12]]),
      holeR: A.hole.interpolate({ inputRange: [0, 1], outputRange: [0, 1.6 * Math.max(w, h)] }),
    };
  }, [A, w, h, HH, fs, vmin]);

  if (skipSession || phase === 'done') return null;

  /* ---------- helpers ---------- */
  const font = (family: string | undefined, weight: TextStyle['fontWeight']): TextStyle =>
    family ? { fontFamily: family } : { fontWeight: weight };
  const g = (c: RGBA, o = 1) => ({ stopColor: c[0], stopOpacity: c[1] * o });
  const showFx = reduce !== true; // chips, blob, rings, sparks, minis, burst, eye
  const closing = phase === 'closing';
  const lineH = fs * 1.2;

  const letterStyle = (i: number) => ({
    opacity: I.letters[i].op,
    transform: [{ translateY: I.letters[i].ty }, { scale: I.letters[i].s }, { rotate: I.letters[i].r }],
  });
  const letterText = (color: string): TextStyle => ({
    ...font(fonts?.bold, '700'),
    fontSize: fs,
    lineHeight: lineH,
    color,
    textShadowColor: C.letterShadow,
    textShadowOffset: { width: 0, height: 0.06 * fs },
    textShadowRadius: 0.09 * fs,
  });

  return (
    <Animated.View
      onLayout={onLayout}
      onTouchStart={skippable && canSkip && !closing ? close : undefined}
      pointerEvents={closing ? 'none' : 'auto'}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading HiHubble"
      style={[StyleSheet.absoluteFill, styles.root, { opacity: A.rootOpacity }, style]}
    >
      {/* ---- background (masked by the growing hole on exit) ---- */}
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`bg${uid}`} gradientUnits="userSpaceOnUse" cx={w * 0.5} cy={h * 0.4} rx={w * 1.2} ry={h * 0.9} fx={w * 0.5} fy={h * 0.4}>
            <Stop offset="0" stopColor={C.bg0} />
            <Stop offset="0.52" stopColor={C.bg1} />
            <Stop offset="1" stopColor={C.bg2} />
          </RadialGradient>
          <RadialGradient id={`bgg${uid}`} gradientUnits="userSpaceOnUse" cx={w * 0.5} cy={h * 0.38} rx={w * 0.6} ry={h * 0.45} fx={w * 0.5} fy={h * 0.38}>
            <Stop offset="0" {...g(C.bgGlow)} />
            <Stop offset="0.7" {...g(C.bgGlow, 0)} />
          </RadialGradient>
          <Mask id={`hole${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
            <Rect x={0} y={0} width={w} height={h} fill="#fff" />
            <AnimatedCircle cx={w / 2} cy={h * 0.46} r={I.holeR} fill="#000" />
          </Mask>
        </Defs>
        <G mask={`url(#hole${uid})`}>
          <Rect x={0} y={0} width={w} height={h} fill={`url(#bg${uid})`} />
          <Rect x={0} y={0} width={w} height={h} fill={`url(#bgg${uid})`} />
        </G>
      </Svg>

      {/* ---- ambient floating bubbles ---- */}
      {BOKEH.map(([x, y, s], i) => (
        <Animated.View
          key={`b${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (x / 100) * w,
            top: (y / 100) * h,
            width: s,
            height: s,
            opacity: Animated.multiply(A.bokeh[i], I.stageOp),
            transform: [
              { translateX: A.drift.interpolate({ inputRange: [0, 1], outputRange: [0, i % 2 ? 14 : -12] }) },
              { translateY: A.drift.interpolate({ inputRange: [0, 1], outputRange: [0, i % 3 ? -18 : 12] }) },
            ],
          }}
        >
          <Svg width={s} height={s}>
            <Defs>
              <RadialGradient id={`bk${uid}${i}`} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <Stop offset="0" {...g(C.bokehHi)} />
                <Stop offset="0.6" {...g(C.bokehLo)} />
                <Stop offset="1" {...g(C.bokehLo, 0)} />
              </RadialGradient>
            </Defs>
            <Circle cx={s / 2} cy={s / 2} r={s / 2} fill={`url(#bk${uid}${i})`} />
          </Svg>
        </Animated.View>
      ))}

      {/* ---- stage ---- */}
      <View style={styles.center} pointerEvents="none">
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: I.stageOp,
            transform: [{ translateY: -3 * vmin }, { scale: I.stageS }],
          }}
        >
          {/* hero: blob -> mascot */}
          <View style={{ width: M, height: HH }}>
            <Animated.View
              style={{
                position: 'absolute',
                left: -0.25 * M,
                top: 0.52 * HH - 0.75 * M,
                width: 1.5 * M,
                height: 1.5 * M,
                opacity: I.glowOp,
                transform: [{ scale: I.glowS }],
              }}
            >
              <Svg width={1.5 * M} height={1.5 * M}>
                <Defs>
                  <RadialGradient id={`gl${uid}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" {...g(C.glow)} />
                    <Stop offset="0.62" {...g(C.glow, 0)} />
                  </RadialGradient>
                </Defs>
                <Circle cx={0.75 * M} cy={0.75 * M} r={0.75 * M} fill={`url(#gl${uid})`} />
              </Svg>
            </Animated.View>

            {showFx &&
              GREETINGS.map(([text, , , color, , alt], i) => (
                <View key={`c${i}`} style={styles.center}>
                  <Animated.View
                    style={[
                      styles.chip,
                      {
                        backgroundColor: alt ? C.violet : C.chipBg,
                        borderColor: alt ? 'transparent' : C.chipEdge,
                        shadowColor: C.chipShadow,
                        shadowOpacity: C.chipShadowOpacity,
                        borderBottomLeftRadius: alt ? 16 : 4,
                        borderBottomRightRadius: alt ? 4 : 16,
                        opacity: I.chips[i].op,
                        transform: [
                          { translateX: I.chips[i].tx },
                          { translateY: I.chips[i].ty },
                          { scale: I.chips[i].s },
                        ],
                      },
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: color }]} />
                    <Text
                      numberOfLines={1}
                      style={{ ...font(fonts?.semibold, '600'), fontSize: chipFs, color: alt ? '#fff' : C.ink2 }}
                    >
                      {text}
                    </Text>
                  </Animated.View>
                </View>
              ))}

            {showFx &&
              I.rings.map((r, i) => (
                <Animated.View
                  key={`r${i}`}
                  style={{
                    position: 'absolute',
                    left: 0.21 * M,
                    top: HH / 2 - 0.29 * M,
                    width: 0.58 * M,
                    height: 0.58 * M,
                    borderRadius: 0.29 * M,
                    borderWidth: 3,
                    borderColor: i === 0 ? 'rgba(123,63,228,0.55)' : 'rgba(255,79,163,0.45)',
                    opacity: r.op,
                    transform: [{ scale: r.s }],
                  }}
                />
              ))}

            {showFx && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0.21 * M,
                  top: HH / 2 - 0.29 * M,
                  width: 0.58 * M,
                  height: 0.58 * M,
                  borderRadius: 0.29 * M,
                  backgroundColor: C.violet,
                  shadowColor: '#5A22C2',
                  shadowOpacity: 0.35,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 10 },
                  opacity: I.blobOp,
                  transform: [{ scale: I.blobS }],
                }}
              >
                <Svg width={0.58 * M} height={0.58 * M}>
                  <Defs>
                    <RadialGradient id={`bl${uid}`} cx="34%" cy="30%" r="96%" fx="34%" fy="30%">
                      <Stop offset="0" stopColor="#B892FF" />
                      <Stop offset="0.55" stopColor={C.violet} />
                      <Stop offset="1" stopColor="#5A22C2" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={0.29 * M} cy={0.29 * M} r={0.29 * M} fill={`url(#bl${uid})`} />
                </Svg>
              </Animated.View>
            )}

            {/* floor shadow */}
            <Animated.View
              style={{
                position: 'absolute',
                left: 0.19 * M,
                bottom: -0.02 * HH,
                width: 0.62 * M,
                height: 0.07 * HH,
                opacity: I.shadowOp,
                transform: [{ scale: I.shadowS }],
              }}
            >
              <Svg width={0.62 * M} height={0.07 * HH}>
                <Defs>
                  <RadialGradient id={`fl${uid}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" {...g(C.floor)} />
                    <Stop offset="1" {...g(C.floor, 0)} />
                  </RadialGradient>
                </Defs>
                <Ellipse cx={0.31 * M} cy={0.035 * HH} rx={0.31 * M} ry={0.035 * HH} fill={`url(#fl${uid})`} />
              </Svg>
            </Animated.View>

            {/* body drops in from the top, squashes on landing, settles */}
            <Animated.View
              style={{
                ...StyleSheet.absoluteFill,
                transformOrigin: '50% 100%',
                // iOS draws layer shadows from the image's alpha; elsewhere it would be a box
                ...(Platform.OS === 'ios'
                  ? {
                      shadowColor: C.bodyShadow,
                      shadowOpacity: C.bodyShadowOpacity,
                      shadowRadius: dark ? 14 : 8,
                      shadowOffset: { width: 0, height: 6 },
                    }
                  : null),
                opacity: I.bodyOp,
                transform: [{ translateY: I.bodyTy }, { scaleX: I.bodySx }, { scaleY: I.bodySy }],
              }}
            >
              <Image source={mascotSource} style={styles.fill} resizeMode="contain" />
              {showFx && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0.3864 * M,
                    top: 0.3578 * HH,
                    width: 0.1818 * M,
                    height: 0.1288 * HH,
                  }}
                >
                  <Animated.Image source={eyeSkinSource} style={[styles.fill, { opacity: I.eyeSkinOp }]} />
                  <Animated.Image
                    source={eyeSource}
                    style={[
                      styles.fill,
                      { opacity: I.eyeBallOp, transformOrigin: '50% 42%', transform: [{ scaleY: I.eyeBallSy }] },
                    ]}
                  />
                </View>
              )}
            </Animated.View>

            {showFx &&
              I.sparks.map((sp, i) => {
                const s = i === 0 ? 10 : 7;
                return (
                  <Animated.View
                    key={`s${i}`}
                    style={{
                      position: 'absolute',
                      left: (i === 0 ? 0.3 : 0.24) * M,
                      top: (i === 0 ? 0.3 : 0.4) * HH,
                      width: s,
                      height: s,
                      opacity: sp.op,
                      transform: [{ translateX: sp.tx }, { translateY: sp.ty }, { scale: sp.s }, { rotate: sp.r }],
                    }}
                  >
                    <Svg width={s} height={s} viewBox="0 0 10 10">
                      <Polygon
                        points="5,0 6.2,3.8 10,5 6.2,6.2 5,10 3.8,6.2 0,5 3.8,3.8"
                        fill={i === 0 ? C.pink : '#9D6BFF'}
                      />
                    </Svg>
                  </Animated.View>
                );
              })}
          </View>

          {/* wordmark */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: gap }} accessibilityLabel="HiHubble">
            <Animated.View style={letterStyle(0)}>
              <Text style={letterText(C.violet)}>H</Text>
            </Animated.View>
            <Animated.View style={letterStyle(1)}>
              <Text style={letterText(C.violet)}>ı</Text>
              {/* heart dropping onto the "ı" */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: -0.14 * fs,
                  marginLeft: -0.25 * fs,
                  width: I.hw,
                  height: 0.46 * fs,
                  transformOrigin: '50% 100%',
                  opacity: I.heartOp,
                  transform: [
                    { translateY: I.heartTy },
                    { rotate: I.heartR },
                    { scaleX: I.heartSx },
                    { scaleY: I.heartSy },
                  ],
                }}
              >
                <Heart id={`hg${uid}`} width={I.hw} height={0.46 * fs} />
                {showFx && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: (0.46 * fs - I.hw) / 2,
                      width: I.hw,
                      height: I.hw,
                      borderRadius: I.hw / 2,
                      borderWidth: Math.max(1, 0.04 * fs),
                      borderColor: C.pink,
                      opacity: I.burstOp,
                      transform: [{ scale: I.burstS }],
                    }}
                  />
                )}
                {showFx &&
                  I.minis.map((m, i) => (
                    <Animated.View
                      key={`m${i}`}
                      style={{
                        position: 'absolute',
                        left: I.hw / 2,
                        top: 0,
                        width: 0.2 * fs,
                        height: 0.18 * fs,
                        opacity: m.op,
                        transform: [{ translateX: m.tx }, { translateY: m.ty }, { scale: m.s }, { rotate: m.r }],
                      }}
                    >
                      <Heart id={`hm${i}${uid}`} width={0.2 * fs} height={0.18 * fs} />
                    </Animated.View>
                  ))}
              </Animated.View>
            </Animated.View>
            {'Hubble'.split('').map((ch, i) => (
              <Animated.View key={`l${i}`} style={letterStyle(i + 2)}>
                <Text style={letterText(C.ink)}>{ch}</Text>
              </Animated.View>
            ))}
          </View>

          {/* tagline */}
          <Animated.Text
            style={{
              ...font(fonts?.medium, '500'),
              marginTop: 2 + gap * 0.5,
              fontSize: tagFs,
              letterSpacing: 0.02 * tagFs,
              color: C.muted,
              textAlign: 'center',
              opacity: I.tagOp,
              transform: [{ translateY: I.tagTy }],
            }}
          >
            {tagline ?? (
              <>
                Say <Text style={{ ...font(fonts?.semibold, '600'), color: C.tagAccent }}>hi</Text> to your people
              </>
            )}
          </Animated.Text>
        </Animated.View>
      </View>

      {/* typing indicator = loader (only if the app is still loading) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.typing,
          {
            bottom: bottomInset + h * 0.07,
            backgroundColor: C.chipBg,
            borderColor: C.chipEdge,
            shadowColor: C.chipShadow,
            shadowOpacity: C.chipShadowOpacity,
            opacity: closing ? 0 : A.typing,
          },
        ]}
      >
        {I.dots.map((d, i) => (
          <Animated.View
            key={`d${i}`}
            style={[styles.dot, { backgroundColor: C.violet, opacity: d.op, transform: [{ translateY: d.ty }] }]}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 9999, elevation: 9999, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatar: { width: 18, height: 18, borderRadius: 9 },
  typing: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
