import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { TaggedPerson, ThemeMode, HubPost } from '../types/profile';

export interface TaggedSectionProps {
  taggedList: TaggedPerson[];
  taggedPosts: HubPost[];
  themeMode: ThemeMode;
  onAddTagged: (person: TaggedPerson) => void;
  onRemoveTagged: (id: string) => void;
  onPressPost?: (post: HubPost) => void;
}

export const TaggedSection = ({
  taggedList,
  taggedPosts,
  themeMode,
  onAddTagged,
  onRemoveTagged,
  onPressPost,
}: TaggedSectionProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [taggedInTitle, setTaggedInTitle] = useState('Cosmic Stargazing');
  const [activeSubTab, setActiveSubTab] = useState<'people' | 'posts'>('people');

  const handleAdd = () => {
    if (!name.trim() || !handle.trim()) {
      Alert.alert('Required', 'Please enter a name and handle to tag.');
      return;
    }

    const cleanHandle = handle.trim().startsWith('@')
      ? handle.trim()
      : `@${handle.trim()}`;

    const newPerson: TaggedPerson = {
      id: `tag_${Date.now()}`,
      name: name.trim(),
      handle: cleanHandle,
      avatar: `https://images.unsplash.com/photo-${1534528741000 + Math.floor(Math.random() * 1000)}?q=80&w=200&auto=format&fit=crop`,
      taggedInTitle: taggedInTitle.trim() || 'Latest Hub Post',
      taggedDate: 'Just now',
      roleBadge: 'Tagged Friend',
    };

    onAddTagged(newPerson);
    setName('');
    setHandle('');
    setShowAddForm(false);
    Alert.alert('Tagged', `${newPerson.name} has been tagged.`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="pricetag" size={18} color={BRAND_COLORS.purplePrimary} />
          </View>
          <View style={styles.titleTextCol}>
            <View style={styles.titleBadgeRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Tagged
              </Text>
              <View style={[styles.pillBadge, { backgroundColor: BRAND_COLORS.purplePrimary }]}>
                <Text style={styles.pillBadgeText}>{taggedList.length}</Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
              Friends and hubbers tagged in your universe
            </Text>
          </View>
        </View>

        {/* Tag Person Button (Positioned higher, zero text overlap) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAddForm((prev) => !prev)}
          style={[styles.addBtn, { backgroundColor: BRAND_COLORS.purplePrimary }]}
        >
          <Feather name={showAddForm ? 'x' : 'user-plus'} size={13} color="#FFFFFF" />
          <Text style={styles.addBtnText}>
            {showAddForm ? 'Cancel' : '+ Tag Person'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tabs: Tagged People vs Tagged Posts */}
      <View style={[styles.subTabsContainer, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('people')}
          style={[
            styles.subTabBtn,
            activeSubTab === 'people' && { backgroundColor: BRAND_COLORS.purplePrimary },
          ]}
        >
          <Text
            style={[
              styles.subTabText,
              { color: activeSubTab === 'people' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Tagged People ({taggedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveSubTab('posts')}
          style={[
            styles.subTabBtn,
            activeSubTab === 'posts' && { backgroundColor: BRAND_COLORS.purplePrimary },
          ]}
        >
          <Text
            style={[
              styles.subTabText,
              { color: activeSubTab === 'posts' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Tagged Posts ({taggedPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline Tag Person Form */}
      {showAddForm && (
        <View style={[styles.addFormCard, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
          <Text style={[styles.addFormTitle, { color: colors.textPrimary }]}>
            Tag a Person in your Hubs
          </Text>
          <View style={styles.formRow}>
            <TextInput
              style={[
                styles.formInput,
                { backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Full Name (e.g. Alex Rivers)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[
                styles.formInput,
                { backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Handle (@alex_r)"
              placeholderTextColor={colors.textMuted}
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
            />
          </View>
          <TextInput
            style={[
              styles.formInputFull,
              { backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder="Tagged in (e.g. Mountain Sky Hubble)"
            placeholderTextColor={colors.textMuted}
            value={taggedInTitle}
            onChangeText={setTaggedInTitle}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAdd}
            style={styles.confirmAddBtn}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.confirmAddBtnGradient}
            >
              <Feather name="check" size={14} color="#FFFFFF" />
              <Text style={styles.confirmAddBtnText}>Confirm & Tag Person</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* View: Tagged People List */}
      {activeSubTab === 'people' ? (
        <View style={styles.list}>
          {taggedList.map((person) => (
            <View
              key={person.id}
              style={[styles.personCard, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
              <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
              <View style={styles.personInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.personName, { color: colors.textPrimary }]}>
                    {person.name}
                  </Text>
                  <Text style={[styles.personHandle, { color: colors.textMuted }]}>
                    {person.handle}
                  </Text>
                </View>
                {person.taggedInTitle ? (
                  <View style={styles.taggedInRow}>
                    <Ionicons name="pricetag-outline" size={11} color={BRAND_COLORS.purplePrimary} />
                    <Text style={[styles.taggedInText, { color: colors.textSecondary }]}>
                      {person.taggedInTitle}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Untag / Remove Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onRemoveTagged(person.id)}
                style={[styles.untagBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
              >
                <Feather name="tag" size={12} color="#EF4444" />
                <Text style={styles.untagBtnText}>Untag</Text>
              </TouchableOpacity>
            </View>
          ))}

          {taggedList.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No one tagged yet. Tap '+ Tag Person' to tag friends!
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* View: Tagged Posts */
        <View style={styles.postsGrid}>
          {taggedPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              activeOpacity={0.85}
              onPress={() => onPressPost?.(post)}
              style={styles.postThumbWrapper}
            >
              <Image source={{ uri: post.imageUrl }} style={styles.postThumb} resizeMode="cover" />
              <View style={styles.tagBadgeOverlay}>
                <Ionicons name="pricetag" size={10} color="#FFFFFF" />
                <Text style={styles.tagBadgeText}>Tagged</Text>
              </View>
            </TouchableOpacity>
          ))}

          {taggedPosts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No tagged posts in this section yet.
              </Text>
            </View>
          )}
        </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  titleTextCol: {
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
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
    lineHeight: 16,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
    marginTop: -2,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  subTabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginBottom: 12,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addFormCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  addFormTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  formInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12.5,
  },
  formInputFull: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12.5,
    marginBottom: 8,
  },
  confirmAddBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  confirmAddBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 6,
  },
  confirmAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  list: {
    gap: 8,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
  },
  personHandle: {
    fontSize: 12,
  },
  taggedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  taggedInText: {
    fontSize: 11.5,
  },
  untagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  untagBtnText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '700',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postThumbWrapper: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  postThumb: {
    width: '100%',
    height: '100%',
  },
  tagBadgeOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  tagBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
    width: '100%',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default TaggedSection;
