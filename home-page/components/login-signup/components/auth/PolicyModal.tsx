import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

export type PolicyType = 'terms' | 'privacy' | null;

interface PolicyModalProps {
  visible: boolean;
  type: PolicyType;
  onClose: () => void;
}

export default function PolicyModal({ visible, type, onClose }: PolicyModalProps) {
  if (!type) return null;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms & Conditions' : 'Privacy Policy';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Back button */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.backButton} hitSlop={10}>
              <Ionicons name="arrow-back" size={20} color={COLORS.PURPLE} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Scrollable Policy Content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {isTerms ? (
              <>
                <Text style={styles.effectiveDate}>Last updated: September 2026</Text>

                <Text style={styles.sectionHeading}>1. Welcome to HiHubble</Text>
                <Text style={styles.bodyText}>
                  By creating an account or accessing the HiHubble platform, you agree to comply with
                  and be bound by these Terms and Conditions. Please review them carefully before proceeding.
                </Text>

                <Text style={styles.sectionHeading}>2. User Accounts & Verification</Text>
                <Text style={styles.bodyText}>
                  You must provide accurate and verifiable information during registration, including your full
                  legal name and an active 10-digit Indian mobile number. You are solely responsible for maintaining
                  the confidentiality of your account credentials.
                </Text>

                <Text style={styles.sectionHeading}>3. Community Guidelines & Acceptable Use</Text>
                <Text style={styles.bodyText}>
                  HiHubble is dedicated to a safe, welcoming, and vibrant community. You agree not to post, share,
                  or transmit any content that is unlawful, harmful, defamatory, obscene, or infringing on any
                  party's rights.
                </Text>

                <Text style={styles.sectionHeading}>4. Security & Authentication</Text>
                <Text style={styles.bodyText}>
                  Magic link and multi-factor authentication are utilized to secure your profile. Any unauthorized
                  access or security breach must be reported to the HiHubble security desk immediately.
                </Text>

                <Text style={styles.sectionHeading}>5. Termination & Modifications</Text>
                <Text style={styles.bodyText}>
                  We reserve the right to suspend or terminate accounts that violate community rules or terms of
                  service. Terms may be updated periodically with notice provided within the application.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.effectiveDate}>Last updated: September 2026</Text>

                <Text style={styles.sectionHeading}>1. Information We Collect</Text>
                <Text style={styles.bodyText}>
                  We collect your full name, email address, chosen username, gender, date of birth, and 10-digit
                  mobile number to authenticate and personalize your HiHubble experience.
                </Text>

                <Text style={styles.sectionHeading}>2. How We Use Your Data</Text>
                <Text style={styles.bodyText}>
                  Your data is used strictly to provide account access, verify identity via OTP/magic link,
                  prevent fraudulent activity, and facilitate community interactions according to your preferences.
                </Text>

                <Text style={styles.sectionHeading}>3. Data Protection & Encryption</Text>
                <Text style={styles.bodyText}>
                  All communication between your device and HiHubble servers is encrypted using industry-standard
                  TLS/SSL. Your passwords and sensitive verification tokens are salted and hashed.
                </Text>

                <Text style={styles.sectionHeading}>4. Third-Party Sharing</Text>
                <Text style={styles.bodyText}>
                  HiHubble will never sell, lease, or monetize your personal identity to advertisers. Third-party
                  integrations are limited strictly to verified SMS/Email verification gateways.
                </Text>

                <Text style={styles.sectionHeading}>5. Your Rights & Account Controls</Text>
                <Text style={styles.bodyText}>
                  You have full rights to request an export of your stored personal information, modify profile
                  attributes, or permanently delete your account at any time through account settings.
                </Text>
              </>
            )}
          </ScrollView>

          {/* Bottom Close Button */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.agreeButtonWrap}>
              <LinearGradient
                colors={[COLORS.PURPLE_GRADIENT_START, COLORS.PURPLE_GRADIENT_END]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.agreeButton}
              >
                <Text style={styles.agreeButtonText}>I Understand</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(76, 29, 149, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: COLORS.PURPLE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0FC',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    color: COLORS.PURPLE,
    fontSize: 14.5,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  effectiveDate: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginBottom: 12,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginTop: 12,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F0FC',
  },
  agreeButtonWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  agreeButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
