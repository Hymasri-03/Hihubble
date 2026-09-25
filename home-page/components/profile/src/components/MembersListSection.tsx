import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { MemberPerson, ThemeMode } from '../types/profile';

export interface MembersListSectionProps {
  type: 'hubbers' | 'hubbies';
  members: MemberPerson[];
  themeMode: ThemeMode;
  onAddMember: (person: MemberPerson) => void;
  onRemoveMember: (id: string) => void;
  onToggleFollow?: (id: string) => void;
  onRestrictMember?: (handle: string) => void;
  onBlockMember?: (handle: string) => void;
}

export const MembersListSection = ({
  type,
  members,
  themeMode,
  onAddMember,
  onRemoveMember,
  onToggleFollow,
  onRestrictMember,
  onBlockMember,
}: MembersListSectionProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const isHubbers = type === 'hubbers';

  const [searchQuery, setSearchQuery] = useState('');

  // Custom Popup State (Follow, Unfollow, Choose action)
  const [activeModalPerson, setActiveModalPerson] = useState<MemberPerson | null>(null);
  const [modalType, setModalType] = useState<'follow' | 'unfollow' | 'choose_action' | null>(null);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger Follow or Unfollow confirmation popup
  const handleFollowClick = (person: MemberPerson) => {
    setActiveModalPerson(person);
    setModalType(person.isFollowing ? 'unfollow' : 'follow');
  };

  // Trigger "Choose action for this account" popup
  const handleOpenMemberOptions = (person: MemberPerson) => {
    setActiveModalPerson(person);
    setModalType('choose_action');
  };

  const handleClosePopup = () => {
    setActiveModalPerson(null);
    setModalType(null);
  };

  // Confirm Follow / Unfollow
  const handleConfirmFollowToggle = () => {
    if (activeModalPerson) {
      onToggleFollow?.(activeModalPerson.id);
    }
    handleClosePopup();
  };

  // Confirm Remove Hubber
  const handleConfirmRemove = () => {
    if (activeModalPerson) {
      onRemoveMember(activeModalPerson.id);
    }
    handleClosePopup();
  };

  // Confirm Restrict
  const handleConfirmRestrict = () => {
    if (activeModalPerson) {
      onRestrictMember?.(activeModalPerson.handle);
    }
    handleClosePopup();
  };

  // Confirm Block
  const handleConfirmBlock = () => {
    if (activeModalPerson) {
      onBlockMember?.(activeModalPerson.handle);
      onRemoveMember(activeModalPerson.id);
    }
    handleClosePopup();
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconCircle, { backgroundColor: isHubbers ? '#EDE9FE' : '#F5F3FF' }]}>
            <Ionicons
              name={isHubbers ? 'people' : 'heart'}
              size={18}
              color={BRAND_COLORS.purplePrimary}
            />
          </View>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {isHubbers ? 'Hubbers' : 'Hubbies'}
              </Text>
              <View style={[styles.pillBadge, { backgroundColor: BRAND_COLORS.purplePrimary }]}>
                <Text style={styles.pillBadgeText}>{members.length}</Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {isHubbers
                ? 'People who follow your cosmic profile'
                : 'Hubbers you follow in the cosmos'}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Filter Input */}
      {members.length > 3 && (
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.statCardBg, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={14} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={`Search ${isHubbers ? 'Hubbers' : 'Hubbies'}...`}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* People List */}
      <View style={styles.list}>
        {filteredMembers.map((person) => (
          <View
            key={person.id}
            style={[
              styles.memberCard,
              { backgroundColor: colors.statCardBg, borderColor: colors.border },
            ]}
          >
            <Image source={{ uri: person.avatar }} style={styles.memberAvatar} />
            <View style={styles.memberInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                  {person.name}
                </Text>
                {person.roleBadge ? (
                  <View
                    style={[
                      styles.rolePill,
                      { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder },
                    ]}
                  >
                    <Text style={[styles.rolePillText, { color: colors.badgeText }]}>
                      {person.roleBadge}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.memberHandle, { color: colors.textMuted }]}>
                {person.handle}
              </Text>
            </View>

            {/* Direct Follow & Unfollow Action Buttons -> Triggers Popup */}
            <View style={styles.actionGroup}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleFollowClick(person)}
                style={[
                  styles.toggleFollowBtn,
                  person.isFollowing
                    ? {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        borderWidth: 1,
                      }
                    : {
                        backgroundColor: BRAND_COLORS.purplePrimary,
                      },
                ]}
              >
                <Feather
                  name={person.isFollowing ? 'user-check' : 'user-plus'}
                  size={12}
                  color={person.isFollowing ? colors.textSecondary : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.toggleFollowBtnText,
                    {
                      color: person.isFollowing ? colors.textSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  {person.isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>

              {/* More Options: Choose action for this account */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenMemberOptions(person)}
                style={[styles.removeIconBtn, { borderColor: colors.border }]}
              >
                <Feather name="more-vertical" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredMembers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery
                ? `No ${isHubbers ? 'Hubbers' : 'Hubbies'} match your search.`
                : `No ${isHubbers ? 'Hubbers' : 'Hubbies'} yet.`}
            </Text>
          </View>
        )}
      </View>

      {/* ============================================================ */}
      {/* CUSTOM POPUP MODAL (Positioned on the Left Side, Clean UI)  */}
      {/* ============================================================ */}
      {modalType !== null && activeModalPerson !== null && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={handleClosePopup}
        >
          <View style={styles.modalOverlay} data-modal-overlay="true">
            <View
              style={[
                styles.leftPopupCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.border,
                },
              ]}
              data-modal-card="true"
            >
              {/* Header with Back Arrow (Left), Title (Center), and X (Close) on Right */}
              <View style={[styles.popupHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClosePopup}
                  style={styles.popupNavBtn}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.popupHeaderTitle, { color: colors.textPrimary }]}>
                  {modalType === 'choose_action'
                    ? 'Account Options'
                    : modalType === 'follow'
                    ? 'Follow Account'
                    : 'Unfollow Account'}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClosePopup}
                  style={styles.popupNavBtn}
                >
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Account Details Header (Clean text without reference images) */}
              <View style={[styles.accountDetailBox, { backgroundColor: colors.statCardBg }]}>
                <View style={styles.accountTextCol}>
                  <Text style={[styles.accountNameText, { color: colors.textPrimary }]}>
                    {activeModalPerson.name}
                  </Text>
                  <Text style={[styles.accountHandleText, { color: colors.textMuted }]}>
                    {activeModalPerson.handle}
                  </Text>
                </View>
                <View style={[styles.accountBadgePill, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.accountBadgePillText, { color: colors.badgeText }]}>
                    {activeModalPerson.roleBadge || (isHubbers ? 'Hubber' : 'Hubbie')}
                  </Text>
                </View>
              </View>

              {/* POPUP BODY: Follow Confirmation */}
              {modalType === 'follow' && (
                <View style={styles.confirmContent}>
                  <Text style={[styles.confirmQuestion, { color: colors.textPrimary }]}>
                    Follow this account?
                  </Text>
                  <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
                    You will start seeing {activeModalPerson.name}'s latest hubs, clips, and cosmic
                    updates in your Hubbies collection.
                  </Text>

                  <View style={styles.confirmActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={handleClosePopup}
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
                      onPress={handleConfirmFollowToggle}
                      style={[
                        styles.confirmPrimaryBtn,
                        { backgroundColor: BRAND_COLORS.purplePrimary },
                      ]}
                    >
                      <Feather name="user-plus" size={14} color="#FFFFFF" />
                      <Text style={styles.confirmPrimaryText}>Confirm Follow</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* POPUP BODY: Unfollow Confirmation */}
              {modalType === 'unfollow' && (
                <View style={styles.confirmContent}>
                  <Text style={[styles.confirmQuestion, { color: colors.textPrimary }]}>
                    Unfollow {activeModalPerson.name}?
                  </Text>
                  <Text style={[styles.confirmDesc, { color: colors.textSecondary }]}>
                    Are you sure you want to unfollow {activeModalPerson.handle}? Their posts will
                    no longer appear in your Hubbies feed.
                  </Text>

                  <View style={styles.confirmActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={handleClosePopup}
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
                      onPress={handleConfirmFollowToggle}
                      style={[styles.confirmPrimaryBtn, { backgroundColor: '#EF4444' }]}
                    >
                      <Feather name="user-minus" size={14} color="#FFFFFF" />
                      <Text style={styles.confirmPrimaryText}>Unfollow</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* POPUP BODY: "Choose action for this account" with Right-Aligned Options */}
              {modalType === 'choose_action' && (
                <View style={styles.actionsSection}>
                  <Text style={[styles.sectionPrompt, { color: colors.textSecondary }]}>
                    Choose action for this account:
                  </Text>

                  <View style={styles.actionItemsList}>
                    {/* 1. Remove Hubber / Unfollow */}
                    <View
                      style={[
                        styles.actionRowCard,
                        { backgroundColor: colors.statCardBg, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.actionRowLeft}>
                        <View
                          style={[
                            styles.actionIconBox,
                            { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                          ]}
                        >
                          <Feather name="user-x" size={16} color="#EF4444" />
                        </View>
                        <View style={styles.actionTextWrap}>
                          <Text style={[styles.actionRowTitle, { color: colors.textPrimary }]}>
                            {isHubbers ? 'Remove Hubber' : 'Unfollow Hubbie'}
                          </Text>
                          <Text style={[styles.actionRowDesc, { color: colors.textMuted }]}>
                            {isHubbers
                              ? 'Remove from your followers list'
                              : 'Stop following this hubber'}
                          </Text>
                        </View>
                      </View>

                      {/* Right-Aligned Action Option */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleConfirmRemove}
                        style={[
                          styles.actionRowBtnRight,
                          {
                            borderColor: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          },
                        ]}
                      >
                        <Text style={[styles.actionRowBtnRightText, { color: '#EF4444' }]}>
                          {isHubbers ? 'Remove Hubber' : 'Unfollow'}
                        </Text>
                        <Feather name="chevron-right" size={13} color="#EF4444" />
                      </TouchableOpacity>
                    </View>

                    {/* 2. Restrict Account */}
                    <View
                      style={[
                        styles.actionRowCard,
                        { backgroundColor: colors.statCardBg, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.actionRowLeft}>
                        <View
                          style={[
                            styles.actionIconBox,
                            { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                          ]}
                        >
                          <Feather name="shield" size={16} color="#F59E0B" />
                        </View>
                        <View style={styles.actionTextWrap}>
                          <Text style={[styles.actionRowTitle, { color: colors.textPrimary }]}>
                            Restrict Account
                          </Text>
                          <Text style={[styles.actionRowDesc, { color: colors.textMuted }]}>
                            Limit comments and interactions
                          </Text>
                        </View>
                      </View>

                      {/* Right-Aligned Action Option */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleConfirmRestrict}
                        style={[
                          styles.actionRowBtnRight,
                          {
                            borderColor: '#F59E0B',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                          },
                        ]}
                      >
                        <Text style={[styles.actionRowBtnRightText, { color: '#F59E0B' }]}>
                          Restrict
                        </Text>
                        <Feather name="chevron-right" size={13} color="#F59E0B" />
                      </TouchableOpacity>
                    </View>

                    {/* 3. Block Account */}
                    <View
                      style={[
                        styles.actionRowCard,
                        { backgroundColor: colors.statCardBg, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.actionRowLeft}>
                        <View
                          style={[
                            styles.actionIconBox,
                            { backgroundColor: 'rgba(220, 38, 38, 0.12)' },
                          ]}
                        >
                          <Feather name="slash" size={16} color="#DC2626" />
                        </View>
                        <View style={styles.actionTextWrap}>
                          <Text style={[styles.actionRowTitle, { color: colors.textPrimary }]}>
                            Block Account
                          </Text>
                          <Text style={[styles.actionRowDesc, { color: colors.textMuted }]}>
                            Prevent user from viewing profile
                          </Text>
                        </View>
                      </View>

                      {/* Right-Aligned Action Option */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleConfirmBlock}
                        style={[
                          styles.actionRowBtnRight,
                          {
                            borderColor: '#DC2626',
                            backgroundColor: 'rgba(220, 38, 38, 0.08)',
                          },
                        ]}
                      >
                        <Text style={[styles.actionRowBtnRightText, { color: '#DC2626' }]}>
                          Block
                        </Text>
                        <Feather name="chevron-right" size={13} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleClosePopup}
                    style={[
                      styles.popupCancelBottomBtn,
                      { borderColor: colors.border, backgroundColor: colors.statCardBg },
                    ]}
                  >
                    <Text style={[styles.popupCancelBottomText, { color: colors.textPrimary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pillBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  list: {
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  memberHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleFollowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6.5,
    borderRadius: 12,
  },
  toggleFollowBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  removeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // -------------------------------------------------------------
  // CENTERED DIALOG POPUP CSS STYLES (Clean & layout-aligned)
  // -------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 15, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  leftPopupCard: {
    width: '100%',
    maxWidth: 440,
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
  popupHeader: {
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
  popupHeaderTitle: {
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
  accountBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  accountBadgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Confirm Follow / Unfollow View
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

  // "Choose action for this account" with Right-Aligned Options
  actionsSection: {
    paddingTop: 2,
  },
  sectionPrompt: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionItemsList: {
    gap: 10,
    marginBottom: 16,
  },
  actionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionRowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRowDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  actionRowBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionRowBtnRightText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  popupCancelBottomBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCancelBottomText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default MembersListSection;
