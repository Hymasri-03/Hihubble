import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FormField from '../common/FormField';
import { FormState, FormErrors } from '../../types/auth';
import { COLORS } from '../../constants/colors';

interface LoginFormProps {
  form: FormState;
  errors: FormErrors;
  submitting: boolean;
  onUpdateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onFieldFocus?: (yOffset: number) => void;
  onValidateField?: (key: keyof FormState) => void;
}

export default function LoginForm({
  form,
  errors,
  submitting,
  onUpdateField,
  onSubmit,
  onForgotPassword,
  onFieldFocus,
  onValidateField,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View>
      {/* Email Address */}
      <FormField
        icon="mail-outline"
        placeholder="Email Address..."
        value={form.email}
        onChangeText={(t) => onUpdateField('email', t)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        onFocus={() => onFieldFocus?.(150)}
        onBlur={() => onValidateField?.('email')}
      />

      {/* Password */}
      <FormField
        icon="lock-closed-outline"
        placeholder="Password..."
        value={form.password}
        onChangeText={(t) => onUpdateField('password', t)}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPassword((s) => !s)}
        onFocus={() => onFieldFocus?.(210)}
        onBlur={() => onValidateField?.('password')}
      />

      {/* Forgot Password link */}
      <View style={styles.forgotPasswordWrap}>
        <Pressable onPress={onForgotPassword} hitSlop={8}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>
      </View>

      {/* Submit button: Login */}
      <Pressable
        onPress={onSubmit}
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
                name="log-in-outline"
                size={18}
                color="#fff"
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>Login</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  forgotPasswordWrap: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    color: COLORS.PURPLE,
    fontSize: 13,
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
