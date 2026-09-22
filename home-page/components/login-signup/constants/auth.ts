import { FormState } from '../types/auth';

export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export const INITIAL_FORM: FormState = {
  fullName: '',
  email: '',
  username: '',
  gender: '',
  dateOfBirth: null,
  password: '',
  confirmPassword: '',
  mobile: '',
  agreeToTerms: true,
};

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const FULL_NAME_REGEX = /^[a-zA-Z\s]+$/;

