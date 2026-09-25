import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { ProfileStats, ThemeMode, TabType } from '../types/profile';

export interface StatsRowProps {
  stats: ProfileStats;
  themeMode: ThemeMode;
  onPressStat?: (type: TabType | 'likes') => void;
}

export const StatsRow = ({
  stats,
  themeMode,
  onPressStat,
}: StatsRowProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  return (
    <View style={styles.container}>
      {/* Card 1: YOUR HUBS */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPressStat?.('hubs')}
        style={[
          styles.statCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.statNumber, { color: colors.statNumber }]}>
          {stats.hubs}
        </Text>
        <Text style={[styles.statLabelLine, { color: colors.textMuted }]}>
          YOUR
        </Text>
        <Text style={[styles.statLabelLine, { color: colors.textMuted }]}>
          HUBS
        </Text>
      </TouchableOpacity>

      {/* Card 2: HUBBERS */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPressStat?.('hubbers')}
        style={[
          styles.statCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.statNumber, { color: colors.statNumber }]}>
          {stats.hubbers}
        </Text>
        <Text style={[styles.statLabelSingle, { color: colors.textMuted }]}>
          HUBBERS
        </Text>
      </TouchableOpacity>

      {/* Card 3: HUBBIES */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPressStat?.('hubbies')}
        style={[
          styles.statCard,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.statNumber, { color: colors.statNumber }]}>
          {stats.hubbies}
        </Text>
        <Text style={[styles.statLabelSingle, { color: colors.textMuted }]}>
          HUBBIES
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.2,
    minHeight: 54,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 0,
  },
  statLabelLine: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 11,
  },
  statLabelSingle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 1,
  },
});

export default StatsRow;
