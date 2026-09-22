/**
 * Demo screen — the React Native version of the preview page in the original
 * HTML file: a mock HiHubble feed, the splash on top, and controls for
 * Light / Dark, Replay and "Replay with slow load".
 */
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import HiHubbleSplash from './HiHubbleSplash';

type Theme = 'light' | 'dark';

export default function SplashDemo(props?: { fonts?: { medium?: string; semibold?: string; bold?: string } }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [run, setRun] = useState({ key: 0, delay: 0, visible: true });

  const ready = useMemo(
    () => new Promise<void>((r) => setTimeout(r, run.delay)),
    // new promise for every replay
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run.key],
  );
  const replay = (delay: number) => setRun((r) => ({ key: r.key + 1, delay, visible: true }));

  const d = theme === 'dark';
  const c = {
    bg: d ? '#0E0A20' : '#FBF9FF',
    text: d ? '#EDE7FF' : '#2B1668',
    card: d ? '#1A1333' : '#FFFFFF',
    line: d ? '#2A1B5E' : '#E7DBFF',
    g1: d ? '#2A1B5E' : '#E7DBFF',
    g2: d ? '#4A1C45' : '#FFE1F0',
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 52, paddingHorizontal: 16, paddingBottom: 140 }}>
        <Text style={[s.h2, { color: c.text }]}>
          <Text style={{ color: '#7B3FE4' }}>Hi</Text>Hubble
        </Text>
        <View style={s.stories}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={s.storyRing}>
              <View style={[s.story, { backgroundColor: c.line, borderColor: c.bg }]} />
            </View>
          ))}
        </View>
        {[0, 1].map((i) => (
          <View key={i} style={[s.post, { backgroundColor: c.card }]}>
            <View style={[s.postLine, { backgroundColor: c.line }]} />
            <View style={s.postImg}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id={`pg${i}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={c.g1} />
                    <Stop offset="1" stopColor={c.g2} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#pg${i})`} />
              </Svg>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={s.bar}>
        <View style={s.row}>
          {(['light', 'dark'] as Theme[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => {
                setTheme(t);
                replay(0);
              }}
              style={[s.btn, theme === t ? s.btnOn : s.ghost]}
            >
              <Text style={[s.btnText, theme !== t && { color: '#2B1668' }]}>{t === 'light' ? 'Light' : 'Dark'}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.row}>
          <Pressable onPress={() => replay(0)} style={s.btn}>
            <Text style={s.btnText}>Replay</Text>
          </Pressable>
          <Pressable onPress={() => replay(4500)} style={[s.btn, s.ghost]}>
            <Text style={[s.btnText, { color: '#2B1668' }]}>Replay with slow load</Text>
          </Pressable>
        </View>
        <Text style={s.note}>Tap the screen to skip. The typing dots only appear if the app is still loading after the animation.</Text>
      </View>

      {run.visible && (
        <HiHubbleSplash
          key={run.key}
          theme={theme}
          ready={ready}
          fonts={props?.fonts}
          onFinish={() => setRun((r) => ({ ...r, visible: false }))}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  h2: { fontSize: 24, fontWeight: '700', marginBottom: 14 },
  stories: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  storyRing: { width: 52, height: 52, borderRadius: 26, padding: 3, backgroundColor: '#FF4FA3', borderWidth: 2, borderColor: '#7B3FE4' },
  story: { flex: 1, borderRadius: 26, borderWidth: 2 },
  post: { borderRadius: 18, padding: 12, marginBottom: 12, shadowColor: '#4B2BA3', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  postLine: { height: 10, width: '40%', borderRadius: 6, marginBottom: 10 },
  postImg: { height: 150, borderRadius: 12, overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btn: { borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20, backgroundColor: '#7B3FE4' },
  btnOn: { backgroundColor: '#2B1668' },
  ghost: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(123,63,228,0.25)' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  note: { color: '#6D5E98', fontSize: 13, textAlign: 'center', maxWidth: 380 },
});
