import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const MOODS = [
  { id: 'trending', label: '# trending', isSpecial: true },
  { id: 'happy', label: '😄 Happy' },
  { id: 'chill', label: '😎 Chill' },
  { id: 'hype', label: '🔥 Hype' },
  { id: 'love', label: '💖 Love' },
  { id: 'calm', label: '🌙 Calm' },
];

export default function MoodPills({ isDark }: { isDark?: boolean }) {
  const [selected, setSelected] = useState('trending');

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.pillTrack, isDark && styles.pillTrackDark]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {MOODS.map((mood) => {
            const isSelected = selected === mood.id;

            if (isSelected) {
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => setSelected(mood.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4C2CE6', '#6845FB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activePill}
                  >
                    <Text style={styles.activePillText}>{mood.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={mood.id}
                onPress={() => setSelected(mood.id)}
                activeOpacity={0.7}
                style={styles.inactivePill}
              >
                <Text style={[styles.inactivePillText, isDark && styles.inactivePillTextDark]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  pillTrackDark: {
    backgroundColor: 'rgba(28, 20, 56, 0.65)',
    borderColor: 'rgba(130, 90, 245, 0.35)',
  },
  scrollContent: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  activePill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#4C2CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  inactivePill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 18,
  },
  inactivePillText: {
    color: '#2C1B58',
    fontWeight: '600',
    fontSize: 13,
  },
  inactivePillTextDark: {
    color: '#D8CCFF',
  },
});
