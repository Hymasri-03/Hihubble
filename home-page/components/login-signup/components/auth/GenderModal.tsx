import React from 'react';
import { View, Text, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GENDER_OPTIONS } from '../../constants/auth';
import { COLORS } from '../../constants/colors';

interface GenderModalProps {
  visible: boolean;
  selectedGender: string;
  onSelect: (gender: string) => void;
  onClose: () => void;
}

export default function GenderModal({
  visible,
  selectedGender,
  onSelect,
  onClose,
}: GenderModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Gender</Text>
          <FlatList
            data={GENDER_OPTIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalOption}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{item}</Text>
                {selectedGender === item && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.PURPLE} />
                )}
              </Pressable>
            )}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(76, 29, 149, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: 320,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0FC',
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
});
