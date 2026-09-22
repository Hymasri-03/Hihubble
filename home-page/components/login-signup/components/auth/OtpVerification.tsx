import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

interface OtpVerificationProps {
  targetDestination: string; // e.g., mobile number or email
  onVerifySuccess: () => void;
  onBackToForm: () => void;
}

export default function OtpVerification({
  targetDestination,
  onVerifySuccess,
  onBackToForm,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotification, setResendNotification] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // 30-second countdown timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleChangeText = (text: string, index: number) => {
    setErrorMessage(null);
    setResendNotification(null);

    const numericOnly = text.replace(/[^0-9]/g, '');

    // Handle full paste of up to 6 digits
    if (numericOnly.length > 1) {
      const pasted = numericOnly.slice(0, 6).split('');
      const updated = [...otp];
      pasted.forEach((char, i) => {
        updated[i] = char;
      });
      setOtp(updated);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = numericOnly;
    setOtp(updated);

    // Auto-advance to next input
    if (numericOnly.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      setErrorMessage(null);
      if (otp[index] === '' && index > 0) {
        // Move to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const updated = [...otp];
        updated[index - 1] = '';
        setOtp(updated);
      }
    }
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    setResendNotification(null);

    const fullCode = otp.join('');

    if (fullCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      // Focus first empty box
      const firstEmpty = otp.findIndex((digit) => digit === '');
      if (firstEmpty !== -1) {
        inputRefs.current[firstEmpty]?.focus();
      }
      return;
    }

    setVerifying(true);
    try {
      // Simulate network verification
      await new Promise((resolve) => setTimeout(resolve, 1400));
      onVerifySuccess();
    } catch {
      setErrorMessage('Verification failed. Please check the code and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    setCountdown(30);
    setCanResend(false);
    setErrorMessage(null);
    setResendNotification('A fresh 6-digit verification code has been sent!');
    inputRefs.current[0]?.focus();
  };

  const formatTimer = (sec: number) => {
    const s = sec < 10 ? `0${sec}` : `${sec}`;
    return `00:${s}`;
  };

  const formattedDestination =
    targetDestination.length === 10
      ? `+91 ${targetDestination.slice(0, 5)} ${targetDestination.slice(5)}`
      : targetDestination || 'your registered number/email';

  return (
    <View style={styles.container}>
      {/* Top back navigation to edit details */}
      <Pressable onPress={onBackToForm} style={styles.backButton} hitSlop={10}>
        <Ionicons name="arrow-back" size={18} color={COLORS.PURPLE} />
        <Text style={styles.backButtonText}>Edit Details</Text>
      </Pressable>

      {/* Title & subtitle */}
      <View style={styles.headerWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={28} color={COLORS.PURPLE} />
        </View>
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{' '}
          <Text style={styles.destinationHighlight}>{formattedDestination}</Text>
        </Text>
      </View>

      {/* Error / Resend status banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={17} color={COLORS.ERROR_TEXT} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      {resendNotification && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={17} color={COLORS.SUCCESS_TEXT} />
          <Text style={styles.successBannerText}>{resendNotification}</Text>
        </View>
      )}

      {/* 6 OTP Input Boxes */}
      <View style={styles.otpRow}>
        {otp.map((digit, idx) => {
          const isFocused = focusedIndex === idx;
          const isFilled = digit.length > 0;
          return (
            <TextInput
              key={idx}
              ref={(ref) => {
                inputRefs.current[idx] = ref;
              }}
              style={[
                styles.otpBox,
                isFocused && styles.otpBoxFocused,
                isFilled && styles.otpBoxFilled,
                Boolean(errorMessage) && styles.otpBoxError,
              ]}
              value={digit}
              onChangeText={(text) => handleChangeText(text, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              onFocus={() => setFocusedIndex(idx)}
              keyboardType="number-pad"
              maxLength={6} // Allows paste detection
              selectTextOnFocus
              textAlign="center"
              autoFocus={idx === 0}
            />
          );
        })}
      </View>

      {/* Resend OTP with Countdown Timer */}
      <View style={styles.resendRow}>
        <Text style={styles.resendPrompt}>Didn't receive the code? </Text>
        {canResend ? (
          <Pressable onPress={handleResend} hitSlop={8} style={styles.resendAction}>
            <Ionicons name="refresh" size={14} color={COLORS.PURPLE} style={{ marginRight: 3 }} />
            <Text style={styles.resendLink}>Resend OTP</Text>
          </Pressable>
        ) : (
          <View style={styles.timerWrap}>
            <Ionicons name="time-outline" size={14} color={COLORS.TEXT_MUTED} style={{ marginRight: 3 }} />
            <Text style={styles.timerText}>Resend in {formatTimer(countdown)}</Text>
          </View>
        )}
      </View>

      {/* Verify & Proceed Button */}
      <Pressable
        onPress={handleVerify}
        disabled={verifying}
        style={({ pressed }) => [
          styles.submitButtonWrap,
          pressed && { opacity: 0.9 },
        ]}
      >
        <LinearGradient
          colors={[COLORS.PURPLE_GRADIENT_START, COLORS.PURPLE_GRADIENT_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitButton}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>Verify & Proceed</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backButtonText: {
    color: COLORS.PURPLE,
    fontWeight: '700',
    fontSize: 13.5,
    marginLeft: 4,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.PURPLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_BODY,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  destinationHighlight: {
    color: COLORS.PURPLE,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ERROR_BG,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 7,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.ERROR_TEXT,
    fontSize: 12.5,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SUCCESS_BG,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 7,
  },
  successBannerText: {
    flex: 1,
    color: COLORS.SUCCESS_TEXT,
    fontSize: 12.5,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    gap: 6,
  },
  otpBox: {
    flex: 1,
    maxWidth: 48,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.PURPLE_BORDER,
    backgroundColor: COLORS.PURPLE_INPUT_BG,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  otpBoxFocused: {
    borderColor: COLORS.PURPLE,
    backgroundColor: '#fff',
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: COLORS.PURPLE_LIGHT,
  },
  otpBoxError: {
    borderColor: COLORS.ERROR,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  resendPrompt: {
    fontSize: 12.5,
    color: COLORS.TEXT_BODY,
  },
  resendAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLink: {
    color: COLORS.PURPLE,
    fontWeight: '700',
    fontSize: 12.5,
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 12.5,
    color: COLORS.TEXT_MUTED,
    fontWeight: '600',
  },
  submitButtonWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: COLORS.CARD_SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  submitIcon: {
    marginRight: 8,
  },
});
