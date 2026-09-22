import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

const RECENT_SEARCHES = [
  'Alex Rivers',
  'Team Offsite 🏔️',
  'Live Coding 🚀',
  'Mountain Lake',
];

const TRENDING_TAGS = [
  '#trending',
  '#weekendvibes',
  '#nature',
  '#reactnative',
  '#offsite',
  '#hubble',
];

const SUGGESTED_PEOPLE = [
  {
    id: '1',
    name: 'Alex Rivers',
    handle: '@alex_rivers',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'Jamie Sun',
    handle: '@jamie_codes',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Sarah Chen',
    handle: '@sarah_c',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

export default function SearchBarModal({
  isDark,
  onClose,
}: {
  isDark: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(RECENT_SEARCHES);

  const removeRecent = (item: string) => {
    setRecents((prev) => prev.filter((r) => r !== item));
  };

  return (
    <SafeAreaProvider style={[styles.overlay, isDark && styles.overlayDark]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        {/* Search Bar Input Row */}
        <View style={styles.inputRow}>
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <Feather
            name="search"
            size={19}
            color={isDark ? '#A99BD1' : '#6535EA'}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search friends, vibes, tags..."
            placeholderTextColor={isDark ? '#8E7EC2' : '#907FA8'}
            style={[styles.input, isDark && styles.inputDark]}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? '#A99BD1' : '#6535EA'}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.cancelButton} activeOpacity={0.7}>
          <Text style={[styles.cancelText, isDark && styles.cancelTextDark]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Search Options & Suggestions */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Trending Tags Section */}
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Trending Vibes
        </Text>
        <View style={styles.tagsWrap}>
          {TRENDING_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => setQuery(tag)}
              style={[styles.tagPill, isDark && styles.tagPillDark]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tagText, isDark && styles.tagTextDark]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Searches Section */}
        {recents.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Recent Searches
              </Text>
              <TouchableOpacity onPress={() => setRecents([])}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>

            {recents.map((item) => (
              <View key={item} style={styles.recentItemRow}>
                <TouchableOpacity
                  style={styles.recentTextGroup}
                  onPress={() => setQuery(item)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="clock"
                    size={16}
                    color={isDark ? '#A99BD1' : '#7667A5'}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[styles.recentText, isDark && styles.recentTextDark]}>
                    {item}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeRecent(item)}
                  style={{ padding: 6 }}
                >
                  <Ionicons
                    name="close"
                    size={17}
                    color={isDark ? '#8A7BB2' : '#9E92BA'}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Suggested People Section */}
        <Text
          style={[
            styles.sectionTitle,
            isDark && styles.sectionTitleDark,
            { marginTop: 18 },
          ]}
        >
          Suggested People
        </Text>
        {SUGGESTED_PEOPLE.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={[styles.personRow, isDark && styles.personRowDark]}
            activeOpacity={0.7}
            onPress={() => setQuery(person.name)}
          >
            <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.personName, isDark && styles.personNameDark]}>
                {person.name}
              </Text>
              <Text style={styles.personHandle}>{person.handle}</Text>
            </View>
            <TouchableOpacity style={styles.followBtn} activeOpacity={0.8}>
              <Text style={styles.followBtnText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FAF8FE',
    zIndex: 99,
  },
  overlayDark: {
    backgroundColor: '#120B26',
  },
  safeArea: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2D8FD',
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#6535EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerDark: {
    backgroundColor: '#201542',
    borderColor: '#3E2A74',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: '#211054',
    paddingVertical: 0,
  },
  inputDark: {
    color: '#EDE7FF',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6535EA',
  },
  cancelTextDark: {
    color: '#B08FFF',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#211054',
    marginBottom: 10,
  },
  sectionTitleDark: {
    color: '#EDE7FF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 6,
  },
  clearAllText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8E7EC2',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: '#F0EAFE',
    borderWidth: 1,
    borderColor: '#D7C7FC',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  tagPillDark: {
    backgroundColor: '#26194E',
    borderColor: '#432C84',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5328D4',
  },
  tagTextDark: {
    color: '#C6ADFF',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(110, 80, 200, 0.12)',
  },
  recentTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E1E66',
  },
  recentTextDark: {
    color: '#D8CCFF',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 10,
    borderRadius: 16,
    marginBottom: 9,
    gap: 12,
  },
  personRowDark: {
    backgroundColor: 'rgba(35, 23, 72, 0.65)',
  },
  personAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  personName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#211054',
  },
  personNameDark: {
    color: '#EDE7FF',
  },
  personHandle: {
    fontSize: 12,
    color: '#7667A5',
  },
  followBtn: {
    backgroundColor: '#6535EA',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12.5,
  },
});

export { SearchBarModal as SearchPage };
