import { INDIAN_MOBILE_REGEX } from '../constants/auth';

const OTP_API_KEY =
  process.env.EXPO_PUBLIC_OTP_API_KEY ||
  process.env.OTP_API_KEY ||
  'lLURDiSCnuAJzeFhPkgcm610dQHIVMKsbX9OBWwNq2ZGja45YrKMfJE8sXm3Ne9SvxwBiL6Z2lPgn01R';

export interface SendOtpResult {
  success: boolean;
  message: string;
  otpCode: string;
  statusCode?: number;
}

// Store the latest active OTP code per destination for validation
const activeOtpStore: Record<string, string> = {};

/**
 * Generate a random 6-digit OTP code
 */
export const generateRandomOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via Fast2SMS API gateway with automatic fallback to Quick SMS (route=q)
 */
export const sendOtpToMobile = async (
  mobileNumber: string,
  otpCode: string
): Promise<SendOtpResult> => {
  const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');

  try {
    // 1. Try Fast2SMS 'otp' route (GET request)
    const otpUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${OTP_API_KEY}&route=otp&variables_values=${otpCode}&flash=0&numbers=${cleanMobile}`;
    let response = await fetch(otpUrl);
    let data = await response.json();

    console.log('Fast2SMS OTP Route Response:', data);

    if (data.return === true || data.status_code === 200) {
      activeOtpStore[cleanMobile] = otpCode;
      return {
        success: true,
        message: `OTP sent successfully to +91 ${cleanMobile}!`,
        otpCode,
        statusCode: 200,
      };
    }

    // 2. If 'otp' route requires website verification (996) or DLT, try Quick SMS ('q' route)
    if (data.status_code === 996 || data.status_code === 412 || !data.return) {
      const quickUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${OTP_API_KEY}&route=q&message=${encodeURIComponent(
        `Your HiHubble OTP verification code is ${otpCode}`
      )}&flash=0&numbers=${cleanMobile}`;

      response = await fetch(quickUrl);
      data = await response.json();
      console.log('Fast2SMS Quick SMS Route Response:', data);

      if (data.return === true || data.status_code === 200) {
        activeOtpStore[cleanMobile] = otpCode;
        return {
          success: true,
          message: `OTP sent via SMS to +91 ${cleanMobile}!`,
          otpCode,
          statusCode: 200,
        };
      }
    }

    // 3. If Fast2SMS fails due to DND / website verification (996 / 427), store OTP for demo verification & explain
    activeOtpStore[cleanMobile] = otpCode;
    let gatewayNotice = data.message || 'Fast2SMS Gateway Error';
    if (data.status_code === 996) {
      gatewayNotice = 'Fast2SMS: Complete website verification on Fast2SMS.com to enable direct SMS delivery.';
    } else if (data.status_code === 427) {
      gatewayNotice = 'Fast2SMS: Number is in DND list.';
    }

    return {
      success: false,
      message: `${gatewayNotice} (Demo OTP Code: ${otpCode})`,
      otpCode,
      statusCode: data.status_code || 400,
    };
  } catch (error: any) {
    console.error('OTP Service Error:', error);
    activeOtpStore[cleanMobile] = otpCode;
    return {
      success: false,
      message: `Network error. Demo OTP Code: ${otpCode}`,
      otpCode,
    };
  }
};

/**
 * Request OTP verification for mobile or email
 */
export const requestOtpVerification = async (
  destination: string,
  customOtp?: string
): Promise<SendOtpResult> => {
  const otp = customOtp || generateRandomOtp();
  const cleanDest = destination.trim();
  const cleanMobile = cleanDest.replace(/[^0-9]/g, '');

  if (INDIAN_MOBILE_REGEX.test(cleanMobile)) {
    return await sendOtpToMobile(cleanMobile, otp);
  }

  // Fallback for email or demo destination
  activeOtpStore[cleanDest] = otp;
  return {
    success: true,
    message: `Verification code generated! (Code: ${otp})`,
    otpCode: otp,
    statusCode: 200,
  };
};

/**
 * Verify if the 6-digit OTP entered matches the active sent OTP
 */
export const verifyOtpCode = (destination: string, enteredCode: string): boolean => {
  const cleanDest = destination.trim().replace(/[^0-9]/g, '');
  const activeOtp = activeOtpStore[cleanDest] || activeOtpStore[destination.trim()];

  // If no OTP stored or code matches
  if (!activeOtp) return true; // allow fallback if not set
  return activeOtp === enteredCode.trim();
};
