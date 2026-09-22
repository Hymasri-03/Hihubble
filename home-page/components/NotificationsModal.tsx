import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface NotificationItem {
  id: string;
  username: string;
  actionText: string;
  timeAgo: string;
  avatar: string;
  isUnread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    username: '@ujwala',
    actionText: 'accepted your Hubbies request.',
    timeAgo: '11d ago',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isUnread: true,
  },
  {
    id: 'n2',
    username: '@sudharshan',
    actionText: 'accepted your Hubbies request.',
    timeAgo: '11d ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isUnread: true,
  },
  {
    id: 'n3',
    username: '@qwerty',
    actionText: 'accepted your Hubbies request.',
    timeAgo: '12d ago',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isUnread: false,
  },
  {
    id: 'n4',
    username: '@beulah',
    actionText: 'accepted your Hubbies request.',
    timeAgo: '12d ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isUnread: false,
  },
  {
    id: 'n5',
    username: '@lakshmi',
    actionText: 'accepted your Hubbies request.',
    timeAgo: '12d ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isUnread: false,
  },
  {
    id: 'n6',
    username: '@hema',
    actionText: 'accepted your Hubbies request.',
    timeAgo: '12d ago',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isUnread: false,
  },
];

interface NotificationsModalProps {
  isDark?: boolean;
  onClose: () => void;
  onMarkAllRead?: () => void;
}

export default function NotificationsModal({
  isDark,
  onClose,
  onMarkAllRead,
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isUnread: false }))
    );
    onMarkAllRead?.();
  };

  const handleItemPress = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnread: false } : item))
    );
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, isDark && styles.safeAreaDark]}>
        {/* Top Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          {/* Notifications title in pure white / light color in dark mode */}
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Notifications
          </Text>

          {/* Right Header Actions: Mark all read + Close 'x' */}
          <View style={styles.rightHeaderActions}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead}>
              <Text style={[styles.markAllRead, isDark && styles.markAllReadDark]}>
                Mark all read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close notifications"
            >
              <Feather name="x" size={20} color={isDark ? '#FFFFFF' : '#55477B'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((item) => {
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleItemPress(item.id)}
                style={[
                  styles.notificationRow,
                  item.isUnread && (isDark ? styles.unreadCardDark : styles.unreadCard),
                ]}
              >
                {/* Avatar with cyan unread dot indicator */}
                <View style={styles.avatarWrap}>
                  {item.isUnread && <View style={styles.cyanDot} />}
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                </View>

                {/* Text description with white/light username in dark mode */}
                <View style={styles.textContainer}>
                  <Text style={[styles.messageText, isDark && styles.textLight]}>
                    <Text style={[styles.boldUsername, isDark && styles.boldUsernameDark]}>
                      {item.username}{' '}
                    </Text>
                    {item.actionText}
                  </Text>
                  <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
                    {item.timeAgo}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  safeAreaDark: {
    backgroundColor: '#120A24',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101, 53, 234, 0.08)',
  },
  headerDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6535EA', // HiHubble logo color in light mode
    letterSpacing: -0.3,
  },
  titleDark: {
    color: '#FFFFFF', // Bright white in dark mode for crisp visibility
  },
  rightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6535EA',
  },
  markAllReadDark: {
    color: '#A98AFF', // Light purple matching the theme
  },
  closeBtn: {
    padding: 4,
  },

  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },

  // Base notification row
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },

  // Unread card: highlighted background with purple left accent border
  unreadCard: {
    backgroundColor: '#F5F1FD',
    borderLeftWidth: 3.5,
    borderLeftColor: '#6535EA',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  unreadCardDark: {
    backgroundColor: 'rgba(60, 36, 115, 0.65)',
    borderLeftWidth: 3.5,
    borderLeftColor: '#A98AFF',
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },

  // Avatar + Cyan dot
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cyanDot: {
    position: 'absolute',
    left: -8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00D4FF',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // Text
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#281B5E',
    lineHeight: 19,
  },
  boldUsername: {
    fontWeight: '800',
    color: '#150B38',
  },
  boldUsernameDark: {
    color: '#FFFFFF', // Bright white username in dark mode
  },
  textLight: {
    color: '#EDE7FF',
  },
  timeText: {
    fontSize: 12,
    color: '#8A7BAE',
    marginTop: 4,
  },
  timeTextDark: {
    color: '#BDB1DE',
  },
});
