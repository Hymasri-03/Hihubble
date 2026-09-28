import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { UserProfile, ThemeMode } from '../types/profile';
import CropAvatarModal from './CropAvatarModal';

export interface EditProfileModalProps {
  visible: boolean;
  themeMode: ThemeMode;
  user: UserProfile;
  onClose: () => void;
  onSave: (updatedUser: Partial<UserProfile>) => void;
}

export const EditProfileModal = ({
  visible,
  themeMode,
  user,
  onClose,
  onSave,
}: EditProfileModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [roleBadge, setRoleBadge] = useState(user.roleBadge || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [preferredOtpMethod, setPreferredOtpMethod] = useState<'SMS' | 'WhatsApp' | 'Email'>(
    user.preferredOtpMethod || 'SMS'
  );
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [coverUrl, setCoverUrl] = useState(user.coverUrl);

  // Profile Adjust modal state
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [candidateProfileUri, setCandidateProfileUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(user.name);
      setHandle(user.handle);
      setBio(user.bio);
      setRoleBadge(user.roleBadge || '');
      setPhoneNumber(user.phoneNumber || '');
      setPreferredOtpMethod(user.preferredOtpMethod || 'SMS');
      setAvatarUrl(user.avatarUrl);
      setCoverUrl(user.coverUrl);
    }
  }, [visible, user]);

  // Upload Profile picture -> Launch on-screen adjust screen (zoom/drag)
  const handleUploadProfile = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access to upload profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Let user adjust in dedicated modal with drag and zoom
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCandidateProfileUri(result.assets[0].uri);
        setAdjustModalVisible(true);
      }
    } catch (e) {
      console.log('Error picking profile image:', e);
      Alert.alert('Error', 'Unable to pick image.');
    }
  };

  const handleAdjustProfileDone = (finalUri: string) => {
    setAvatarUrl(finalUri);
    setAdjustModalVisible(false);
    setCandidateProfileUri(null);
  };

  // Upload Cover/Banner Image directly from phone gallery
  const handleUploadCover = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access to upload cover image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Direct upload without forcing system Crop tool
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setCoverUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error uploading cover:', e);
      Alert.alert('Error', 'Unable to upload image.');
    }
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || user.name,
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      bio: bio.trim(),
      roleBadge: roleBadge.trim() || user.roleBadge,
      phoneNumber: phoneNumber.trim(),
      preferredOtpMethod,
      avatarUrl,
      coverUrl,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
        data-modal-overlay="true"
      >
        <View
          style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          data-modal-card="true"
        >
          {/* Logo Design Gradient Accent Bar */}
          <LinearGradient
            colors={['#6535EA', '#8B5CF6', '#FF3B8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoAccentBar}
          />

          {/* Popup Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <Feather name="edit-3" size={20} color={BRAND_COLORS.purplePrimary} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 1. MEDIA UPLOAD SECTION: Cover & Profile Pictures */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Profile Media
            </Text>

            {/* Banner/Cover Image Upload Card */}
            <View style={[styles.mediaCard, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
              <View style={styles.mediaRow}>
                <View style={styles.coverThumbnailWrapper}>
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.coverThumbnail} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={BRAND_COLORS.bannerGradient}
                      style={styles.coverThumbnail}
                    />
                  )}
                </View>
                <View style={styles.mediaInfoCol}>
                  <Text style={[styles.mediaTitle, { color: colors.textPrimary }]}>Cover Banner</Text>
                  <Text style={[styles.mediaSubtitle, { color: colors.textMuted }]}>
                    Header background image
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleUploadCover}
                  style={styles.uploadMiniBtn}
                >
                  <Feather name="upload" size={13} color="#FFFFFF" />
                  <Text style={styles.uploadMiniBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Image Upload Card */}
            <View style={[styles.mediaCard, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
              <View style={styles.mediaRow}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarThumbnail} resizeMode="cover" />
                <View style={styles.mediaInfoCol}>
                  <Text style={[styles.mediaTitle, { color: colors.textPrimary }]}>Profile</Text>
                  <Text style={[styles.mediaSubtitle, { color: colors.textMuted }]}>
                    Your public circular profile photo
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleUploadProfile}
                  style={styles.uploadMiniBtn}
                >
                  <Feather name="upload" size={13} color="#FFFFFF" />
                  <Text style={styles.uploadMiniBtnText}>Upload Profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. TEXT FIELDS */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: 16 }]}>
              Personal Information
            </Text>

            {/* Display Name */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.statCardBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor={colors.textMuted}
            />

            {/* Username / Handle */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Handle (@username)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.statCardBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={handle}
              onChangeText={setHandle}
              placeholder="@username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            {/* Role Badge / Status */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Status / Role Badge</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.statCardBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={roleBadge}
              onChangeText={setRoleBadge}
              placeholder="e.g. Hubber on Hi-Hubble"
              placeholderTextColor={colors.textMuted}
            />

            {/* Bio Description */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bio</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: colors.statCardBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell your hubbers about yourself..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Phone Number */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.statCardBg,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            {/* Preferred OTP Method */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Preferred OTP Method</Text>
            <View style={styles.otpMethodsRow}>
              {(['SMS', 'WhatsApp', 'Email'] as const).map((method) => {
                const isSelected = preferredOtpMethod === method;
                return (
                  <TouchableOpacity
                    key={method}
                    activeOpacity={0.7}
                    onPress={() => setPreferredOtpMethod(method)}
                    style={[
                      styles.otpPill,
                      {
                        backgroundColor: isSelected
                          ? BRAND_COLORS.purplePrimary
                          : colors.statCardBg,
                        borderColor: isSelected
                          ? BRAND_COLORS.purplePrimary
                          : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        method === 'SMS'
                          ? 'chatbubble-ellipses-outline'
                          : method === 'WhatsApp'
                          ? 'logo-whatsapp'
                          : 'mail-outline'
                      }
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.otpPillText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Button */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleSave} style={styles.saveBtnWrapper}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                <Feather name="check" size={17} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {candidateProfileUri ? (
        <CropAvatarModal
          visible={adjustModalVisible}
          imageUri={candidateProfileUri}
          themeMode={themeMode}
          onClose={() => setAdjustModalVisible(false)}
          onCropDone={handleAdjustProfileDone}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 26,
    borderWidth: 1,
    paddingBottom: 24,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  logoAccentBar: {
    width: '100%',
    height: 4,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  mediaCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverThumbnailWrapper: {
    width: 60,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverThumbnail: {
    width: '100%',
    height: '100%',
  },
  avatarThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  mediaInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  mediaTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  mediaSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  uploadMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 5,
  },
  uploadMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6.5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  cropMiniBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 76,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  otpMethodsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  otpPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  otpPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  saveBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 14,
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default EditProfileModal;
