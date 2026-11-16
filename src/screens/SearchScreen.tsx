import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TmdbService } from '../services/tmdb';
import { ALL_FALLBACK_ITEMS } from '../services/fallbackData';
import { MediaItem, MediaType } from '../types';
import { MediaCard } from '../components/MediaCard';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Search as SearchIcon, X, Sparkles, RotateCcw } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

const GENRE_FILTERS = [
  'All',
  'Action',
  'Animation',
  'Comedy',
  'Drama',
  'Sci-Fi',
  'Horror',
  'Thriller',
  'Fantasy',
  'Adventure',
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>(() => ALL_FALLBACK_ITEMS.slice(0, 20));
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | MediaType>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const searchCounterRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(ALL_FALLBACK_ITEMS.slice(0, 20));
      setLoading(false);
      return;
    }

    const currentSearchId = ++searchCounterRef.current;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const searchResults = await TmdbService.search(trimmed);
        if (searchCounterRef.current === currentSearchId) {
          setResults(searchResults);
        }
      } catch (e) {
        console.warn('[SearchScreen] Search error:', e);
        if (searchCounterRef.current === currentSearchId) {
          setResults(TmdbService.searchOfflineCatalog(trimmed));
        }
      } finally {
        if (searchCounterRef.current === currentSearchId) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Robust, flexible genre matching
  const isGenreMatch = (itemGenres: string[] | undefined, filter: string): boolean => {
    if (filter === 'All') return true;
    if (!Array.isArray(itemGenres) || itemGenres.length === 0) return false;

    const f = filter.toLowerCase().trim();
    return itemGenres.some((g) => {
      if (!g || typeof g !== 'string') return false;
      const gl = g.toLowerCase().trim();
      if (gl === f) return true;
      if (f === 'sci-fi' && (gl === 'science fiction' || gl.includes('sci-fi') || gl.includes('science fiction'))) return true;
      if (f === 'action' && gl.includes('action')) return true;
      if (f === 'adventure' && gl.includes('adventure')) return true;
      if (f === 'fantasy' && (gl.includes('fantasy') || gl === 'sci-fi & fantasy')) return true;
      if (f === 'animation' && (gl === 'animation' || gl === 'anime')) return true;
      return false;
    });
  };

  // Accurate format matching
  const isTypeMatch = (item: MediaItem, typeFilter: 'all' | MediaType): boolean => {
    if (typeFilter === 'all') return true;

    const isSeries = (Array.isArray(item.seasons) && item.seasons.length > 0) || item.mediaType === 'tv';

    if (typeFilter === 'movie') {
      // Matches standard movies, or anime movies (not episodic series)
      if (item.mediaType === 'movie') return true;
      if (item.mediaType === 'anime' && !isSeries) return true;
      return false;
    }

    if (typeFilter === 'tv') {
      // Matches standard TV series, or anime series
      if (item.mediaType === 'tv') return true;
      if (item.mediaType === 'anime' && isSeries) return true;
      return false;
    }

    if (typeFilter === 'anime') {
      if (item.mediaType === 'anime') return true;
      const isJapanese = item.originalTitle && /[一-龠ぁ-ゔァ-ヴー]/.test(item.originalTitle);
      const isAnim = Array.isArray(item.genres) && item.genres.some((g) => g.toLowerCase() === 'animation');
      return Boolean(isJapanese && isAnim);
    }

    return item.mediaType === typeFilter;
  };

  // Apply filters
  const filteredResults = results.filter((item) => {
    return isTypeMatch(item, selectedType) && isGenreMatch(item.genres, selectedGenre);
  });

  const handleResetFilters = () => {
    setSelectedType('all');
    setSelectedGenre('All');
    setQuery('');
  };

  const isBrowsingPopular = !query.trim();

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search movies, series, anime, vault..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        {/* Media Type Chips */}
        <View style={styles.typeRow}>
          {(['all', 'movie', 'tv', 'anime'] as const).map((t) => {
            const active = selectedType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, active && styles.typeChipActive]}
                onPress={() => setSelectedType(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                  {t === 'all' ? 'All Formats' : t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Genre Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GENRE_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const active = selectedGenre === item;
            return (
              <TouchableOpacity
                style={[styles.genreChip, active && styles.genreChipActive]}
                onPress={() => setSelectedGenre(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.genreChipText, active && styles.genreChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.genreList}
        />
      </View>

      {/* Status Bar / Header */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {isBrowsingPopular ? 'Discover & Trending Picks' : `Results for "${query.trim()}"`}
        </Text>
        <Text style={styles.countText}>{filteredResults.length} items</Text>
      </View>

      {/* Results Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>Searching MovieTonee Index...</Text>
        </View>
      ) : filteredResults.length > 0 ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <MediaCard
              item={item}
              width={CARD_WIDTH}
              height={CARD_WIDTH * 1.5}
              onPress={() => navigation.navigate('Details', { media: item })}
            />
          )}
          contentContainerStyle={styles.resultsGrid}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Sparkles size={36} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.noResultsText}>No titles match your selection</Text>
          <Text style={styles.statusText}>
            Try adjusting your search query, format, or genre filters.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters} activeOpacity={0.8}>
            <RotateCcw size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.resetBtnText}>Reset Search & Filters</Text>
          </TouchableOpacity>
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
  searchBarWrapper: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  filtersWrapper: {
    paddingBottom: SPACING.xs,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  genreList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    paddingTop: 2,
    paddingBottom: 4,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  genreChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  genreChipTextActive: {
    color: '#070A13',
    fontWeight: '700',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  subHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resultsGrid: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
