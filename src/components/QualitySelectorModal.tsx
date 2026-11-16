import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { StreamQuality } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Check, Sliders } from 'lucide-react-native';

interface QualitySelectorModalProps {
  visible: boolean;
  qualities: StreamQuality[];
  selectedQuality: StreamQuality | null;
  onSelect: (quality: StreamQuality) => void;
  onClose: () => void;
}

export const QualitySelectorModal: React.FC<QualitySelectorModalProps> = ({
  visible,
  qualities,
  selectedQuality,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.header}>
                <Sliders size={20} color={COLORS.primary} />
                <Text style={styles.title}>Stream Quality</Text>
              </View>

              <View style={styles.list}>
                {qualities.map((q, idx) => {
                  const isSelected = selectedQuality?.quality === q.quality;
                  return (
                    <TouchableOpacity
                      key={`${q.quality}-${idx}`}
                      style={[styles.item, isSelected && styles.itemSelected]}
                      activeOpacity={0.7}
                      onPress={() => {
                        onSelect(q);
                        onClose();
                      }}
                    >
                      <View>
                        <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                          {q.quality}
                        </Text>
                        <Text style={styles.itemSubtext}>
                          {q.isM3u8 ? 'Adaptive HLS Stream' : 'Direct MP4 Stream'}
                        </Text>
                      </View>
                      {isSelected ? <Check size={18} color={COLORS.accent} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 19, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  list: {
    gap: SPACING.xs,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
  },
  itemSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemTextSelected: {
    color: COLORS.accent,
  },
  itemSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
