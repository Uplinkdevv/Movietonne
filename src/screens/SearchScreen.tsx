import React, { useState, useEffect } from 'react';
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
import { MediaItem, MediaType } from '../types';
import { MediaCard } from '../components/MediaCard';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Search as SearchIcon, X, SlidersHorizontal, Sparkles } from 'lucide-react-native';

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
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | MediaType>('all');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults = await TmdbService.search(query);
        setResults(searchResults);
      } catch (e) {
        console.warn('[SearchScreen] Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Apply filters
  const filteredResults = results.filter((item) => {
    if (selectedType !== 'all' && item.mediaType !== selectedType) {
      return false;
    }
    if (
      selectedGenre !== 'All' &&
      !item.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search movies, series, anime..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
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
      ) : query.trim().length > 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noResultsText}>No results found for "{query}"</Text>
          <Text style={styles.statusText}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Sparkles size={36} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.discoverHeading}>Discover Anything</Text>
          <Text style={styles.discoverText}>
            Search thousands of movies, television series, and anime with real-time metadata.
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
  searchBarWrapper: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
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
    paddingBottom: SPACING.sm,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
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
    paddingTop: 4,
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
  resultsGrid: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
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
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  discoverHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  discoverText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
