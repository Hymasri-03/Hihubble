import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { TabType, ThemeMode } from '../types/profile';

export interface TabsRowProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  themeMode: ThemeMode;
  hubsCount?: number;
  hubbersCount?: number;
  hubbiesCount?: number;
  taggedCount?: number;
}

export const TabsRow = ({
  activeTab,
  onSelectTab,
  themeMode,
  hubsCount,
  hubbersCount,
  hubbiesCount,
  taggedCount,
}: TabsRowProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const tabs: {
    key: TabType;
    label: string;
    icon: any;
    count?: number;
  }[] = [
    { key: 'hubs', label: 'YOUR HUBS', icon: 'images-outline', count: hubsCount },
    { key: 'hubclips', label: 'Hubclips', icon: 'videocam-outline' },
    { key: 'saved', label: 'Saved Hubbs', icon: 'bookmark-outline' },
    { key: 'tagged', label: 'Tagged', icon: 'pricetag-outline', count: taggedCount },
    { key: 'hubbers', label: 'Hubbers', icon: 'people-outline', count: hubbersCount },
    { key: 'hubbies', label: 'Hubbies', icon: 'heart-outline', count: hubbiesCount },
  ];

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive ? BRAND_COLORS.purplePrimary : colors.tabInactive;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.key)}
              style={styles.tabItem}
            >
              <View style={styles.tabHeaderRow}>
                <Ionicons name={tab.icon} size={18} color={color} />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isActive
                          ? BRAND_COLORS.purplePrimary
                          : colors.badgeBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: isActive ? '#FFFFFF' : colors.textMuted },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>

              {/* Active Indicator Bar matching screenshot */}
              {isActive ? (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: BRAND_COLORS.purplePrimary },
                  ]}
                />
              ) : (
                <View style={styles.inactiveSpacer} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  tabItem: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginLeft: 1,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  activeIndicator: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    marginTop: 10,
  },
  inactiveSpacer: {
    height: 3,
    marginTop: 10,
  },
});

export default TabsRow;
