import { Ionicons } from '@expo/vector-icons';

export type Mode = 'signup' | 'login';

export interface FormState {
  fullName: string;
  email: string;
  username: string;
  gender: string;
  dateOfBirth: Date | null;
  password: string;
  confirmPassword: string;
  mobile: string;
  agreeToTerms: boolean;
}

export interface FormErrors {
  fullName?: string;
  email?: string;
  username?: string;
  gender?: string;
  dateOfBirth?: string;
  password?: string;
  confirmPassword?: string;
  mobile?: string;
  agreeToTerms?: string;
}

export interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

export interface FormFieldProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  maxLength?: number;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
