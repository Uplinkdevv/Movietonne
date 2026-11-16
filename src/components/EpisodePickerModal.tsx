import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Season, Episode } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { X, PlayCircle, Film } from 'lucide-react-native';

interface EpisodePickerModalProps {
  visible: boolean;
  seasons: Season[];
  currentSeasonNumber: number;
  currentEpisodeNumber: number;
  onSelectEpisode: (seasonNumber: number, episode: Episode) => void;
  onClose: () => void;
}

export const EpisodePickerModal: React.FC<EpisodePickerModalProps> = ({
  visible,
  seasons,
  currentSeasonNumber,
  currentEpisodeNumber,
  onSelectEpisode,
  onClose,
}) => {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(
    currentSeasonNumber || (seasons[0]?.seasonNumber ?? 1)
  );

  const activeSeason = seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0];
  const episodes = activeSeason?.episodes || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Film size={20} color={COLORS.primary} />
              <Text style={styles.title}>Select Episode</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Season Selector Tabs */}
          {seasons.length > 1 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={seasons}
              keyExtractor={(item) => `season-${item.seasonNumber}`}
              renderItem={({ item }) => {
                const isActive = item.seasonNumber === selectedSeasonNumber;
                return (
                  <TouchableOpacity
                    style={[styles.seasonTab, isActive && styles.seasonTabActive]}
                    onPress={() => setSelectedSeasonNumber(item.seasonNumber)}
                  >
                    <Text style={[styles.seasonTabText, isActive && styles.seasonTabTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.seasonList}
            />
          )}

          {/* Episode List */}
          <FlatList
            data={episodes}
            keyExtractor={(ep) => `ep-${ep.seasonNumber}-${ep.episodeNumber}`}
            renderItem={({ item }) => {
              const isCurrent =
                item.seasonNumber === currentSeasonNumber &&
                item.episodeNumber === currentEpisodeNumber;

              return (
                <TouchableOpacity
                  style={[styles.episodeItem, isCurrent && styles.episodeItemActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectEpisode(selectedSeasonNumber, item);
                    onClose();
                  }}
                >
                  <View style={styles.thumbnailWrapper}>
                    {item.stillPath ? (
                      <Image source={{ uri: item.stillPath }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <Film size={24} color={COLORS.textMuted} />
                      </View>
                    )}
                    <View style={styles.playOverlay}>
                      <PlayCircle
                        size={22}
                        color={isCurrent ? COLORS.accent : '#FFFFFF'}
                        fill={isCurrent ? COLORS.accent : 'rgba(0,0,0,0.4)'}
                      />
                    </View>
                  </View>

                  <View style={styles.episodeInfo}>
                    <Text style={styles.epNumber}>
                      E{item.episodeNumber} • {item.durationMinutes ? `${item.durationMinutes}m` : 'TV'}
                    </Text>
                    <Text style={[styles.epTitle, isCurrent && styles.epTitleActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.epOverview} numberOfLines={2}>
                      {item.overview || 'No description available for this episode.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.episodeList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Loading episodes...</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 19, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '75%',
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  seasonList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  seasonTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seasonTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  seasonTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  seasonTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  episodeList: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  episodeItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  episodeItemActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  thumbnailWrapper: {
    width: 110,
    height: 75,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  episodeInfo: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  epNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 2,
  },
  epTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  epTitleActive: {
    color: COLORS.accent,
  },
  epOverview: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
