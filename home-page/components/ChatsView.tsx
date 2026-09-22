import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface ChatsViewProps {
  isDark?: boolean;
}

const ACTIVE_CONTACTS = [
  { id: '1', name: 'Alex Rivers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', online: true },
  { id: '2', name: 'Jamie Sun', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', online: true },
  { id: '3', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', online: false },
  { id: '4', name: 'Marcus', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', online: true },
];

const CHATS = [
  {
    id: 'c1',
    name: 'Alex Rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'The photos from the offsite look awesome! 🔥',
    time: '10:45 AM',
    unread: 2,
    online: true,
  },
  {
    id: 'c2',
    name: 'Jamie Sun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'See you in the live coding stream later today 🚀',
    time: '9:30 AM',
    unread: 0,
    online: true,
  },
  {
    id: 'c3',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Let’s sync on the new design specs tomorrow.',
    time: 'Yesterday',
    unread: 0,
    online: false,
  },
  {
    id: 'c4',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Shared a new Hubbing reel with you!',
    time: 'Yesterday',
    unread: 1,
    online: true,
  },
  {
    id: 'c5',
    name: 'Hubble Community',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Welcome to HiHubble! Share your mood with the world.',
    time: '2d ago',
    unread: 0,
    online: false,
  },
];

export default function ChatsView({ isDark }: ChatsViewProps) {
  const [search, setSearch] = useState('');

  const filteredChats = CHATS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Chats</Text>
        <TouchableOpacity style={[styles.actionBtn, isDark && styles.actionBtnDark]}>
          <Feather name="edit" size={18} color={isDark ? '#C4B8FF' : '#6535EA'} />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
        <Feather name="search" size={18} color={isDark ? '#9A8CB9' : '#8E82AF'} />
        <TextInput
          placeholder="Search conversations..."
          placeholderTextColor={isDark ? '#8274A5' : '#9E92BD'}
          value={search}
          onChangeText={setSearch}
          style={[styles.input, isDark && styles.inputDark]}
        />
      </View>

      {/* Active Contacts */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Active Now</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeRow}>
        {ACTIVE_CONTACTS.map((contact) => (
          <TouchableOpacity key={contact.id} style={styles.activeContact} activeOpacity={0.75}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: contact.avatar }} style={styles.activeAvatar} />
              {contact.online && <View style={styles.onlineDot} />}
            </View>
            <Text style={[styles.activeName, isDark && styles.activeNameDark]} numberOfLines={1}>
              {contact.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Conversations List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Recent Messages</Text>
      </View>
      <View style={styles.chatList}>
        {filteredChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[styles.chatCard, isDark && styles.chatCardDark]}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrap}>
              <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
              {chat.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatTopRow}>
                <Text style={[styles.chatName, isDark && styles.chatNameDark]}>{chat.name}</Text>
                <Text style={[styles.chatTime, isDark && styles.chatTimeDark]}>{chat.time}</Text>
              </View>
              <View style={styles.chatBottomRow}>
                <Text
                  style={[styles.chatMessage, isDark && styles.chatMessageDark]}
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom padding for movable mascot */}
      <View style={{ height: 160 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#211054',
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#EDE7FF',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E1F7',
  },
  actionBtnDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(230, 220, 255, 0.8)',
  },
  searchBoxDark: {
    backgroundColor: 'rgba(38, 25, 75, 0.75)',
    borderColor: 'rgba(100, 75, 160, 0.3)',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#211054',
  },
  inputDark: {
    color: '#EDE7FF',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6535EA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTitleDark: {
    color: '#A98AFF',
  },
  activeRow: {
    marginBottom: 18,
  },
  activeContact: {
    alignItems: 'center',
    marginRight: 14,
    width: 58,
  },
  avatarWrap: {
    position: 'relative',
  },
  activeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16, // squircle matching story shape
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeName: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '600',
    color: '#342363',
  },
  activeNameDark: {
    color: '#D8CCFF',
  },
  chatList: {
    gap: 10,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  chatCardDark: {
    backgroundColor: 'rgba(32, 20, 62, 0.75)',
    borderColor: 'rgba(90, 60, 150, 0.25)',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1245',
  },
  chatNameDark: {
    color: '#EDE7FF',
  },
  chatTime: {
    fontSize: 11,
    color: '#8A7BAE',
  },
  chatTimeDark: {
    color: '#A798CE',
  },
  chatBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 13,
    color: '#55477B',
    flex: 1,
    marginRight: 8,
  },
  chatMessageDark: {
    color: '#BDB1DE',
  },
  unreadBadge: {
    backgroundColor: '#6535EA',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
