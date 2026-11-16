import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MediaItem } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Play, Info, Star } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroBannerProps {
  item: MediaItem;
  onPlayPress: (item: MediaItem) => void;
  onInfoPress: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  item,
  onPlayPress,
  onInfoPress,
}) => {
  const backdrop = item.backdropPath || item.posterPath;
  const year = item.releaseDate ? item.releaseDate.split('-')[0] : '';

  return (
    <View style={styles.container}>
      <Image source={{ uri: backdrop }} style={styles.image} resizeMode="cover" />

      {/* Cinematic Gradient Overlays */}
      <LinearGradient
        colors={['transparent', 'rgba(7, 10, 19, 0.4)', COLORS.background]}
        locations={[0, 0.6, 1]}
        style={styles.gradient}
      />

      {/* Hero Content */}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Star size={12} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{item.voteAverage}</Text>
          </View>
          {year ? <Text style={styles.metaDot}>•</Text> : null}
          {year ? <Text style={styles.metaText}>{year}</Text> : null}
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaBadge}>{item.mediaType.toUpperCase()}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.overview} numberOfLines={2}>
          {item.overview}
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.85}
            onPress={() => onPlayPress(item)}
          >
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.playButtonText}>Play Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoButton}
            activeOpacity={0.85}
            onPress={() => onInfoPress(item)}
          >
            <Info size={18} color="#F8FAFC" />
            <Text style={styles.infoButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: 440,
    backgroundColor: COLORS.cardBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  ratingText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  metaDot: {
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  metaBadge: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
