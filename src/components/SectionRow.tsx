import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { ChevronRight } from 'lucide-react-native';

interface SectionRowProps {
  title: string;
  items: MediaItem[];
  onItemPress: (item: MediaItem) => void;
  onSeeAllPress?: () => void;
  cardWidth?: number;
  cardHeight?: number;
  showRank?: boolean;
}

export const SectionRow: React.FC<SectionRowProps> = ({
  title,
  items,
  onItemPress,
  onSeeAllPress,
  cardWidth = 135,
  cardHeight = 200,
  showRank = false,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAllPress ? (
          <TouchableOpacity
            style={styles.seeAllBtn}
            activeOpacity={0.7}
            onPress={onSeeAllPress}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={14} color={COLORS.accent} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MediaCard
            item={item}
            onPress={onItemPress}
            width={cardWidth}
            height={cardHeight}
            rank={showRank ? index + 1 : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    fontSize: 18,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
  },
});
