import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface MoodItem {
  id: string;
  label: string;
  isSpecial?: boolean;
  color: string;
  tags: string[];
}

export const MOODS: MoodItem[] = [
  { id: 'trending', label: '# trending', isSpecial: true, color: '#6845FB', tags: [] },
  { id: 'happy',   label: '😄 Happy',   color: '#F59E0B', tags: ['#NatureVibe', '#Hubbing', '#Sunset'] },
  { id: 'chill',   label: '😎 Chill',   color: '#0EA5E9', tags: ['#Tokyo', '#NightWalk', '#RainVibes'] },
  { id: 'hype',    label: '🔥 Hype',    color: '#EF4444', tags: ['#FitnessMotivation', '#MorningRoutine', '#Grind'] },
  { id: 'love',    label: '💖 Love',    color: '#8B5CF6', tags: ['#CoffeeArt', '#Aesthetic'] },
  { id: 'calm',    label: '🌙 Calm',    color: '#8B5CF6', tags: ['#MotionDesign', '#3D', '#CreativeHub'] },
];

export default function MoodPills({
  isDark,
  selectedMood,
  onMoodChange,
}: {
  isDark?: boolean;
  selectedMood?: string;
  onMoodChange?: (id: string) => void;
}) {
  const [internalSelected, setInternalSelected] = useState('trending');
  const selected = selectedMood ?? internalSelected;
  const setSelected = (id: string) => {
    setInternalSelected(id);
    onMoodChange?.(id);
  };

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
