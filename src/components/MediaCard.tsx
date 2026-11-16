import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MediaItem } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Star } from 'lucide-react-native';

interface MediaCardProps {
  item: MediaItem;
  onPress: (item: MediaItem) => void;
  width?: number;
  height?: number;
  rank?: number;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onPress,
  width = 140,
  height = 210,
  rank,
}) => {
  const releaseYear = item.releaseDate ? item.releaseDate.split('-')[0] : '';
  const isRanked = rank !== undefined && rank > 0;

  return (
    <TouchableOpacity
      style={[styles.container, { width }]}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      <View style={[styles.imageWrapper, { height }]}>
        <Image
          source={{ uri: item.posterPath }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Cinema Top 10 Rank Badge & Large Stylized Number Overlay */}
        {isRanked && (
          <>
            <View style={styles.top10Badge}>
              <Text style={styles.top10Text}>TOP</Text>
              <Text style={styles.top10Number}>{rank <= 10 ? '10' : rank}</Text>
            </View>

            <View style={styles.rankContainer} pointerEvents="none">
              <Text style={styles.rankNumber}>{rank}</Text>
            </View>
          </>
        )}

        {/* Rating Badge */}
        {item.voteAverage > 0 && (
          <View style={styles.ratingBadge}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{item.voteAverage}</Text>
          </View>
        )}

        {/* Media Type Chip */}
        <View style={[styles.typeBadge, isRanked && styles.typeBadgeRanked]}>
          <Text style={styles.typeText}>{item.mediaType}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>

      {releaseYear ? (
        <Text style={styles.subtitle}>{releaseYear}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: SPACING.md,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  top10Badge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: '#E11D48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  top10Text: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  top10Number: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '900',
  },
  rankContainer: {
    position: 'absolute',
    bottom: -8,
    left: 2,
    zIndex: 10,
  },
  rankNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -3,
    includeFontPadding: false,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 1, height: 3 },
    textShadowRadius: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 5,
  },
  ratingText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 5,
  },
  typeBadgeRanked: {
    left: undefined,
    right: SPACING.xs,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: SPACING.xs,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
