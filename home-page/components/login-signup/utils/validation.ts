import { Mode, FormState, FormErrors } from '../types/auth';
import { EMAIL_REGEX, INDIAN_MOBILE_REGEX, FULL_NAME_REGEX } from '../constants/auth';

export function validateAuthForm(mode: Mode, form: FormState): { isValid: boolean; errors: FormErrors } {
  const newErrors: FormErrors = {};

  if (mode === 'signup') {
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (!FULL_NAME_REGEX.test(form.fullName.trim())) {
      newErrors.fullName = 'Full name must contain only letters.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'Enter a valid email address (e.g. name@example.com).';
    }

    if (!form.username.trim()) {
      newErrors.username = 'Please choose a username.';
    } else if (form.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }

    if (!form.gender) {
      newErrors.gender = 'Please select a gender.';
    }

    if (!form.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required.';
    } else {
      const today = new Date();
      const birthDate = new Date(form.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.dateOfBirth = 'Age limit: You must be at least 18 years old to register.';
      }
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!INDIAN_MOBILE_REGEX.test(form.mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number (starts with 6-9).';
    }

    if (!form.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Privacy Policy.';
    }
  } else {
    // Login mode
    const emailTrimmed = form.email.trim();
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(emailTrimmed)) {
      newErrors.email = 'Enter a valid email address (e.g. name@example.com).';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    }
  }

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  };
}
