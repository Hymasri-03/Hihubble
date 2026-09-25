import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PostData } from './PostCard';
import { ChatItem } from './ChatsView';
import { MOODS } from './MoodPills';

interface SharePostModalProps {
  visible: boolean;
  post: PostData | null;
  isDark?: boolean;
  selectedMood?: string;
  conversations?: ChatItem[];
  onClose: () => void;
  onAddToStory?: (post: PostData) => void;
  onShareToChat?: (contactId: string, post: PostData) => void;
}

const DEFAULT_SHARE_CONTACTS = [
  { id: 'u1', name: 'Alex Rivers', handle: '@alex_rivers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'u2', name: 'Sarah Connor', handle: '@sarah_c', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'u3', name: 'David Kim', handle: '@david_kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'u4', name: 'Elena Rostova', handle: '@elena_r', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'u5', name: 'Marcus Chen', handle: '@marcus_c', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
];

export default function SharePostModal({
  visible,
  post,
  isDark = false,
  selectedMood = 'trending',
  conversations = [],
  onClose,
  onAddToStory,
  onShareToChat,
}: SharePostModalProps) {
  const [sentContacts, setSentContacts] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Resolve active mood metadata
  const activeMood = useMemo(
    () => MOODS.find((m) => m.id === selectedMood) ?? MOODS[0],
    [selectedMood]
  );
  const moodColor = activeMood.color;

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      toastAnim.setValue(0);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setToastMessage(null));
    },
    [toastAnim]
  );

  const handleSendToContact = (contact: { id: string; name: string }) => {
    if (!post) return;
    setSentContacts((prev) => ({ ...prev, [contact.id]: true }));
    onShareToChat?.(contact.id, post);
    showToast(`Shared post with ${contact.name}! 🚀`);
  };

  const contacts = conversations.length > 0 ? conversations : DEFAULT_SHARE_CONTACTS;

  return (
    <Modal
      visible={visible && post !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.shareSheet,
            !isDark && { backgroundColor: '#F0EEFF', borderColor: 'rgba(100,60,220,0.15)' },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Toast Notification */}
          {toastMessage && (
            <Animated.View
              style={[
                styles.toastContainer,
                {
                  opacity: toastAnim,
                  transform: [
                    {
                      translateY: toastAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}

          {/* Sheet Handle */}
          <View style={styles.sheetHandleWrap}>
            <View
              style={[
                styles.sheetHandle,
                !isDark && { backgroundColor: 'rgba(100,60,220,0.25)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: moodColor + '55' }]}>
            <View style={styles.sheetTitleRow}>
              <Text style={[styles.sheetTitle, !isDark && { color: '#1A0A3C' }]}>
                Share Hub
              </Text>
              <View
                style={[
                  styles.moodBadge,
                  {
                    backgroundColor: moodColor + '22',
                    borderColor: moodColor + '55',
                  },
                ]}
              >
                <Text style={[styles.moodBadgeText, { color: moodColor }]}>
                  {activeMood.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.sheetCloseBtn,
                !isDark && { backgroundColor: 'rgba(100,60,220,0.12)' },
              ]}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? '#FFFFFF' : '#4C2CE6'}
              />
            </TouchableOpacity>
          </View>

          {/* Direct Contacts to Send to */}
          <Text style={[styles.shareSectionSubtitle, !isDark && { color: moodColor }]}>
            Send to Friends
          </Text>
          <View style={styles.contactsList}>
            {contacts.slice(0, 5).map((contact) => {
              const isSent = !!sentContacts[contact.id];
              return (
                <View key={contact.id} style={styles.shareContactRow}>
                  <Image
                    source={{
                      uri:
                        contact.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    }}
                    style={styles.shareAvatar}
                  />
                  <View style={styles.shareContactInfo}>
                    <Text
                      style={[
                        styles.shareContactName,
                        !isDark && { color: '#1A0A3C' },
                      ]}
                    >
                      {contact.name}
                    </Text>
                    <Text style={styles.shareContactSub}>
                      {contact.id.startsWith('u')
                        ? '@' + contact.name.toLowerCase().replace(' ', '_')
                        : 'Online'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.sendShareBtn,
                      isSent && styles.sendShareBtnSent,
                      !isDark && !isSent && { backgroundColor: moodColor },
                    ]}
                    onPress={() => handleSendToContact(contact)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.sendShareBtnText,
                        isSent && styles.sendShareBtnTextSent,
                      ]}
                    >
                      {isSent ? 'Sent ✓' : 'Send'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Quick Actions (Copy Link, Add to Story, Save) */}
          <View
            style={[
              styles.quickActionRow,
              !isDark && { borderTopColor: 'rgba(100,60,220,0.12)' },
            ]}
          >
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                showToast('Post link copied to clipboard! 📋');
                setTimeout(() => onClose(), 600);
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  !isDark && { backgroundColor: moodColor + '22' },
                ]}
              >
                <Feather
                  name="link-2"
                  size={20}
                  color={isDark ? '#FFFFFF' : moodColor}
                />
              </View>
              <Text
                style={[
                  styles.quickActionText,
                  !isDark && { color: '#2C1B58' },
                ]}
              >
                Copy Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                if (post) {
                  onAddToStory?.(post);
                }
                onClose();
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  !isDark && { backgroundColor: moodColor + '22' },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={isDark ? '#FFFFFF' : moodColor}
                />
              </View>
              <Text
                style={[
                  styles.quickActionText,
                  !isDark && { color: '#2C1B58' },
                ]}
              >
                Add to Story
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                showToast('Post saved to camera roll! 📥');
                setTimeout(() => onClose(), 600);
              }}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  !isDark && { backgroundColor: moodColor + '22' },
                ]}
              >
                <Feather
                  name="download"
                  size={20}
                  color={isDark ? '#FFFFFF' : moodColor}
                />
              </View>
              <Text
                style={[
                  styles.quickActionText,
                  !isDark && { color: '#2C1B58' },
                ]}
              >
                Save Post
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: '#161129',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
  },
  toastContainer: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    backgroundColor: 'rgba(26, 17, 50, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  moodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareSectionSubtitle: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contactsList: {
    gap: 12,
    marginBottom: 18,
  },
  shareContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  shareAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  shareContactInfo: {
    flex: 1,
  },
  shareContactName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  shareContactSub: {
    color: '#8E88B0',
    fontSize: 12,
    marginTop: 1,
  },
  sendShareBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  sendShareBtnSent: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  sendShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sendShareBtnTextSent: {
    color: '#4ADE80',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    color: '#D8CCFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
