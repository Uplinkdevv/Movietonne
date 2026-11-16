import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Check, Gauge } from 'lucide-react-native';

interface SpeedOption {
  value: number;
  label: string;
}

const SPEED_OPTIONS: SpeedOption[] = [
  { value: 0.75, label: '0.75x (Slow)' },
  { value: 1.0, label: '1.0x (Normal)' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x (Fast)' },
  { value: 2.0, label: '2.0x (Double Speed)' },
];

interface SpeedSelectorModalProps {
  visible: boolean;
  selectedSpeed: number;
  onSelect: (speed: number) => void;
  onClose: () => void;
}

export const SpeedSelectorModal: React.FC<SpeedSelectorModalProps> = ({
  visible,
  selectedSpeed,
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
                <Gauge size={20} color={COLORS.primary} />
                <Text style={styles.title}>Playback Speed</Text>
              </View>

              <View style={styles.list}>
                {SPEED_OPTIONS.map((opt) => {
                  const isSelected = selectedSpeed === opt.value;
                  return (
                    <TouchableOpacity
                      key={`speed-${opt.value}`}
                      style={[styles.item, isSelected && styles.itemSelected]}
                      activeOpacity={0.7}
                      onPress={() => {
                        onSelect(opt.value);
                        onClose();
                      }}
                    >
                      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                        {opt.label}
                      </Text>
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
    maxWidth: 340,
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
});
