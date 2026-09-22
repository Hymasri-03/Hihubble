# HiHubble Splash — React Native (TypeScript)

React Native port of `spalsh_screen.html`. Same timeline (~2.7 s): greetings fly in and merge, the
bubble pops, Hubble drops in, squashes, winks, the wordmark bounces in, the heart drops onto the "ı",
and the splash opens like a bubble to reveal the app. Light/dark theme, tap to skip, respects
"Reduce motion", optional typing-dots loader while the app is still loading.

## Files
- `HiHubbleSplash/HiHubbleSplash.tsx` — the component
- `HiHubbleSplash/assets/splash/*.png` — mascot, open eye, eye skin (extracted from the HTML file)
- `SplashDemo.tsx` — demo screen (mock feed + Light/Dark, Replay, Replay with slow load)
- `App.example.tsx` — how to wire it into an Expo app with Fredoka fonts

## Install
```
npx expo install react-native-svg
# optional, for the Fredoka font used in the original:
npx expo install expo-font expo-splash-screen @expo-google-fonts/fredoka
```
Needs React Native 0.73+ (Expo SDK 50+) because it uses the `transformOrigin` style.
Copy the `HiHubbleSplash` folder into your project (e.g. `src/components/`).

## Usage
Render it on top of your app — it is absolutely positioned and removes itself:
```tsx
{showSplash && (
  <HiHubbleSplash ready={appReady} onFinish={() => setShowSplash(false)} />
)}
```

## Props
| prop | default | notes |
|---|---|---|
| `theme` | `'auto'` | `'auto' \| 'light' \| 'dark'` |
| `ready` | `true` | boolean or Promise — splash waits for it (and `minDuration`) |
| `minDuration` | `2700` | ms the full animation gets to play |
| `maxDuration` | `9000` | safety cap in ms |
| `skippable` | `true` | tap anywhere to skip (after ~0.9 s) |
| `oncePerSession` | `false` | show only on the first launch of this JS session |
| `onFinish` | — | called when the splash is fully gone |
| `tagline` | Say **hi** to your people | any ReactNode |
| `mascotSource`, `eyeSource`, `eyeSkinSource` | bundled PNGs | swap artwork |
| `fonts` | system font | `{ medium, semibold, bold }` loaded font family names |
| `bottomInset` | `0` | e.g. safe-area bottom inset for the loader |

## Differences from the web version
- Wordmark letters use solid brand colours instead of CSS gradient text (avoids an extra MaskedView dependency).
- The blob's blur on exit and the Android drop-shadow on the mascot are not available natively; iOS keeps the shadow.
- The "bubble pop" exit is done with an SVG mask hole on the background while the stage scales/fades — same look.
