import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

export type NotificationCategory = 'all' | 'layers' | 'messages' | 'unread';

export interface NotificationItem {
  id: string;
  category: 'layers' | 'messages' | 'system';
  type: 'like' | 'follow' | 'comment' | 'message' | 'save' | 'system' | 'tag';
  title: string;
  senderName: string;
  senderHandle?: string;
  description: string;
  time: string;
  avatar?: string;
  postThumbnail?: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n_1',
    category: 'layers',
    type: 'like',
    senderName: 'Sarah Chen',
    senderHandle: '@sarahchen',
    title: 'liked your hub post',
    description: '"Stargazing into the cosmos" in Your Hubs',
    time: '5m ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    postThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=200&auto=format&fit=crop',
    isRead: false,
  },
  {
    id: 'n_2',
    category: 'messages',
    type: 'message',
    senderName: 'Alex Rivers',
    senderHandle: '@alexrivers',
    title: 'sent you a message',
    description: 'Hey Hymasri! Loved your latest cosmic clip. Are you planning a new stargazing live stream?',
    time: '15m ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    isRead: false,
  },
  {
    id: 'n_3',
    category: 'messages',
    type: 'comment',
    senderName: 'Marcus Vance',
    senderHandle: '@marcusvance',
    title: 'commented on your Hubclip',
    description: '"Incredible framing and vibrant purple aesthetic! Keep posting."',
    time: '1h ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    postThumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=200&auto=format&fit=crop',
    isRead: false,
  },
  {
    id: 'n_4',
    category: 'layers',
    type: 'save',
    senderName: 'Elena Rostova',
    senderHandle: '@elenarostova',
    title: 'saved your clip to Saved Hubs',
    description: 'Saved your cosmic video reel into their collection',
    time: '3h ago',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    postThumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=200&auto=format&fit=crop',
    isRead: true,
  },
  {
    id: 'n_5',
    category: 'layers',
    type: 'tag',
    senderName: 'Diya Sen',
    senderHandle: '@diyasen',
    title: 'tagged you in a hub',
    description: 'Tagged you in "Pastel nebula skies"',
    time: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    postThumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop',
    isRead: true,
  },
  {
    id: 'n_6',
    category: 'system',
    type: 'system',
    senderName: 'Hi-Hubble Official',
    title: 'System Feature Update',
    description: 'Interactive Profile Adjust & multi-photo Hub features are now active in your space!',
    time: '2d ago',
    isRead: true,
  },
];

export interface NotificationsModalProps {
  visible: boolean;
  themeMode: ThemeMode;
  onClose: () => void;
  onClearBadge?: () => void;
}

export const NotificationsModal = ({
  visible,
  themeMode,
  onClose,
  onClearBadge,
}: NotificationsModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotificationCategory>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onClearBadge?.();
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const handleClearAll = () => {
    setNotifications([]);
    onClearBadge?.();
  };

  const handlePressItem = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'layers') return n.category === 'layers';
    if (filter === 'messages') return n.category === 'messages';
    return true;
  });

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={13} color="#EF4444" />;
      case 'follow':
        return <Ionicons name="person-add" size={13} color={BRAND_COLORS.purplePrimary} />;
      case 'comment':
      case 'message':
        return <Ionicons name="chatbubble-ellipses" size={13} color="#3B82F6" />;
      case 'save':
        return <Ionicons name="bookmark" size={13} color="#F59E0B" />;
      case 'tag':
        return <Ionicons name="pricetag" size={13} color="#10B981" />;
      case 'system':
      default:
        return <Ionicons name="sparkles" size={13} color="#8B5CF6" />;
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
          {/* Top Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header Bar */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.bellCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="notifications" size={18} color={BRAND_COLORS.purplePrimary} />
              </View>
              <View>
                <View style={styles.modalTitleRow}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    Notifications
                  </Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>{unreadCount} new</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Updates, Layers & Messages
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Category Filter Tabs: All, Layers, Messages, Unread */}
          <View style={[styles.toolbarRow, { borderBottomColor: colors.border }]}>
            <View style={styles.filterGroup}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setFilter('all')}
                style={[
                  styles.filterChip,
                  filter === 'all'
                    ? { backgroundColor: BRAND_COLORS.purplePrimary }
                    : { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filter === 'all' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>

              {/* Layers Tab (Likes & Activity) */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setFilter('layers')}
                style={[
                  styles.filterChip,
                  filter === 'layers'
                    ? { backgroundColor: BRAND_COLORS.purplePrimary }
                    : { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Ionicons
                  name="heart"
                  size={12}
                  color={filter === 'layers' ? '#FFFFFF' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filter === 'layers' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Layers
                </Text>
              </TouchableOpacity>

              {/* Messages Tab (Direct Messages & Comments) */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setFilter('messages')}
                style={[
                  styles.filterChip,
                  filter === 'messages'
                    ? { backgroundColor: BRAND_COLORS.purplePrimary }
                    : { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Ionicons
                  name="chatbubbles"
                  size={12}
                  color={filter === 'messages' ? '#FFFFFF' : '#3B82F6'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filter === 'messages' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Messages
                </Text>
              </TouchableOpacity>

              {/* Unread Tab */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setFilter('unread')}
                style={[
                  styles.filterChip,
                  filter === 'unread'
                    ? { backgroundColor: BRAND_COLORS.purplePrimary }
                    : { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filter === 'unread' ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleMarkAllAsRead}
                style={styles.markReadBtn}
              >
                <Feather name="check-circle" size={13} color={BRAND_COLORS.purplePrimary} />
                <Text style={styles.markReadText}>Mark read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notification List with Dedicated Alignment for Layers vs Messages */}
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.statCardBg }]}>
                <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {filter === 'unread'
                  ? "You're completely caught up!"
                  : filter === 'layers'
                  ? 'No layers or likes activity yet.'
                  : filter === 'messages'
                  ? 'No incoming messages or comments.'
                  : 'New updates will appear here in real time.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isMessage = item.category === 'messages';
                const isLayer = item.category === 'layers';

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handlePressItem(item.id)}
                    style={[
                      styles.itemCard,
                      {
                        backgroundColor: item.isRead ? colors.cardBg : colors.statCardBg,
                        borderColor: item.isRead ? colors.border : BRAND_COLORS.purplePrimary,
                        borderWidth: item.isRead ? 1 : 1.5,
                      },
                    ]}
                  >
                    {/* Left: Avatar with Category Badge */}
                    <View style={styles.avatarWrapper}>
                      {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.systemAvatar, { backgroundColor: '#EDE9FE' }]}>
                          <Ionicons name="sparkles" size={18} color={BRAND_COLORS.purplePrimary} />
                        </View>
                      )}
                      <View style={styles.typeBadgeCircle}>{getIconForType(item.type)}</View>
                    </View>

                    {/* Middle: Aligned Content */}
                    <View style={styles.itemContent}>
                      {/* Top Baseline Row: Sender Name + Timestamp */}
                      <View style={styles.itemTopRow}>
                        <View style={styles.senderTitleRow}>
                          <Text style={[styles.senderName, { color: colors.textPrimary }]}>
                            {item.senderName}
                          </Text>
                          {item.senderHandle && (
                            <Text style={[styles.senderHandle, { color: colors.textMuted }]}>
                              {item.senderHandle}
                            </Text>
                          )}
                        </View>
                        <View style={styles.timeAndStatusRow}>
                          <Text style={[styles.itemTime, { color: colors.textMuted }]}>
                            {item.time}
                          </Text>
                          {!item.isRead && <View style={styles.unreadDot} />}
                        </View>
                      </View>

                      {/* LAYERS SECTION ALIGNMENT (Likes, Saves, Tags) */}
                      {isLayer && (
                        <View style={styles.layerRow}>
                          <View style={styles.layerTextCol}>
                            <Text style={[styles.actionTagline, { color: BRAND_COLORS.purplePrimary }]}>
                              {item.title}
                            </Text>
                            <Text
                              style={[styles.itemDesc, { color: colors.textSecondary }]}
                              numberOfLines={2}
                            >
                              {item.description}
                            </Text>
                          </View>
                          {item.postThumbnail && (
                            <Image
                              source={{ uri: item.postThumbnail }}
                              style={styles.postThumbnail}
                              resizeMode="cover"
                            />
                          )}
                        </View>
                      )}

                      {/* MESSAGES SECTION ALIGNMENT (Direct Chats, Comments) */}
                      {isMessage && (
                        <View style={styles.messageContainer}>
                          <View
                            style={[
                              styles.messageBubble,
                              {
                                backgroundColor:
                                  themeMode === 'light' ? '#F4F0FD' : '#231D3F',
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.messageText, { color: colors.textPrimary }]}>
                              {item.description}
                            </Text>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              handlePressItem(item.id);
                              Alert.alert('Reply to Message', `Open chat with ${item.senderName}?`);
                            }}
                            style={styles.replyBtn}
                          >
                            <Feather name="corner-up-left" size={11} color={BRAND_COLORS.purplePrimary} />
                            <Text style={styles.replyBtnText}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* System Alert fallback */}
                      {!isLayer && !isMessage && (
                        <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Footer Clean Toolbar */}
          {notifications.length > 0 && (
            <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity activeOpacity={0.7} onPress={handleClearAll} style={styles.clearAllBtn}>
                <Feather name="trash-2" size={13} color="#EF4444" />
                <Text style={styles.clearAllText}>Clear All Notifications</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
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
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
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
    gap: 12,
  },
  bellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  unreadCountBadge: {
    backgroundColor: BRAND_COLORS.purplePrimary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  markReadText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BRAND_COLORS.purplePrimary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  systemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadgeCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  senderName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  senderHandle: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTime: {
    fontSize: 11,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BRAND_COLORS.purplePrimary,
  },

  // Layers Section Styling
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  layerTextCol: {
    flex: 1,
  },
  actionTagline: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },

  // Messages Section Styling
  messageContainer: {
    marginTop: 2,
  },
  messageBubble: {
    padding: 9,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  replyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_COLORS.purplePrimary,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12.5,
    marginTop: 4,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});

export default NotificationsModal;
