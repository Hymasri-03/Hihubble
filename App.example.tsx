/**
 * How to wire the splash into an Expo app.
 *
 *   npx expo install react-native-svg expo-splash-screen expo-font @expo-google-fonts/fredoka
 */
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import HiHubbleSplash from './HiHubbleSplash';

// Keep the native (static) splash up until the fonts are ready,
// then hand over to the animated HiHubble splash.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Replace with your real startup work: auth check, fetch feed, etc.
    const t = setTimeout(() => setAppReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }}>
      {/* your real app goes here */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Your app</Text>
      </View>

      {showSplash && (
        <HiHubbleSplash
          theme="auto"
          ready={appReady}
          fonts={{ medium: 'Fredoka_500Medium', semibold: 'Fredoka_600SemiBold', bold: 'Fredoka_700Bold' }}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </View>
  );
}
