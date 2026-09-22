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
import FormField from '../common/FormField';
import { COLORS } from '../../constants/colors';
import { EMAIL_REGEX } from '../../constants/auth';

interface ForgotPasswordFormProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  onResetSuccess: () => void;
  onFieldFocus?: (yOffset: number) => void;
}

export default function ForgotPasswordForm({
  initialEmail = '',
  onBackToLogin,
  onResetSuccess,
  onFieldFocus,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number>(-1);
  const [otpSent, setOtpSent] = useState(true); // default true so user sees the complete verification fields immediately
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(
    'A 6-digit confirmation code has been sent to your email.'
  );
  const [submitting, setSubmitting] = useState(false);

  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // 30-second countdown for Resend OTP
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

  const handleSendOtp = async () => {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setSendingOtp(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOtpSent(true);
      setCountdown(30);
      setCanResend(false);
      setSuccessNotice(`A fresh 6-digit OTP code has been sent to ${email.trim()}`);
      otpInputRefs.current[0]?.focus();
    } catch {
      setErrorMessage('Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    setErrorMessage(null);
    const numericOnly = text.replace(/[^0-9]/g, '');

    // Multi-digit paste handling
    if (numericOnly.length > 1) {
      const pasted = numericOnly.slice(0, 6).split('');
      const updated = [...otp];
      pasted.forEach((char, i) => {
        updated[i] = char;
      });
      setOtp(updated);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...otp];
    updated[index] = numericOnly;
    setOtp(updated);

    if (numericOnly.length === 1 && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      setErrorMessage(null);
      if (otp[index] === '' && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        const updated = [...otp];
        updated[index - 1] = '';
        setOtp(updated);
      }
    }
  };

  const handleResetSubmit = async () => {
    setErrorMessage(null);

    // 1. Email check
    if (!email.trim()) {
      setErrorMessage('Registered email is required.');
      onFieldFocus?.(80);
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      onFieldFocus?.(80);
      return;
    }

    // 2. OTP check
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP confirmation code.');
      onFieldFocus?.(170);
      const firstEmpty = otp.findIndex((d) => d === '');
      if (firstEmpty !== -1) {
        otpInputRefs.current[firstEmpty]?.focus();
      }
      return;
    }

    // 3. New password check
    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      onFieldFocus?.(280);
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      onFieldFocus?.(280);
      return;
    }

    // 4. Confirm password check
    if (!confirmPassword) {
      setErrorMessage('Please confirm your new password.');
      onFieldFocus?.(350);
      return;
    }
    if (confirmPassword !== newPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      onFieldFocus?.(350);
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call to reset password
      await new Promise((resolve) => setTimeout(resolve, 1400));
      onResetSuccess();
    } catch {
      setErrorMessage('Unable to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back to Login link */}
      <Pressable onPress={onBackToLogin} style={styles.backButton} hitSlop={10}>
        <Ionicons name="arrow-back" size={18} color={COLORS.PURPLE} />
        <Text style={styles.backButtonText}>Back to Login</Text>
      </Pressable>

      {/* Title & Subtitle */}
      <View style={styles.headerWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={26} color={COLORS.PURPLE} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your confirmation OTP sent via email, then set a new password.
        </Text>
      </View>

      {/* Error & Success status notices */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={17} color={COLORS.ERROR_TEXT} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      {successNotice && !errorMessage && (
        <View style={styles.successBanner}>
          <Ionicons name="mail-unread-outline" size={17} color={COLORS.SUCCESS_TEXT} />
          <Text style={styles.successBannerText}>{successNotice}</Text>
        </View>
      )}

      {/* 1. Registered Email Input */}
      <FormField
        icon="mail-outline"
        placeholder="Registered Email Address..."
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        onFocus={() => onFieldFocus?.(80)}
      />

      {/* 2. OTP Confirmation from Email */}
      <View style={styles.otpSection}>
        <View style={styles.otpLabelRow}>
          <Text style={styles.otpSectionLabel}>Enter 6-Digit Email OTP</Text>
          {canResend ? (
            <Pressable onPress={handleSendOtp} disabled={sendingOtp} hitSlop={8}>
              {sendingOtp ? (
                <ActivityIndicator size="small" color={COLORS.PURPLE} />
              ) : (
                <Text style={styles.resendLink}>Resend OTP</Text>
              )}
            </Pressable>
          ) : (
            <Text style={styles.timerText}>
              Resend in {countdown < 10 ? `00:0${countdown}` : `00:${countdown}`}
            </Text>
          )}
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => {
            const isFocused = focusedOtpIndex === idx;
            const isFilled = digit.length > 0;
            return (
              <TextInput
                key={idx}
                ref={(ref) => {
                  otpInputRefs.current[idx] = ref;
                }}
                style={[
                  styles.otpBox,
                  isFocused && styles.otpBoxFocused,
                  isFilled && styles.otpBoxFilled,
                ]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, idx)}
                onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                onFocus={() => {
                  setFocusedOtpIndex(idx);
                  onFieldFocus?.(170);
                }}
                onBlur={() => setFocusedOtpIndex(-1)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                textAlign="center"
              />
            );
          })}
        </View>
      </View>

      {/* 3. Create New Password */}
      <FormField
        icon="lock-closed-outline"
        placeholder="Create New Password (min 8 chars)..."
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showNewPassword}
        autoCapitalize="none"
        rightIcon={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowNewPassword((s) => !s)}
        onFocus={() => onFieldFocus?.(270)}
      />

      {/* 4. Confirm Password */}
      <FormField
        icon="lock-closed-outline"
        placeholder="Confirm New Password..."
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowConfirmPassword((s) => !s)}
        onFocus={() => onFieldFocus?.(340)}
      />

      {/* Submit Button */}
      <Pressable
        onPress={handleResetSubmit}
        disabled={submitting}
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
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={20}
                color="#fff"
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>Reset Password & Login</Text>
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
    marginBottom: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PURPLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: COLORS.TEXT_BODY,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ERROR_BG,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 7,
  },
  errorBannerText: {
    flex: 1,
    color: COLORS.ERROR_TEXT,
    fontSize: 12,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SUCCESS_BG,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 7,
  },
  successBannerText: {
    flex: 1,
    color: COLORS.SUCCESS_TEXT,
    fontSize: 12,
    fontWeight: '600',
  },
  otpSection: {
    marginBottom: 10,
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  otpSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  resendLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.PURPLE,
  },
  timerText: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  otpBox: {
    flex: 1,
    maxWidth: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: COLORS.PURPLE_BORDER,
    backgroundColor: COLORS.PURPLE_INPUT_BG,
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  otpBoxFocused: {
    borderColor: COLORS.PURPLE,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: COLORS.PURPLE_LIGHT,
  },
  submitButtonWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
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
