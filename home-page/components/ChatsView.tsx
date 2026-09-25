import { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface ChatSharedStory {
  id: string;
  authorName: string;
  authorAvatar?: string;
  mediaUri: string;
  thumbnailUri?: string;
  caption?: string;
  timeAgo?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'other' | 'user';
  text: string;
  time: string;
  read?: boolean;
  sharedStory?: ChatSharedStory;
  isPinned?: boolean;
  sticker?: string;
  isEdited?: boolean;
}

export interface ChatItem {
  id: string;
  name: string;
  shortName: string;
  avatar?: string;
  isSpecialIcon?: boolean;
  status: string;
  time?: string;
  lastMessage: string;
  messages: ChatMessage[];
}

export interface ChatsViewProps {
  isDark?: boolean;
  activeChatId?: string | null;
  onSelectChat?: (chatId: string | null) => void;
  conversations?: ChatItem[];
  onUpdateConversations?: React.Dispatch<React.SetStateAction<ChatItem[]>>;
}

export const DEFAULT_CONVERSATIONS: ChatItem[] = [
  {
    id: 'c1',
    name: 'VARMA',
    shortName: 'VARMA',
    isSpecialIcon: true,
    status: 'Offline',
    lastMessage: 'Start chatting...',
    messages: [],
  },
  {
    id: 'c2',
    name: 'Musireddy Anjali',
    shortName: 'Musireddy Anj...',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'Offline',
    time: '11:00 am',
    lastMessage: 'Hii',
    messages: [
      {
        id: 'm1',
        sender: 'other',
        text: 'Hi',
        time: '10:53 am',
      },
      {
        id: 'm2',
        sender: 'user',
        text: 'Hii',
        time: '11:00 am',
        read: true,
      },
    ],
  },
  {
    id: 'c3',
    name: 'Alex Rivers',
    shortName: 'Alex Rivers',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Active now',
    time: '1h ago',
    lastMessage: 'Check out the drone shots! 🏔️✨',
    messages: [],
  },
  {
    id: 'c4',
    name: 'Jamie Sun',
    shortName: 'Jamie Sun',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'Offline',
    time: '3h ago',
    lastMessage: 'Live coding session with the team 🚀💻',
    messages: [],
  },
  {
    id: 'c5',
    name: 'Sarah Chen',
    shortName: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Offline',
    time: '5h ago',
    lastMessage: 'Weekend vibes in the city ☕🌸',
    messages: [],
  },
  {
    id: 'c6',
    name: 'Marcus',
    shortName: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'Active now',
    time: '8h ago',
    lastMessage: 'Exploring new trails today 🌲🚵',
    messages: [],
  },
];

export default function ChatsView({
  isDark,
  activeChatId,
  onSelectChat,
  conversations: externalConversations,
  onUpdateConversations,
}: ChatsViewProps) {
  const [internalChatId, setInternalChatId] = useState<string | null>(null);
  const currentChatId = activeChatId !== undefined ? activeChatId : internalChatId;
  const setChatId = (id: string | null) => {
    if (onSelectChat) onSelectChat(id);
    setInternalChatId(id);
  };

  const [internalConversations, setInternalConversations] = useState<ChatItem[]>(DEFAULT_CONVERSATIONS);
  const conversations = externalConversations ?? internalConversations;
  const setConversations = onUpdateConversations ?? setInternalConversations;
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesScrollRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // Long-press menu & actions states
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText(null);
    }, 2400);
  };

  const selectedChat = conversations.find((c) => c.id === currentChatId);

  const filteredChats = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || !currentChatId) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    // Handle Edit Message submit
    if (editingMessageId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentChatId) {
            return {
              ...c,
              lastMessage: text,
              messages: c.messages.map((m) =>
                m.id === editingMessageId ? { ...m, text, isEdited: true } : m
              ),
            };
          }
          return c;
        })
      );
      setEditingMessageId(null);
      setInputText('');
      showToast('Message edited');
      return;
    }

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      time: formattedTime,
      read: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentChatId) {
          return {
            ...c,
            lastMessage: text,
            time: formattedTime,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputText('');
    setTimeout(() => {
      messagesScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 1. Edit Option Handler
  const handleOptionEdit = () => {
    if (!selectedMessageForMenu) return;
    const msg = selectedMessageForMenu;
    setSelectedMessageForMenu(null);
    setEditingMessageId(msg.id);
    setInputText(msg.text);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 120);
  };

  // 2. Forward Option Handler
  const handleOptionForward = () => {
    setIsForwardModalOpen(true);
  };

  const handleForwardToChat = (targetChatId: string) => {
    if (!selectedMessageForMenu) return;
    const targetChat = conversations.find((c) => c.id === targetChatId);
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    const forwardedMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: selectedMessageForMenu.text,
      time: formattedTime,
      read: true,
      sharedStory: selectedMessageForMenu.sharedStory,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetChatId) {
          return {
            ...c,
            lastMessage: selectedMessageForMenu.text || 'Forwarded a story',
            time: formattedTime,
            messages: [...c.messages, forwardedMsg],
          };
        }
        return c;
      })
    );

    setIsForwardModalOpen(false);
    setSelectedMessageForMenu(null);
    showToast(`Forwarded to ${targetChat?.name || 'chat'}`);
  };

  // 3. Add Sticker Option Handler
  const handleOptionAddSticker = () => {
    setIsStickerPickerOpen(true);
  };

  const handleSelectSticker = (stickerEmoji: string) => {
    if (!selectedMessageForMenu || !currentChatId) return;
    const msgId = selectedMessageForMenu.id;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === msgId ? { ...m, sticker: stickerEmoji } : m
            ),
          };
        }
        return c;
      })
    );
    setIsStickerPickerOpen(false);
    setSelectedMessageForMenu(null);
    showToast(`Sticker ${stickerEmoji} added`);
  };

  // 4. Pin Option Handler
  const handleOptionPin = (msgToPin?: ChatMessage) => {
    const target = msgToPin || selectedMessageForMenu;
    if (!target || !currentChatId) return;
    const nextPinned = !target.isPinned;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentChatId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === target.id ? { ...m, isPinned: nextPinned } : m
            ),
          };
        }
        return c;
      })
    );
    setSelectedMessageForMenu(null);
    showToast(nextPinned ? 'Message pinned to top' : 'Message unpinned');
  };

  // 5. Delete Option Handler (Place this option at the very bottom)
  const handleOptionDelete = () => {
    if (!selectedMessageForMenu || !currentChatId) return;
    const msgId = selectedMessageForMenu.id;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentChatId) {
          const updated = c.messages.filter((m) => m.id !== msgId);
          const lastMsg = updated.length > 0 ? updated[updated.length - 1].text : 'No messages yet';
          return {
            ...c,
            lastMessage: lastMsg,
            messages: updated,
          };
        }
        return c;
      })
    );
    setSelectedMessageForMenu(null);
    showToast('Message deleted');
  };

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: Direct Message Conversation Screen (Matching 2nd Image)
  // ─────────────────────────────────────────────────────────────
  if (selectedChat) {
    return (
      <KeyboardAvoidingView
        style={[styles.directContainer, isDark && styles.directContainerDark]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Conversation Header */}
        <View style={[styles.dmHeaderRow, isDark && styles.dmHeaderRowDark]}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => setChatId(null)}
            accessibilityLabel="Back to chat inbox"
          >
            <Feather name="arrow-left" size={22} color={isDark ? '#FFFFFF' : '#1A112A'} />
          </TouchableOpacity>

          {/* Contact Avatar */}
          <View style={styles.dmAvatarWrapper}>
            {selectedChat.isSpecialIcon ? (
              <View style={styles.specialAvatarBlackSmall}>
                <Feather name="eye-off" size={16} color="#FFFFFF" />
              </View>
            ) : (
              <Image source={{ uri: selectedChat.avatar }} style={styles.dmAvatar} />
            )}
            <View style={styles.statusDotOfflineSmall} />
          </View>

          {/* Contact Name & Offline Status */}
          <View style={styles.dmNameGroup}>
            <Text style={[styles.dmName, isDark && styles.dmNameDark]} numberOfLines={1}>
              {selectedChat.shortName}
            </Text>
            <View style={styles.statusRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.statusText}>{selectedChat.status}</Text>
            </View>
          </View>

          {/* Right Action Capsule: Message (Active), Call, Video, Folder */}
          <View style={[styles.actionCapsule, isDark && styles.actionCapsuleDark]}>
            <TouchableOpacity style={styles.actionTabActive} activeOpacity={0.8}>
              <Ionicons name="chatbubble" size={15} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionTabIcon} activeOpacity={0.7}>
              <Feather name="phone" size={15} color={isDark ? '#D8CCFF' : '#5E5373'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionTabIcon} activeOpacity={0.7}>
              <Feather name="video" size={15} color={isDark ? '#D8CCFF' : '#5E5373'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionTabIcon} activeOpacity={0.7}>
              <Feather name="folder" size={15} color={isDark ? '#D8CCFF' : '#5E5373'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Feed */}
        <ScrollView
          ref={messagesScrollRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Date Separator: ──────── 9 Sep 2026 ──────── */}
          <View style={styles.dateSeparatorRow}>
            <View style={[styles.dateSepLine, isDark && styles.dateSepLineDark]} />
            <Text style={[styles.dateSepText, isDark && styles.dateSepTextDark]}>9 Sep 2026</Text>
            <View style={[styles.dateSepLine, isDark && styles.dateSepLineDark]} />
          </View>

          {/* Pinned Message Header Banner */}
          {selectedChat.messages.find((m) => m.isPinned) && (
            <View style={[styles.pinnedBanner, isDark && styles.pinnedBannerDark]}>
              <View style={styles.pinnedIconWrap}>
                <Ionicons name="pin" size={13} color="#7C3AED" />
              </View>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.pinnedLabel}>Pinned message</Text>
                <Text style={[styles.pinnedText, isDark && styles.pinnedTextDark]} numberOfLines={1}>
                  {selectedChat.messages.find((m) => m.isPinned)?.text ||
                    `Story • ${selectedChat.messages.find((m) => m.isPinned)?.sharedStory?.authorName}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleOptionPin(selectedChat.messages.find((m) => m.isPinned))}
                style={{ padding: 4 }}
                accessibilityLabel="Unpin message"
              >
                <Feather name="x" size={15} color={isDark ? '#D8CCFF' : '#7C3AED'} />
              </TouchableOpacity>
            </View>
          )}

          {/* Messages */}
          {selectedChat.messages.map((msg) => {
            const isMe = msg.sender === 'user';
            return (
              <TouchableOpacity
                key={msg.id}
                activeOpacity={0.88}
                delayLongPress={260}
                onLongPress={() => setSelectedMessageForMenu(msg)}
                style={[
                  styles.messageBubbleWrap,
                  isMe ? styles.messageWrapRight : styles.messageWrapLeft,
                ]}
              >
                {/* Pinned pill tag on message */}
                {msg.isPinned && (
                  <View style={[styles.msgPinnedBadge, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                    <Ionicons name="pin" size={10} color="#7C3AED" style={{ marginRight: 3 }} />
                    <Text style={styles.msgPinnedBadgeText}>Pinned</Text>
                  </View>
                )}

                {msg.sharedStory ? (
                  <View
                    style={[
                      styles.storyCardBubble,
                      isDark && styles.storyCardBubbleDark,
                      isMe ? styles.storyCardBubbleRight : styles.storyCardBubbleLeft,
                    ]}
                  >
                    {/* Story author pill / header */}
                    <View style={styles.storyCardHeader}>
                      {msg.sharedStory.authorAvatar ? (
                        <Image
                          source={{ uri: msg.sharedStory.authorAvatar }}
                          style={styles.storyCardAuthorAvatar}
                        />
                      ) : (
                        <View style={[styles.storyCardAuthorAvatar, styles.storyCardAuthorAvatarFallback]}>
                          <Feather name="user" size={12} color="#FFFFFF" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.storyCardAuthorName, isDark && styles.storyCardAuthorNameDark]}
                          numberOfLines={1}
                        >
                          {msg.sharedStory.authorName}
                        </Text>
                        <Text style={[styles.storyCardAuthorSub, isDark && styles.storyCardAuthorSubDark]}>
                          Story • {msg.sharedStory.timeAgo || 'Just now'}
                        </Text>
                      </View>
                      <View style={styles.storyCardBadge}>
                        <Ionicons name="play-circle" size={16} color="#7C3AED" />
                      </View>
                    </View>

                    {/* Media Preview Box */}
                    <View style={styles.storyCardMediaWrap}>
                      <Image
                        source={{ uri: msg.sharedStory.thumbnailUri || msg.sharedStory.mediaUri }}
                        style={styles.storyCardMediaImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(12, 6, 28, 0.75)']}
                        style={styles.storyCardGradient}
                      />
                      {Boolean(msg.sharedStory.caption) && (
                        <Text style={styles.storyCardCaption} numberOfLines={2}>
                          {msg.sharedStory.caption}
                        </Text>
                      )}
                    </View>

                    {/* Accompanying text comment if provided */}
                    {Boolean(msg.text && msg.text !== 'Shared a story') && (
                      <Text
                        style={[
                          styles.storyCardCommentText,
                          isDark && styles.storyCardCommentTextDark,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    )}

                    {/* Metadata timestamp & read receipt */}
                    <View style={styles.storyCardMetaRow}>
                      <Text style={[styles.messageTime, isDark && styles.messageTimeDark]}>
                        {msg.time}
                      </Text>
                      {isMe && <Text style={styles.readDiamondIcon}>◆</Text>}
                    </View>
                  </View>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.messageText,
                        isDark && styles.messageTextDark,
                        isMe && styles.messageTextRight,
                      ]}
                    >
                      {msg.text}
                      {msg.isEdited && (
                        <Text style={[styles.msgEditedText, isDark && styles.msgEditedTextDark]}> (edited)</Text>
                      )}
                    </Text>
                    <View style={styles.messageMetaRow}>
                      <Text style={[styles.messageTime, isDark && styles.messageTimeDark]}>
                        {msg.time}
                      </Text>
                      {isMe && (
                        <Text style={styles.readDiamondIcon}>◆</Text>
                      )}
                    </View>
                  </>
                )}

                {/* Attached Sticker */}
                {Boolean(msg.sticker) && (
                  <View style={[styles.msgStickerBubble, isMe ? styles.msgStickerRight : styles.msgStickerLeft]}>
                    <Text style={styles.msgStickerEmoji}>{msg.sticker}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Editing Message Banner */}
        {editingMessageId && (
          <View style={[styles.editingBar, isDark && styles.editingBarDark]}>
            <Feather name="edit-2" size={14} color="#7C3AED" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.editingTitle}>Editing Message</Text>
              <Text style={[styles.editingPreview, isDark && styles.editingPreviewDark]} numberOfLines={1}>
                {selectedChat.messages.find((m) => m.id === editingMessageId)?.text}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingMessageId(null);
                setInputText('');
              }}
              style={{ padding: 4 }}
            >
              <Feather name="x" size={16} color={isDark ? '#FFFFFF' : '#1A112A'} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Input Bar */}
        <View style={[styles.inputBarContainer, isDark && styles.inputBarContainerDark]}>
          {/* Plus action button */}
          <TouchableOpacity
            style={[styles.plusCircleBtn, isDark && styles.plusCircleBtnDark]}
            activeOpacity={0.75}
            accessibilityLabel="Add attachment"
          >
            <Feather name="plus" size={18} color={isDark ? '#D8CCFF' : '#5A4D73'} />
          </TouchableOpacity>

          {/* Pill text input with action icons inside */}
          <View style={[styles.pillInputWrap, isDark && styles.pillInputWrapDark]}>
            <TextInput
              ref={textInputRef}
              style={[styles.pillTextInput, isDark && styles.pillTextInputDark]}
              placeholder="Message..."
              placeholderTextColor={isDark ? '#8A7FA5' : '#A098B5'}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <View style={styles.pillIconsGroup}>
              <TouchableOpacity activeOpacity={0.7} style={styles.pillIconBtn}>
                <Feather name="smile" size={17} color={isDark ? '#A79DB8' : '#8E84A6'} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.pillIconBtn}>
                <Feather name="camera" size={17} color={isDark ? '#A79DB8' : '#8E84A6'} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.pillIconBtn}>
                <Feather name="image" size={17} color={isDark ? '#A79DB8' : '#8E84A6'} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.pillIconBtn}>
                <Feather name="mic" size={17} color={isDark ? '#A79DB8' : '#8E84A6'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.8}
            onPress={handleSendMessage}
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>

        {/* Floating Toast Notification */}
        {toastText && (
          <View style={styles.chatToastWrap} pointerEvents="none">
            <View style={styles.chatToast}>
              <Feather name="check-circle" size={14} color="#A78BFA" style={{ marginRight: 6 }} />
              <Text style={styles.chatToastText}>{toastText}</Text>
            </View>
          </View>
        )}

        {/* ── Chat Long-Press Options Action Sheet Modal ──
            Options in exact requested order:
            1. Edit
            2. Forward
            3. Add Sticker
            4. Pin
            5. Delete (at the very bottom)
        */}
        <Modal
          visible={!!selectedMessageForMenu && !isForwardModalOpen && !isStickerPickerOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedMessageForMenu(null)}
        >
          <View style={styles.actionSheetBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedMessageForMenu(null)}
            />

            <View style={[styles.actionSheetCard, isDark && styles.actionSheetCardDark]}>
              <View style={styles.actionSheetHandle} />

              {/* Message preview snippet */}
              <View style={[styles.actionSheetPreviewBox, isDark && styles.actionSheetPreviewBoxDark]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.actionSheetSender, isDark && styles.actionSheetSenderDark]}>
                    {selectedMessageForMenu?.sender === 'user' ? 'You' : selectedChat.name}
                  </Text>
                  <Text style={styles.actionSheetTime}>{selectedMessageForMenu?.time}</Text>
                </View>
                <Text
                  style={[styles.actionSheetPreviewText, isDark && styles.actionSheetPreviewTextDark]}
                  numberOfLines={2}
                >
                  {selectedMessageForMenu?.text ||
                    (selectedMessageForMenu?.sharedStory
                      ? `Story shared by ${selectedMessageForMenu.sharedStory.authorName}`
                      : '')}
                </Text>
              </View>

              {/* 5 Options in the exact order requested by user */}
              <View style={styles.actionSheetOptionsList}>
                {/* 1. Edit */}
                <TouchableOpacity
                  style={styles.actionSheetOptionRow}
                  activeOpacity={0.7}
                  onPress={handleOptionEdit}
                >
                  <View style={[styles.actionSheetIconWrap, isDark && styles.actionSheetIconWrapDark]}>
                    <Feather name="edit-2" size={17} color={isDark ? '#D8CCFF' : '#7C3AED'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionSheetOptionText, isDark && styles.actionSheetOptionTextDark]}>
                      Edit
                    </Text>
                    <Text style={styles.actionSheetOptionSub}>Edit message text</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={isDark ? '#7E6B9E' : '#B8AEC8'} />
                </TouchableOpacity>

                {/* 2. Forward */}
                <TouchableOpacity
                  style={styles.actionSheetOptionRow}
                  activeOpacity={0.7}
                  onPress={handleOptionForward}
                >
                  <View style={[styles.actionSheetIconWrap, isDark && styles.actionSheetIconWrapDark]}>
                    <Feather name="corner-up-right" size={17} color={isDark ? '#D8CCFF' : '#7C3AED'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionSheetOptionText, isDark && styles.actionSheetOptionTextDark]}>
                      Forward
                    </Text>
                    <Text style={styles.actionSheetOptionSub}>Send to another chat</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={isDark ? '#7E6B9E' : '#B8AEC8'} />
                </TouchableOpacity>

                {/* 3. Add Sticker */}
                <TouchableOpacity
                  style={styles.actionSheetOptionRow}
                  activeOpacity={0.7}
                  onPress={handleOptionAddSticker}
                >
                  <View style={[styles.actionSheetIconWrap, isDark && styles.actionSheetIconWrapDark]}>
                    <Feather name="smile" size={17} color={isDark ? '#D8CCFF' : '#7C3AED'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionSheetOptionText, isDark && styles.actionSheetOptionTextDark]}>
                      Add Sticker
                    </Text>
                    <Text style={styles.actionSheetOptionSub}>Attach sticker or reaction</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={isDark ? '#7E6B9E' : '#B8AEC8'} />
                </TouchableOpacity>

                {/* 4. Pin */}
                <TouchableOpacity
                  style={styles.actionSheetOptionRow}
                  activeOpacity={0.7}
                  onPress={() => handleOptionPin()}
                >
                  <View style={[styles.actionSheetIconWrap, isDark && styles.actionSheetIconWrapDark]}>
                    <Ionicons
                      name={selectedMessageForMenu?.isPinned ? 'pin' : 'pin-outline'}
                      size={17}
                      color={isDark ? '#D8CCFF' : '#7C3AED'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionSheetOptionText, isDark && styles.actionSheetOptionTextDark]}>
                      {selectedMessageForMenu?.isPinned ? 'Unpin' : 'Pin'}
                    </Text>
                    <Text style={styles.actionSheetOptionSub}>
                      {selectedMessageForMenu?.isPinned ? 'Remove from pinned messages' : 'Pin to top of chat'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={isDark ? '#7E6B9E' : '#B8AEC8'} />
                </TouchableOpacity>

                {/* Divider before Delete */}
                <View style={[styles.actionSheetDivider, isDark && styles.actionSheetDividerDark]} />

                {/* 5. Delete (at the very bottom) */}
                <TouchableOpacity
                  style={[styles.actionSheetOptionRow, styles.actionSheetDeleteRow]}
                  activeOpacity={0.7}
                  onPress={handleOptionDelete}
                >
                  <View style={styles.actionSheetDeleteIconWrap}>
                    <Feather name="trash-2" size={17} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionSheetDeleteText}>Delete</Text>
                    <Text style={styles.actionSheetDeleteSub}>Delete message for everyone</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="rgba(239, 68, 68, 0.45)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Forward Contact Picker Modal ── */}
        <Modal
          visible={isForwardModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsForwardModalOpen(false)}
        >
          <View style={styles.actionSheetBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsForwardModalOpen(false)}
            />
            <View style={[styles.actionSheetCard, isDark && styles.actionSheetCardDark]}>
              <View style={styles.actionSheetHandle} />
              <View style={styles.forwardHeaderRow}>
                <Text style={[styles.forwardTitle, isDark && styles.forwardTitleDark]}>Forward message to</Text>
                <TouchableOpacity onPress={() => setIsForwardModalOpen(false)} style={{ padding: 4 }}>
                  <Feather name="x" size={18} color={isDark ? '#FFFFFF' : '#1A112A'} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {conversations.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={[styles.forwardContactRow, isDark && styles.forwardContactRowDark]}
                    activeOpacity={0.7}
                    onPress={() => handleForwardToChat(contact.id)}
                  >
                    {contact.isSpecialIcon ? (
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#3D2A70' : '#1A112A', alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="eye-off" size={16} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Image source={{ uri: contact.avatar }} style={styles.forwardContactAvatar} />
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.forwardContactName, isDark && styles.forwardContactNameDark]}>
                        {contact.name}
                      </Text>
                      <Text style={styles.forwardContactStatus}>{contact.status}</Text>
                    </View>
                    <View style={styles.forwardSendBadge}>
                      <Feather name="send" size={13} color="#FFFFFF" />
                      <Text style={styles.forwardSendText}>Send</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Add Sticker Picker Modal ── */}
        <Modal
          visible={isStickerPickerOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsStickerPickerOpen(false)}
        >
          <View style={styles.actionSheetBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsStickerPickerOpen(false)}
            />
            <View style={[styles.actionSheetCard, isDark && styles.actionSheetCardDark]}>
              <View style={styles.actionSheetHandle} />
              <View style={styles.forwardHeaderRow}>
                <Text style={[styles.forwardTitle, isDark && styles.forwardTitleDark]}>Select a sticker</Text>
                <TouchableOpacity onPress={() => setIsStickerPickerOpen(false)} style={{ padding: 4 }}>
                  <Feather name="x" size={18} color={isDark ? '#FFFFFF' : '#1A112A'} />
                </TouchableOpacity>
              </View>

              <View style={styles.stickerGrid}>
                {['❤️', '🔥', '👍', '😂', '🎉', '🚀', '⭐', '💯', '🌸', '⚡', '👏', '🥳', '💡', '💖', '✨', '🥰'].map(
                  (emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.stickerGridItem, isDark && styles.stickerGridItemDark]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectSticker(emoji)}
                    >
                      <Text style={styles.stickerGridEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: Chat Inbox Screen (Matching 1st Image)
  // ─────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={[styles.inboxTitle, isDark && styles.inboxTitleDark]}>Chat Inbox</Text>

      {/* Search Input */}
      <View style={[styles.searchBarWrap, isDark && styles.searchBarWrapDark]}>
        <Feather name="search" size={18} color={isDark ? '#8F85A3' : '#8F85A3'} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search chats, people or groups..."
          placeholderTextColor={isDark ? '#7E7395' : '#8F85A3'}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, isDark && styles.searchInputDark]}
        />
      </View>

      {/* Chats List */}
      <View style={styles.chatsListWrap}>
        {filteredChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[styles.chatRowItem, isDark && styles.chatRowItemDark]}
            activeOpacity={0.7}
            onPress={() => setChatId(chat.id)}
          >
            {/* Avatar Wrap */}
            <View style={styles.rowAvatarWrap}>
              {chat.isSpecialIcon ? (
                <View style={styles.specialAvatarBlack}>
                  <Feather name="eye-off" size={20} color="#FFFFFF" />
                </View>
              ) : (
                <Image source={{ uri: chat.avatar }} style={styles.rowAvatar} />
              )}
              {/* Gray status indicator dot */}
              <View style={[styles.statusDotOffline, isDark && styles.statusDotOfflineDark]} />
            </View>

            {/* Chat Info */}
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={[styles.rowName, isDark && styles.rowNameDark]}>{chat.name}</Text>
                {chat.time && (
                  <Text style={[styles.rowTime, isDark && styles.rowTimeDark]}>{chat.time}</Text>
                )}
              </View>
              <Text
                style={[styles.rowLastMessage, isDark && styles.rowLastMessageDark]}
                numberOfLines={1}
              >
                {chat.lastMessage}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Large Card below the chats */}
      <View style={[styles.inboxCard, isDark && styles.inboxCardDark]}>
        {/* Soft glowing circular badge with mascot */}
        <View style={[styles.cardMascotBadge, isDark && styles.cardMascotBadgeDark]}>
          <Image
            source={require('../../HiHubbleSplash/assets/splash/mascot.png')}
            style={styles.cardMascotImg}
            resizeMode="contain"
          />
        </View>

        {/* Card Heading */}
        <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
          Your conversations, in one place
        </Text>

        {/* Card Subtitle */}
        <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
          Stay connected, share moments and chat with your hub.
        </Text>
      </View>

      {/* Bottom padding for movable mascot */}
      <View style={{ height: 160 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ── INBOX (Image 1) STYLES ──
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inboxTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A112A',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  inboxTitleDark: {
    color: '#FFFFFF',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEAFF',
    shadowColor: '#302060',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchBarWrapDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A112A',
    paddingVertical: 0,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  chatsListWrap: {
    marginBottom: 10,
  },
  chatRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  chatRowItemDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAE5F4',
  },
  specialAvatarBlack: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotOffline: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9E98AD',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusDotOfflineDark: {
    borderColor: '#140C2C',
  },
  rowInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A112A',
  },
  rowNameDark: {
    color: '#FFFFFF',
  },
  rowTime: {
    fontSize: 12,
    color: '#8A829E',
    fontWeight: '400',
  },
  rowTimeDark: {
    color: '#A79DB8',
  },
  rowLastMessage: {
    fontSize: 14,
    color: '#7A7090',
  },
  rowLastMessageDark: {
    color: '#A79DB8',
  },

  // Large Card
  inboxCard: {
    borderWidth: 1.2,
    borderColor: '#EFEAFF',
    backgroundColor: '#FAF8FF',
    borderRadius: 24,
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#8338EC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inboxCardDark: {
    backgroundColor: 'rgba(30, 18, 55, 0.6)',
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  cardMascotBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#976BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 18,
  },
  cardMascotBadgeDark: {
    backgroundColor: '#261B48',
    shadowOpacity: 0.45,
  },
  cardMascotImg: {
    width: 60,
    height: 60,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A112A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: '#7A7090',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  cardSubtitleDark: {
    color: '#A79DB8',
  },

  // ── DIRECT MESSAGE (Image 2) STYLES ──
  directContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  directContainerDark: {
    backgroundColor: 'transparent',
  },
  dmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101, 53, 234, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  dmHeaderRowDark: {
    backgroundColor: 'rgba(27, 14, 60, 0.85)',
    borderBottomColor: '#2D1B54',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  dmAvatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  dmAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAE5F4',
  },
  specialAvatarBlackSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotOfflineSmall: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9E98AD',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  dmNameGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  dmName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A112A',
  },
  dmNameDark: {
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#8A8A9E',
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#8A8A9E',
  },
  actionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#EAE5F4',
    gap: 3,
  },
  actionCapsuleDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  actionTabActive: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTabIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Message Feed
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dateSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0EBF8',
  },
  dateSepLineDark: {
    backgroundColor: '#2D1B54',
  },
  dateSepText: {
    fontSize: 12,
    color: '#9E94B5',
    paddingHorizontal: 12,
  },
  dateSepTextDark: {
    color: '#8A7FA5',
  },
  messageBubbleWrap: {
    marginBottom: 18,
  },
  messageWrapLeft: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageWrapRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    color: '#1A112A',
    fontWeight: '400',
    lineHeight: 22,
  },
  messageTextDark: {
    color: '#FFFFFF',
  },
  messageTextRight: {
    textAlign: 'right',
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#9E94B5',
  },
  messageTimeDark: {
    color: '#8A7FA5',
  },
  readDiamondIcon: {
    color: '#00C2CB',
    fontSize: 9,
    marginLeft: 4,
  },

  // Bottom Input Bar
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 53, 234, 0.1)',
  },
  inputBarContainerDark: {
    backgroundColor: 'rgba(27, 14, 60, 0.92)',
    borderTopColor: '#2D1B54',
  },
  plusCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F0F8',
    borderWidth: 1,
    borderColor: '#EAE5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusCircleBtnDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  pillInputWrap: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5F4',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  pillInputWrapDark: {
    backgroundColor: '#261B48',
    borderColor: '#3D2D6C',
  },
  pillTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A112A',
    paddingVertical: 0,
  },
  pillTextInputDark: {
    color: '#FFFFFF',
  },
  pillIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillIconBtn: {
    padding: 2,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },

  // Shared Story Card Styles
  storyCardBubble: {
    width: 220,
    borderRadius: 16,
    padding: 10,
    backgroundColor: '#F7F3FD',
    borderColor: '#E8DCFC',
    borderWidth: 1,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  storyCardBubbleDark: {
    backgroundColor: '#241645',
    borderColor: '#432C7A',
  },
  storyCardBubbleRight: {
    alignSelf: 'flex-end',
  },
  storyCardBubbleLeft: {
    alignSelf: 'flex-start',
  },
  storyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  storyCardAuthorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  storyCardAuthorAvatarFallback: {
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A112A',
  },
  storyCardAuthorNameDark: {
    color: '#FFFFFF',
  },
  storyCardAuthorSub: {
    fontSize: 10,
    color: '#8A7FA5',
  },
  storyCardAuthorSubDark: {
    color: '#A89BC4',
  },
  storyCardBadge: {
    marginLeft: 4,
  },
  storyCardMediaWrap: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1433',
  },
  storyCardMediaImage: {
    width: '100%',
    height: '100%',
  },
  storyCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 55,
  },
  storyCardCaption: {
    position: 'absolute',
    bottom: 7,
    left: 8,
    right: 8,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  storyCardCommentText: {
    fontSize: 14,
    color: '#1A112A',
    fontWeight: '500',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  storyCardCommentTextDark: {
    color: '#FFFFFF',
  },
  storyCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 2,
  },

  // Pinned Banner at top of DM
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8DCFC',
  },
  pinnedBannerDark: {
    backgroundColor: '#26164A',
    borderColor: '#422878',
  },
  pinnedIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ECE3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinnedText: {
    fontSize: 13,
    color: '#1A112A',
    fontWeight: '500',
    marginTop: 1,
  },
  pinnedTextDark: {
    color: '#FFFFFF',
  },

  // Editing Banner above input
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#E8DCFC',
  },
  editingBarDark: {
    backgroundColor: '#241645',
    borderColor: '#432C7A',
  },
  editingTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  editingPreview: {
    fontSize: 13,
    color: '#1A112A',
    marginTop: 1,
  },
  editingPreviewDark: {
    color: '#FFFFFF',
  },

  // Message tags (pinned badge, sticker, edited)
  msgPinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 3,
  },
  msgPinnedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  msgEditedText: {
    fontSize: 11,
    color: '#9E94B5',
    fontStyle: 'italic',
  },
  msgEditedTextDark: {
    color: '#8A7FA5',
  },
  msgStickerBubble: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#EAE5F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  msgStickerRight: {
    right: 6,
  },
  msgStickerLeft: {
    left: 6,
  },
  msgStickerEmoji: {
    fontSize: 15,
  },

  // Long-press Action Sheet Modal
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 22, 0.65)',
    justifyContent: 'flex-end',
  },
  actionSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  actionSheetCardDark: {
    backgroundColor: '#1E1436',
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1C8E2',
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetPreviewBox: {
    backgroundColor: '#F6F2FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE3FA',
  },
  actionSheetPreviewBoxDark: {
    backgroundColor: '#2A1B4E',
    borderColor: '#432E74',
  },
  actionSheetSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    marginRight: 6,
  },
  actionSheetSenderDark: {
    color: '#C4A8FF',
  },
  actionSheetTime: {
    fontSize: 11,
    color: '#8A7FA5',
  },
  actionSheetPreviewText: {
    fontSize: 14,
    color: '#1A112A',
    lineHeight: 19,
  },
  actionSheetPreviewTextDark: {
    color: '#FFFFFF',
  },
  actionSheetOptionsList: {
    gap: 4,
  },
  actionSheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  actionSheetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EFFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionSheetIconWrapDark: {
    backgroundColor: '#2D1B54',
  },
  actionSheetOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A112A',
  },
  actionSheetOptionTextDark: {
    color: '#FFFFFF',
  },
  actionSheetOptionSub: {
    fontSize: 11.5,
    color: '#8A7FA5',
    marginTop: 1,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#F0EAF8',
    marginVertical: 4,
  },
  actionSheetDividerDark: {
    backgroundColor: '#34225A',
  },
  actionSheetDeleteRow: {
    paddingVertical: 11,
  },
  actionSheetDeleteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionSheetDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  actionSheetDeleteSub: {
    fontSize: 11.5,
    color: 'rgba(239, 68, 68, 0.75)',
    marginTop: 1,
  },

  // Forward Modal styles
  forwardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  forwardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A112A',
  },
  forwardTitleDark: {
    color: '#FFFFFF',
  },
  forwardContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  forwardContactRowDark: {},
  forwardContactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAE5F4',
  },
  forwardContactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A112A',
  },
  forwardContactNameDark: {
    color: '#FFFFFF',
  },
  forwardContactStatus: {
    fontSize: 11,
    color: '#8A7FA5',
  },
  forwardSendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  forwardSendText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Sticker Grid styles
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  stickerGridItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerGridItemDark: {
    backgroundColor: '#2A1A4E',
  },
  stickerGridEmoji: {
    fontSize: 24,
  },

  // Toast Pill
  chatToastWrap: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  chatToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1436',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  chatToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
