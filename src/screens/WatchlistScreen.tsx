import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { MediaCard } from '../components/MediaCard';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/theme';
import { Bookmark, Trash2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

export const WatchlistScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { watchlist, toggleWatchlist } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Bookmark size={22} color={COLORS.primary} />
          <Text style={styles.title}>My Watchlist</Text>
        </View>
        <Text style={styles.countText}>{watchlist.length} items</Text>
      </View>

      {watchlist.length > 0 ? (
        <FlatList
          data={watchlist}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <MediaCard
                item={item}
                width={CARD_WIDTH}
                height={CARD_WIDTH * 1.5}
                onPress={() => navigation.navigate('Details', { media: item })}
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => toggleWatchlist(item)}
              >
                <Trash2 size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Bookmark size={48} color={COLORS.cardSecondary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
          <Text style={styles.emptyText}>
            Tap the bookmark icon on any movie or TV series to save it for later.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...TYPOGRAPHY.titleMedium,
    fontSize: 22,
  },
  countText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 80,
  },
  cardContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: SPACING.md + 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
