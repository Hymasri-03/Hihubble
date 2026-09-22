import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Keyboard,
  TouchableOpacity,
  StatusBar,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BackgroundDecorations from '../components/common/BackgroundDecorations';
import AuthTabs from '../components/auth/AuthTabs';
import SignUpForm from '../components/auth/SignUpForm';
import LoginForm from '../components/auth/LoginForm';
import OtpVerification from '../components/auth/OtpVerification';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import { Mode, FormState, FormErrors, StatusMessage } from '../types/auth';
import { INITIAL_FORM, EMAIL_REGEX } from '../constants/auth';
import { COLORS } from '../constants/colors';
import { validateAuthForm } from '../utils/validation';

// Clean full-screen 360-degree rotating mascot screen: NO text, NO boxes
function CleanRotatingMascotScreen() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    rotateAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.cleanMascotContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E5F0FF', '#D8E8FC', '#C8DFFA']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Image
          source={require('../assets/mascot_loading.png')}
          style={styles.cleanMascotImg}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

export interface AuthScreenProps {
  onSuccess?: (user?: { email: string; name?: string }) => void;
  onSkip?: () => void;
}

export default function AuthScreen({ onSuccess, onSkip }: AuthScreenProps = {}) {
  const [mode, setMode] = useState<Mode>('signup');
  const [authStep, setAuthStep] = useState<'form' | 'otp' | 'forgot_password'>('form');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll when any input is focused so that the active typing block is completely visible above the keyboard
  const handleFieldFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: yOffset,
        animated: true,
      });
    }, Platform.OS === 'ios' ? 80 : 120);
  };

  // Field updater
  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const updatedForm = { ...form, [key]: value };
    setForm(updatedForm);
    if (statusMessage) setStatusMessage(null);

    // Live validation for email field in both sign up and login modes
    if (key === 'email') {
      const emailStr = typeof value === 'string' ? value.trim() : '';
      if (!emailStr) {
        setErrors((prev) => ({ ...prev, email: 'Email address is required.' }));
      } else if (!EMAIL_REGEX.test(emailStr)) {
        setErrors((prev) => ({
          ...prev,
          email: 'Enter a valid email address (e.g. name@example.com).',
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
      return;
    }

    // If an error is already showing for this field, re-validate live as user types
    if (errors[key]) {
      const { errors: validationErrors } = validateAuthForm(mode, updatedForm);
      setErrors((prev) => ({ ...prev, [key]: validationErrors[key] }));
    } else {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // Individual field validator (e.g. on blur)
  const handleValidateField = (key: keyof FormState) => {
    const { errors: validationErrors } = validateAuthForm(mode, form);
    setErrors((prev) => ({ ...prev, [key]: validationErrors[key] }));
  };

  // Submit handler: validates form and either logs in directly or transitions to 6-digit OTP verification for registration
  const handleSubmit = async () => {
    setStatusMessage(null);
    const { isValid, errors: validationErrors } = validateAuthForm(mode, form);

    if (!isValid) {
      setErrors(validationErrors);
      setStatusMessage({
        type: 'error',
        text: 'Please fix the highlighted fields and try again.',
      });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (mode === 'signup') {
      // "dont load mascot before the otp page": go directly to OTP screen without any delay!
      setAuthStep('otp');
      return;
    }

    // Login mode: immediately display the clean rotating mascot screen for 1.8s, then enter Home directly!
    setIsNavigatingHome(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      onSuccess?.({ email: form.email });
    } catch {
      setIsNavigatingHome(false);
      setStatusMessage({
        type: 'error',
        text: 'Login failed. Please check your credentials.',
      });
    }
  };

  const handleVerifySuccess = async () => {
    const userPayload = {
      email: form.email,
      name: form.fullName?.trim() || 'HiHubble User',
    };
    // OTP verified: immediately display the clean rotating mascot screen for 1.8s, then enter Home directly!
    setIsNavigatingHome(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    onSuccess?.(userPayload);
  };

  // ------------------------------------------------------------------
  // 3D Single-Rotation Flip Animation with Clean Shadow Transition
  // ------------------------------------------------------------------
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isFlipping = useRef(false);

  const switchMode = (nextMode: Mode) => {
    if (nextMode === mode || isFlipping.current) return;
    isFlipping.current = true;

    // Direction: signup -> login rotates +90°, login -> signup rotates -90°
    const direction = nextMode === 'login' ? 1 : -1;

    Animated.parallel([
      Animated.timing(flipAnim, {
        toValue: direction * 90,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Midway point: card is edge-on to the screen; swap form content
      setMode(nextMode);
      setAuthStep('form');
      setErrors({});
      setStatusMessage(null);
      flipAnim.setValue(-direction * 90);

      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isFlipping.current = false;
      });
    });
  };

  const rotateY = flipAnim.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const animatedCardStyle = {
    transform: [
      { perspective: 1000 },
      { scale: scaleAnim },
      { rotateY },
    ],
  };

  // Eliminates background shadow during 3D flip:
  // When card rotates away from 0deg, shadow smoothly fades to 0% opacity
  const shadowOpacity = flipAnim.interpolate({
    inputRange: [-90, -45, 0, 45, 90],
    outputRange: [0, 0, 1, 0, 0],
  });

  if (isNavigatingHome) {
    return <CleanRotatingMascotScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Lavender gradient & floating decorative shapes */}
      <BackgroundDecorations />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {/* Top Skip / Guest link */}
          {onSkip && (
            <View style={styles.topNavRow}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={onSkip}
                activeOpacity={0.75}
                style={styles.skipPill}
              >
                <Text style={styles.skipPillText}>Explore as Guest</Text>
                <Ionicons name="arrow-forward" size={13} color={COLORS.PURPLE} />
              </TouchableOpacity>
            </View>
          )}

          {/* Header: Mascot + 3D Logo floating directly on background */}
          <View style={styles.header}>
            <Image
              source={require('../assets/hihubble-logo.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
            {/* Tagline Pill Badge: CONNECT • SHARE • BELONG */}
            <View style={styles.taglineBadge}>
              <Text style={styles.taglineText}>CONNECT</Text>
              <View style={styles.taglineDot} />
              <Text style={styles.taglineText}>SHARE</Text>
              <View style={styles.taglineDot} />
              <Text style={styles.taglineText}>BELONG</Text>
            </View>
          </View>

          {/* Card Container with Dynamic Shadow Layer */}
          <View style={styles.cardWrapper}>
            {/* Underlying shadow layer that fades out completely during rotation */}
            <Animated.View style={[styles.cardShadowLayer, { opacity: shadowOpacity }]} />

            {/* Rotating 3D Card (zero shadow on the card itself so no background artifacts appear) */}
            <Animated.View style={[styles.card, animatedCardStyle]}>
              {authStep === 'otp' ? (
                /* 6-Digit OTP Verification Screen */
                <OtpVerification
                  targetDestination={form.mobile || form.email}
                  onVerifySuccess={handleVerifySuccess}
                  onBackToForm={() => setAuthStep('form')}
                />
              ) : authStep === 'forgot_password' ? (
                /* Forgot Password: Email OTP & Create New Password Screen */
                <ForgotPasswordForm
                  initialEmail={form.email}
                  onBackToLogin={() => setAuthStep('form')}
                  onResetSuccess={() => {
                    setAuthStep('form');
                    setMode('login');
                    setStatusMessage({
                      type: 'success',
                      text: 'Password reset successfully! Please log in with your new password.',
                    });
                  }}
                  onFieldFocus={handleFieldFocus}
                />
              ) : (
                /* Standard Sign Up / Login Form */
                <>
                  {/* Tabs (Sign Up left, Login right) */}
                  <AuthTabs mode={mode} onSwitchMode={switchMode} />

                  {/* Status banner */}
                  {statusMessage && (
                    <View
                      style={[
                        styles.statusBanner,
                        statusMessage.type === 'success'
                          ? styles.statusSuccess
                          : styles.statusError,
                      ]}
                    >
                      <Ionicons
                        name={statusMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                        size={18}
                        color={statusMessage.type === 'success' ? COLORS.SUCCESS_TEXT : COLORS.ERROR_TEXT}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          statusMessage.type === 'success'
                            ? styles.statusTextSuccess
                            : styles.statusTextError,
                        ]}
                      >
                        {statusMessage.text}
                      </Text>
                    </View>
                  )}

                  {/* Form Content */}
                  {mode === 'signup' ? (
                    <SignUpForm
                      form={form}
                      errors={errors}
                      submitting={submitting}
                      onUpdateField={updateField}
                      onSubmit={handleSubmit}
                      onFieldFocus={handleFieldFocus}
                      onValidateField={handleValidateField}
                    />
                  ) : (
                    <LoginForm
                      form={form}
                      errors={errors}
                      submitting={submitting}
                      onUpdateField={updateField}
                      onSubmit={handleSubmit}
                      onForgotPassword={() => setAuthStep('forgot_password')}
                      onFieldFocus={handleFieldFocus}
                      onValidateField={handleValidateField}
                    />
                  )}
                </>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.PURPLE_SOFT,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  headerImage: {
    width: 270,
    height: 116,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.PURPLE_BORDER,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginTop: -8,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignSelf: 'center',
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: 1.2,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.PURPLE_LIGHT,
    marginHorizontal: 8,
  },
  cardWrapper: {
    position: 'relative',
    width: '100%',
  },
  // Separate shadow layer behind the card that smoothly fades to 0 during flip
  cardShadowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  // The rotating card itself has NO shadow/elevation attached, preventing background shadow streaks during 3D flip
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    backfaceVisibility: 'hidden',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  statusSuccess: {
    backgroundColor: COLORS.SUCCESS_BG,
  },
  statusError: {
    backgroundColor: COLORS.ERROR_BG,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: COLORS.SUCCESS_TEXT,
  },
  statusTextError: {
    color: COLORS.ERROR_TEXT,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
  },
  skipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.PURPLE_BORDER,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  skipPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.PURPLE,
  },
  cleanMascotContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F0FF',
  },
  cleanMascotImg: {
    width: 140,
    height: 175,
  },
});
