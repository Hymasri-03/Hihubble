import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import FormField from '../common/FormField';
import GenderModal from './GenderModal';
import PolicyModal, { PolicyType } from './PolicyModal';
import { FormState, FormErrors } from '../../types/auth';
import { COLORS } from '../../constants/colors';

interface SignUpFormProps {
  form: FormState;
  errors: FormErrors;
  submitting: boolean;
  onUpdateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSubmit: () => void;
  onFieldFocus?: (yOffset: number) => void;
  onValidateField?: (key: keyof FormState) => void;
}

export default function SignUpForm({
  form,
  errors,
  submitting,
  onUpdateField,
  onSubmit,
  onFieldFocus,
  onValidateField,
}: SignUpFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [policyModal, setPolicyModal] = useState<{ visible: boolean; type: PolicyType }>({
    visible: false,
    type: null,
  });

  const maxDate18 = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const formattedDOB = useMemo(() => {
    if (!form.dateOfBirth) return '';
    const d = form.dateOfBirth;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, [form.dateOfBirth]);

  return (
    <View>
      {/* Full Name */}
      <FormField
        icon="person-outline"
        placeholder="Full Name..."
        value={form.fullName}
        onChangeText={(t) => onUpdateField('fullName', t.replace(/[^a-zA-Z\s]/g, ''))}
        error={errors.fullName}
        autoCapitalize="words"
        onFocus={() => onFieldFocus?.(140)}
        onBlur={() => onValidateField?.('fullName')}
      />

      {/* Email Address */}
      <FormField
        icon="mail-outline"
        placeholder="Email Address..."
        value={form.email}
        onChangeText={(t) => onUpdateField('email', t)}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        onFocus={() => onFieldFocus?.(195)}
        onBlur={() => onValidateField?.('email')}
      />

      {/* Choose Username */}
      <FormField
        icon="at-outline"
        placeholder="Choose Username..."
        value={form.username}
        onChangeText={(t) => onUpdateField('username', t)}
        error={errors.username}
        autoCapitalize="none"
        onFocus={() => onFieldFocus?.(250)}
        onBlur={() => onValidateField?.('username')}
      />

      {/* Gender */}
      <View style={styles.fieldWrap}>
        <Pressable
          style={[styles.inputRow, Boolean(errors.gender) && styles.inputRowError]}
          onPress={() => {
            onFieldFocus?.(305);
            setGenderModalVisible(true);
          }}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={COLORS.PURPLE_LIGHT}
            style={styles.inputIcon}
          />
          <Text style={[styles.inputText, !form.gender && styles.placeholderText]}>
            {form.gender || 'Gender'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.PURPLE_LIGHT} />
        </Pressable>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>

      {/* Date of Birth (Required with Age Limit) */}
      <View style={styles.fieldWrap}>
        <Pressable
          style={[styles.inputRow, Boolean(errors.dateOfBirth) && styles.inputRowError]}
          onPress={() => {
            onFieldFocus?.(360);
            if (Platform.OS === 'web') {
              const input = typeof document !== 'undefined'
                ? (document.getElementById('web-dob-input') as HTMLInputElement | null)
                : null;
              if (input) {
                try {
                  input.showPicker?.();
                } catch {
                  input.focus();
                }
              }
            } else {
              setShowDatePicker(true);
            }
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={COLORS.PURPLE_LIGHT}
            style={styles.inputIcon}
          />
          <Text style={[styles.inputText, !formattedDOB && styles.placeholderText]}>
            {formattedDOB || 'Date of Birth'}
          </Text>

          {Platform.OS === 'web' && (
            <input
              id="web-dob-input"
              type="date"
              max={maxDate18.toISOString().split('T')[0]}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                cursor: 'pointer',
              }}
              onChange={(e) => {
                if (e.target.value) {
                  const [year, month, day] = e.target.value.split('-').map(Number);
                  onUpdateField('dateOfBirth', new Date(year, month - 1, day));
                }
              }}
            />
          )}
        </Pressable>
        {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
      </View>

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={form.dateOfBirth || maxDate18}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maxDate18}
          onValueChange={(_event: any, selectedDate?: any) => {
            if (selectedDate) {
              onUpdateField('dateOfBirth', selectedDate);
            }
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
          }}
          onDismiss={() => {
            setShowDatePicker(false);
          }}
        />
      )}

      {/* Strong Password */}
      <FormField
        icon="lock-closed-outline"
        placeholder="Strong Password (min 8 chars)..."
        value={form.password}
        onChangeText={(t) => onUpdateField('password', t)}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowPassword((s) => !s)}
        onFocus={() => onFieldFocus?.(415)}
        onBlur={() => onValidateField?.('password')}
      />

      {/* Confirm Password */}
      <FormField
        icon="lock-closed-outline"
        placeholder="Confirm Password..."
        value={form.confirmPassword}
        onChangeText={(t) => onUpdateField('confirmPassword', t)}
        error={errors.confirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
        onRightIconPress={() => setShowConfirmPassword((s) => !s)}
        onFocus={() => onFieldFocus?.(470)}
        onBlur={() => onValidateField?.('confirmPassword')}
      />

      {/* Mobile Number */}
      <FormField
        icon="call-outline"
        placeholder="Mobile Number (10 digits)..."
        value={form.mobile}
        onChangeText={(t) => onUpdateField('mobile', t.replace(/[^0-9]/g, '').slice(0, 10))}
        error={errors.mobile}
        keyboardType="numeric"
        maxLength={10}
        onFocus={() => onFieldFocus?.(525)}
        onBlur={() => onValidateField?.('mobile')}
      />

      {/* Terms checkbox — positioned above submit button */}
      <View style={styles.termsWrap}>
        <View style={styles.checkboxRow}>
          <Pressable
            style={[
              styles.checkbox,
              form.agreeToTerms && styles.checkboxChecked,
            ]}
            onPress={() => onUpdateField('agreeToTerms', !form.agreeToTerms)}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.agreeToTerms }}
          >
            {form.agreeToTerms && (
              <Ionicons name="checkmark" size={12} color="#fff" />
            )}
          </Pressable>
          <Text style={styles.termsText}>
            <Text onPress={() => onUpdateField('agreeToTerms', !form.agreeToTerms)}>
              I agree to the{' '}
            </Text>
            <Text
              style={styles.termsLink}
              onPress={() => setPolicyModal({ visible: true, type: 'terms' })}
            >
              Terms & Conditions
            </Text>
            <Text onPress={() => onUpdateField('agreeToTerms', !form.agreeToTerms)}>
              {' '}and{' '}
            </Text>
            <Text
              style={styles.termsLink}
              onPress={() => setPolicyModal({ visible: true, type: 'privacy' })}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
        {errors.agreeToTerms && (
          <Text style={styles.termsErrorText}>
            {errors.agreeToTerms}
          </Text>
        )}
      </View>

      {/* Submit button: Sign Up with Magic Link */}
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
                name="paper-plane-outline"
                size={18}
                color="#fff"
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>Sign Up with Magic Link</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* Gender selection modal */}
      <GenderModal
        visible={genderModalVisible}
        selectedGender={form.gender}
        onSelect={(gender) => onUpdateField('gender', gender)}
        onClose={() => setGenderModalVisible(false)}
      />

      {/* Policy Modal popup with Back button */}
      <PolicyModal
        visible={policyModal.visible}
        type={policyModal.type}
        onClose={() => setPolicyModal({ visible: false, type: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 9,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.PURPLE_BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: COLORS.PURPLE_INPUT_BG,
  },
  inputRowError: {
    borderColor: COLORS.ERROR,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    color: COLORS.TEXT_PLACEHOLDER,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 11.5,
    marginTop: 3,
    marginLeft: 4,
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
    transform: [{ rotate: '-15deg' }],
  },
  termsWrap: {
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COLORS.PURPLE,
    borderColor: COLORS.PURPLE,
  },
  termsText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.TEXT_BODY,
  },
  termsLink: {
    color: COLORS.PURPLE,
    fontWeight: '700',
  },
  termsErrorText: {
    color: COLORS.ERROR,
    fontSize: 11.5,
    marginTop: 4,
    marginLeft: 28,
  },
});


