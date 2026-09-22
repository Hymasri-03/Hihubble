import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import HiHubbleSplash from './HiHubbleSplash';
import HomePage from './home-page';
import AuthScreen from './home-page/components/login-signup/screens/AuthScreen';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught an error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.box}>
          <Text style={errStyles.title}>Application Error</Text>
          <Text style={errStyles.msg}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    Font.loadAsync({
      Fredoka_500Medium,
      Fredoka_600SemiBold,
      Fredoka_700Bold,
    })
      .then(() => setFontsLoaded(true))
      .catch((err) => {
        console.warn('Custom font load failed, falling back to system font:', err);
        setFontsLoaded(true);
      });
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ErrorBoundary>
        <StatusBar style="dark" />

        {/* Authenticated Flow: Show AuthScreen (Sign Up & Login) after Splash, then HomePage */}
        {!isAuthenticated ? (
          <AuthScreen
            onSuccess={(user) => {
              setCurrentUser(user || null);
              setIsAuthenticated(true);
            }}
            onSkip={() => {
              setIsAuthenticated(true);
            }}
          />
        ) : (
          <HomePage
            currentUser={currentUser}
            onLogout={() => {
              setCurrentUser(null);
              setIsAuthenticated(false);
            }}
          />
        )}

        {/* HiHubble Splash Screen on top */}
        {showSplash && (
          <HiHubbleSplash
            theme="auto"
            ready={fontsLoaded}
            fonts={
              fontsLoaded
                ? {
                    medium: 'Fredoka_500Medium',
                    semibold: 'Fredoka_600SemiBold',
                    bold: 'Fredoka_700Bold',
                  }
                : undefined
            }
            onFinish={() => setShowSplash(false)}
          />
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const errStyles = StyleSheet.create({
  box: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    backgroundColor: '#160F2E',
  },
  title: {
    color: '#FF4FA3',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  msg: {
    color: '#EDE7FF',
    fontSize: 15,
    lineHeight: 22,
  },
});
