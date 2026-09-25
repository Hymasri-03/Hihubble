import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

export interface FollowersModalProps {
  visible: boolean;
  type: 'hubbers' | 'hubbies';
  themeMode: ThemeMode;
  onClose: () => void;
  onUpdateStats?: (type: 'hubbers' | 'hubbies', delta: number) => void;
}

const SAMPLE_HUBBERS = [
  {
    id: '1',
    name: 'Aarav Sharma',
    handle: '@aarav_s',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
  {
    id: '2',
    name: 'Sneha Patel',
    handle: '@sneha_p',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    isFollowing: false,
  },
  {
    id: '3',
    name: 'Vikram Rao',
    handle: '@vikram_r',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
  {
    id: '4',
    name: 'Diya Sen',
    handle: '@diya_sen',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
  {
    id: '5',
    name: 'Rohan Gupta',
    handle: '@rohan_g',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    isFollowing: false,
  },
];

const SAMPLE_HUBBIES = [
  {
    id: 'h1',
    name: 'Maya Lin',
    handle: '@mayalin',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
  {
    id: 'h2',
    name: 'Carlos Cruz',
    handle: '@carlos_c',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
  {
    id: 'h3',
    name: 'Elena Rostova',
    handle: '@elena_r',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
  {
    id: 'h4',
    name: 'Liam Chen',
    handle: '@liamchen',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop',
    isFollowing: true,
  },
];

export const FollowersModal = ({
  visible,
  type,
  themeMode,
  onClose,
  onUpdateStats,
}: FollowersModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const [activeTab, setActiveTab] = useState<'hubbers' | 'hubbies'>(type);
  const [hubbersList, setHubbersList] = useState(SAMPLE_HUBBERS);
  const [hubbiesList, setHubbiesList] = useState(SAMPLE_HUBBIES);

  // Sync activeTab when modal opens with new type prop
  React.useEffect(() => {
    if (visible) {
      setActiveTab(type);
    }
  }, [visible, type]);

  // Toggle Following in Hubbies (Following) list
  const toggleHubbieFollow = (id: string) => {
    setHubbiesList((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextState = !m.isFollowing;
          // Notify parent to adjust Following / Hubbies count
          onUpdateStats?.('hubbies', nextState ? 1 : -1);
          return { ...m, isFollowing: nextState };
        }
        return m;
      })
    );
  };

  // Toggle Follow / Follow-back in Hubbers (Followers) list
  const toggleHubberFollow = (id: string) => {
    setHubbersList((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextState = !m.isFollowing;
          onUpdateStats?.('hubbies', nextState ? 1 : -1);
          return { ...m, isFollowing: nextState };
        }
        return m;
      })
    );
  };

  // Remove follower from Hubbers list (decreases Hubbers count)
  const handleRemoveFollower = (id: string) => {
    setHubbersList((prev) => prev.filter((m) => m.id !== id));
    onUpdateStats?.('hubbers', -1);
  };

  // Popup confirmation state (Left-positioned, clean text, no images)
  const [activePopupItem, setActivePopupItem] = useState<{
    id: string;
    name: string;
    handle: string;
    isFollowing?: boolean;
  } | null>(null);
  const [popupMode, setPopupMode] = useState<'follow' | 'unfollow' | 'remove' | null>(null);

  const handleCloseFollowersPopup = () => {
    setActivePopupItem(null);
    setPopupMode(null);
  };

  const handleConfirmFollowersAction = () => {
    if (!activePopupItem) return;
    if (popupMode === 'remove') {
      handleRemoveFollower(activePopupItem.id);
    } else if (isHubbersTab) {
      toggleHubberFollow(activePopupItem.id);
    } else {
      toggleHubbieFollow(activePopupItem.id);
    }
    handleCloseFollowersPopup();
  };

  // Simulate new Hubber (follower) joining (increases Hubbers count)
  const handleAddSampleFollower = () => {
    const newFollower = {
      id: `f_${Date.now()}`,
      name: 'Cosmic Explorer',
      handle: `@explorer_${Math.floor(Math.random() * 900 + 100)}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      isFollowing: false,
    };
    setHubbersList((prev) => [newFollower, ...prev]);
    onUpdateStats?.('hubbers', 1);
  };

  const isHubbersTab = activeTab === 'hubbers';
  const currentList = isHubbersTab ? hubbersList : hubbiesList;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View
          style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          data-modal-card="true"
        >
          {/* Popup Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.titleGroup}>
              <Ionicons
                name={isHubbersTab ? 'people' : 'heart'}
                size={20}
                color={BRAND_COLORS.purplePrimary}
              />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {isHubbersTab ? 'Hubbers (Followers)' : 'Hubbies (Following)'}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Segment Tabs: Switch between Hubbers & Hubbies */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('hubbers')}
              style={[
                styles.segmentBtn,
                isHubbersTab && { backgroundColor: BRAND_COLORS.purplePrimary },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: isHubbersTab ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Hubbers ({hubbersList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('hubbies')}
              style={[
                styles.segmentBtn,
                !isHubbersTab && { backgroundColor: BRAND_COLORS.purplePrimary },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: !isHubbersTab ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Hubbies ({hubbiesList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Add Hubber Action Bar (for testing/interaction) */}
          {isHubbersTab && (
            <View style={styles.actionPromptRow}>
              <Text style={[styles.promptText, { color: colors.textMuted }]}>
                Manage who follows your cosmic hub
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddSampleFollower}
                style={[styles.addMemberBtn, { borderColor: BRAND_COLORS.purpleLight }]}
              >
                <Feather name="user-plus" size={12} color={BRAND_COLORS.purplePrimary} />
                <Text style={styles.addMemberBtnText}>+ Follower</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Members List */}
          <FlatList
            data={currentList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.infoCol}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.memberHandle, { color: colors.textMuted }]}>
                    {item.handle}
                  </Text>
                </View>

                {isHubbersTab ? (
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setActivePopupItem(item);
                        setPopupMode(item.isFollowing ? 'unfollow' : 'follow');
                      }}
                      style={[
                        styles.followBtn,
                        item.isFollowing
                          ? { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 }
                          : { backgroundColor: BRAND_COLORS.purplePrimary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          { color: item.isFollowing ? colors.textPrimary : '#FFFFFF' },
                        ]}
                      >
                        {item.isFollowing ? 'Hubbie' : 'Follow Back'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setActivePopupItem(item);
                        setPopupMode('remove');
                      }}
                      style={styles.removeBtn}
                    >
                      <Feather name="user-x" size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setActivePopupItem(item);
                      setPopupMode(item.isFollowing ? 'unfollow' : 'follow');
                    }}
                    style={[
                      styles.followBtn,
                      item.isFollowing
                        ? { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 }
                        : { backgroundColor: BRAND_COLORS.purplePrimary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.followBtnText,
                        { color: item.isFollowing ? colors.textPrimary : '#FFFFFF' },
                      ]}
                    >
                      {item.isFollowing ? 'Hubbie' : '+ Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          {/* Left-Aligned Confirmation Popup (Clean UI without images) */}
          {popupMode !== null && activePopupItem !== null && (
            <Modal
              visible={true}
              transparent
              animationType="fade"
              onRequestClose={handleCloseFollowersPopup}
            >
              <View style={styles.leftModalOverlay} data-modal-overlay="true">
                <View
                  style={[
                    styles.leftPopupCard,
                    { backgroundColor: colors.cardBg, borderColor: colors.border },
                  ]}
                  data-modal-card="true"
                >
                  {/* Header: Back Arrow (Left), Title (Center), Close X (Right) */}
                  <View style={[styles.leftPopupHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleCloseFollowersPopup}
                      style={styles.popupNavBtn}
                    >
                      <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={[styles.leftPopupTitle, { color: colors.textPrimary }]}>
                      {popupMode === 'follow'
                        ? 'Follow Account'
                        : popupMode === 'unfollow'
                        ? 'Unfollow Account'
                        : 'Remove Follower'}
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleCloseFollowersPopup}
                      style={styles.popupNavBtn}
                    >
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Clean text details (no images) */}
                  <View style={[styles.accountDetailBox, { backgroundColor: colors.statCardBg }]}>
                    <View style={styles.accountTextCol}>
                      <Text style={[styles.accountNameText, { color: colors.textPrimary }]}>
                        {activePopupItem.name}
                      </Text>
                      <Text style={[styles.accountHandleText, { color: colors.textMuted }]}>
                        {activePopupItem.handle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.confirmContent}>
                    <Text style={[styles.confirmQuestion, { color: colors.textPrimary }]}>
                      {popupMode === 'follow'
                        ? 'Follow this account?'
                        : popupMode === 'unfollow'
                        ? `Unfollow ${activePopupItem.name}?`
                        : `Remove ${activePopupItem.name} as a follower?`}
                    </Text>
                    <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
                      {popupMode === 'follow'
                        ? `You will start seeing ${activePopupItem.name}'s hubs in your feed.`
                        : popupMode === 'unfollow'
                        ? `They will be removed from your Hubbies list.`
                        : `They will no longer follow your cosmic profile.`}
                    </Text>

                    <View style={styles.confirmActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={handleCloseFollowersPopup}
                        style={[
                          styles.confirmCancelBtn,
                          { borderColor: colors.border, backgroundColor: colors.statCardBg },
                        ]}
                      >
                        <Text style={[styles.confirmCancelText, { color: colors.textPrimary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleConfirmFollowersAction}
                        style={[
                          styles.confirmPrimaryBtn,
                          {
                            backgroundColor:
                              popupMode === 'follow'
                                ? BRAND_COLORS.purplePrimary
                                : '#EF4444',
                          },
                        ]}
                      >
                        <Text style={styles.confirmPrimaryText}>
                          {popupMode === 'follow'
                            ? 'Confirm Follow'
                            : popupMode === 'unfollow'
                            ? 'Unfollow'
                            : 'Remove'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </Modal>
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
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  actionPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  promptText: {
    fontSize: 11.5,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  addMemberBtnText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  memberHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    padding: 6,
  },
  leftModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  leftPopupCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  leftPopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  popupNavBtn: {
    padding: 4,
    borderRadius: 16,
  },
  leftPopupTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  accountDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  accountTextCol: {
    flex: 1,
  },
  accountNameText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  accountHandleText: {
    fontSize: 12,
    marginTop: 2,
  },
  confirmContent: {
    paddingVertical: 4,
  },
  confirmQuestion: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  confirmDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 18,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  confirmCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default FollowersModal;
