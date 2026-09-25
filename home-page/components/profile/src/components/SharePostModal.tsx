import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { HubPost, ThemeMode, UserProfile } from '../types/profile';

export interface SharePostModalProps {
  visible: boolean;
  post: HubPost | null;
  user?: UserProfile;
  themeMode: ThemeMode;
  onClose: () => void;
  onRepost?: (post: HubPost) => void;
}

const SAMPLE_CONTACTS = [
  {
    id: 'c_alex',
    name: 'Alex Rivers',
    handle: '@alexrivers',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'c_sneha',
    name: 'Sneha Patel',
    handle: '@sneha_cosmos',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'c_jamie',
    name: 'Jamie Sun',
    handle: '@jamiesun',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'c_elena',
    name: 'Elena Rostova',
    handle: '@elena_orbit',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  },
];

export const SharePostModal: React.FC<SharePostModalProps> = ({
  visible,
  post,
  user,
  themeMode,
  onClose,
  onRepost,
}) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  if (!post) return null;

  // Generate or use post ID
  const displayPostId = post.shareId || post.id.replace(/^(hub_|clip_)/, 'HUB-').toUpperCase();
  const shareLink = `https://hi-hubble.app/p/${displayPostId}`;

  const handleCopyId = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayPostId);
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2400);
  };

  const handleCopyLink = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2400);
  };

  const handleSendToUser = (contactId: string, name: string) => {
    setSentMap((prev) => ({ ...prev, [contactId]: true }));
    Alert.alert('Sent', `Post ${displayPostId} shared directly with ${name}`);
  };

  const authorName = user?.name || (post as any)?.authorName || 'Hymasri';
  const authorHandle = user?.handle || (post as any)?.authorHandle || '@hymasri';

  const handleExternalShare = async () => {
    try {
      await Share.share({
        title: `Hi-Hubble Post by ${authorName}`,
        message: `Check out this cosmic post on Hi-Hubble! [ID: ${displayPostId}]\n${post.caption || ''}\n${shareLink}`,
        url: shareLink,
      });
    } catch (e) {
      console.log('Error sharing post:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            },
          ]}
          data-modal-card="true"
        >
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
                <Ionicons name="paper-plane" size={17} color={BRAND_COLORS.purplePrimary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Share Post</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Share through ID, Direct Message, or External Apps
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. POST PREVIEW CARD */}
            <View style={[styles.postPreviewRow, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
              {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={styles.postThumbnail} resizeMode="cover" />
              ) : (
                <View style={[styles.postThumbnail, { backgroundColor: BRAND_COLORS.purplePrimary, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="images" size={20} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.postPreviewMeta}>
                <View style={styles.authorBadgeRow}>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>{authorName}</Text>
                  <Text style={[styles.authorHandle, { color: colors.textMuted }]}>{authorHandle}</Text>
                </View>
                <Text style={[styles.postPreviewCaption, { color: colors.textSecondary }]} numberOfLines={2}>
                  {post.caption || 'Cosmic moment shared on Hi-Hubble'}
                </Text>
                <View style={styles.typeBadgeRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {post.mediaType === 'video' ? 'VIDEO POST' : 'PHOTO POST'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 2. SHARE THROUGH ID CARD */}
            <View style={[styles.idShareBox, { backgroundColor: colors.statCardBg, borderColor: BRAND_COLORS.purplePrimary }]}>
              <View style={styles.idShareHeader}>
                <View style={styles.idLabelGroup}>
                  <Ionicons name="key-outline" size={15} color={BRAND_COLORS.purplePrimary} />
                  <Text style={[styles.idShareLabel, { color: colors.textPrimary }]}>Share Through Post ID</Text>
                </View>
                <View style={styles.uniqueIdPill}>
                  <Text style={styles.uniqueIdPillText}>ID: {displayPostId}</Text>
                </View>
              </View>

              <Text style={[styles.idShareHelpText, { color: colors.textMuted }]}>
                Anyone can view or search this post directly using this unique Post ID.
              </Text>

              <View style={styles.idButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCopyId}
                  style={[
                    styles.copyBtn,
                    {
                      backgroundColor: copiedId ? '#10B981' : BRAND_COLORS.purplePrimary,
                      borderColor: copiedId ? '#10B981' : BRAND_COLORS.purplePrimary,
                    },
                  ]}
                >
                  <Feather name={copiedId ? 'check' : 'copy'} size={14} color="#FFFFFF" />
                  <Text style={styles.copyBtnText}>{copiedId ? 'ID Copied!' : 'Copy Post ID'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCopyLink}
                  style={[
                    styles.copyBtnOutline,
                    {
                      borderColor: copiedLink ? '#10B981' : colors.border,
                      backgroundColor: colors.cardBg,
                    },
                  ]}
                >
                  <Feather
                    name={copiedLink ? 'check' : 'link'}
                    size={14}
                    color={copiedLink ? '#10B981' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.copyBtnOutlineText,
                      { color: copiedLink ? '#10B981' : colors.textPrimary },
                    ]}
                  >
                    {copiedLink ? 'Link Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. SEND TO HUBBERS & HUBBIES */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Send via Direct Message</Text>

              <View style={styles.contactsList}>
                {SAMPLE_CONTACTS.map((contact) => {
                  const isSent = sentMap[contact.id];
                  return (
                    <View
                      key={contact.id}
                      style={[
                        styles.contactItemRow,
                        { borderColor: colors.border, backgroundColor: colors.statCardBg },
                      ]}
                    >
                      <Image source={{ uri: contact.avatar }} style={styles.contactAvatar} />
                      <View style={styles.contactMeta}>
                        <Text style={[styles.contactName, { color: colors.textPrimary }]}>
                          {contact.name}
                        </Text>
                        <Text style={[styles.contactHandle, { color: colors.textMuted }]}>
                          {contact.handle}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleSendToUser(contact.id, contact.name)}
                        disabled={isSent}
                        style={[
                          styles.sendContactBtn,
                          {
                            backgroundColor: isSent ? '#10B981' : BRAND_COLORS.purplePrimary,
                          },
                        ]}
                      >
                        <Feather
                          name={isSent ? 'check' : 'send'}
                          size={12}
                          color="#FFFFFF"
                        />
                        <Text style={styles.sendContactBtnText}>{isSent ? 'Sent' : 'Send'}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 5. EXTERNAL APPS SHARE */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExternalShare}
              style={[
                styles.externalShareRow,
                { borderColor: colors.border, backgroundColor: colors.statCardBg },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.extIconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
                  <Ionicons name="share-social" size={17} color={BRAND_COLORS.purplePrimary} />
                </View>
                <Text style={[styles.externalShareText, { color: colors.textPrimary }]}>
                  Share to External Apps (WhatsApp, Instagram, etc.)
                </Text>
              </View>
              <Ionicons name="open-outline" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '90%',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    maxHeight: 620,
  },
  postPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  postThumbnail: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  postPreviewMeta: {
    flex: 1,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  authorHandle: {
    fontSize: 11,
  },
  postPreviewCaption: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  typeBadgeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 9.5,
    fontWeight: '800',
  },
  idShareBox: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  idShareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  idLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idShareLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  uniqueIdPill: {
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  uniqueIdPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  idShareHelpText: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  idButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  copyBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  copyBtnOutlineText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  contactsList: {
    gap: 8,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  contactMeta: {
    flex: 1,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '700',
  },
  contactHandle: {
    fontSize: 11,
  },
  sendContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sendContactBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  externalShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  extIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalShareText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});

export default SharePostModal;
