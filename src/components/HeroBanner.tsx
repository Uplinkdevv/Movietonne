import React, { useState, useEffect } from 'react';
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
import { Play, Info, Star, Film } from 'lucide-react-native';

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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.id]);

  const backdrop = item.backdropPath || item.posterPath;
  const year = item.releaseDate && typeof item.releaseDate === 'string'
    ? item.releaseDate.split('-')[0]
    : '';
  const mediaType = (item.mediaType || 'movie').toUpperCase();
  const rating = typeof item.voteAverage === 'number' && item.voteAverage > 0
    ? item.voteAverage
    : null;
  const hasValidBackdrop = !!backdrop && !imageError;

  return (
    <View style={styles.container}>
      {hasValidBackdrop ? (
        <Image
          source={{ uri: backdrop }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <LinearGradient
          colors={['#1e1b4b', '#0f172a', '#070A13']}
          style={styles.image}
        >
          <View style={styles.fallbackCenter}>
            <Film size={48} color={COLORS.primary} />
          </View>
        </LinearGradient>
      )}

      {/* Cinematic Gradient Overlays */}
      <LinearGradient
        colors={['transparent', 'rgba(7, 10, 19, 0.45)', COLORS.background]}
        locations={[0, 0.55, 1]}
        style={styles.gradient}
      />

      {/* Hero Content */}
      <View style={styles.content}>
        <View style={styles.metaRow}>
          {rating ? (
            <View style={styles.ratingBox}>
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}
          {rating && year ? <Text style={styles.metaDot}>•</Text> : null}
          {year ? <Text style={styles.metaText}>{year}</Text> : null}
          {year ? <Text style={styles.metaDot}>•</Text> : null}
          <Text style={styles.metaBadge}>{mediaType}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title || 'Featured Title'}
        </Text>

        {item.overview ? (
          <Text style={styles.overview} numberOfLines={2}>
            {item.overview}
          </Text>
        ) : null}

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
  fallbackCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
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
    gap: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  metaDot: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metaBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  overview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playButton: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoButton: {
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
});
