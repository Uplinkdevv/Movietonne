import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TmdbService } from '../services/tmdb';
import { PublicDomainProvider } from '../services/providers/publicDomainProvider';
import { ProviderManager } from '../services/providers';
import { MediaItem } from '../types';
import { HeroBanner } from '../components/HeroBanner';
import { SectionRow } from '../components/SectionRow';
import { useAppStore } from '../store/useAppStore';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { Search, Film, PlayCircle, Sparkles, ShieldCheck } from 'lucide-react-native';

type CategoryFilter = 'All' | 'Movies' | 'TV Series' | 'Anime' | 'Cinema Vault';
const CATEGORIES: CategoryFilter[] = ['All', 'Movies', 'TV Series', 'Anime', 'Cinema Vault'];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { continueWatching, setActivePlayback } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Content feeds
  const [heroItem, setHeroItem] = useState<MediaItem | null>(null);
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [popularTv, setPopularTv] = useState<MediaItem[]>([]);
  const [topAnime, setTopAnime] = useState<MediaItem[]>([]);
  const [vaultFilms, setVaultFilms] = useState<MediaItem[]>([]);

  const loadFeeds = async () => {
    try {
      const vaultProvider = new PublicDomainProvider();
      const [trend, movies, tv, anime, vault] = await Promise.all([
        TmdbService.getTrending('week'),
        TmdbService.getPopularMovies(),
        TmdbService.getPopularTv(),
        TmdbService.getTopAnime(),
        vaultProvider.getTrending(),
      ]);

      setTrending(trend);
      setPopularMovies(movies);
      setPopularTv(tv);
      setTopAnime(anime);
      setVaultFilms(vault);

      // Set initial hero based on active category
      if (selectedCategory === 'Cinema Vault' && vault.length > 0) {
        setHeroItem(vault[0]);
      } else if (selectedCategory === 'Movies' && movies.length > 0) {
        setHeroItem(movies[0]);
      } else if (selectedCategory === 'TV Series' && tv.length > 0) {
        setHeroItem(tv[0]);
      } else if (selectedCategory === 'Anime' && anime.length > 0) {
        setHeroItem(anime[0]);
      } else if (trend.length > 0) {
        setHeroItem(trend[0]);
      }
    } catch (e) {
      console.warn('[HomeScreen] Feed load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeeds();
  }, [selectedCategory]);

  const handleCategoryChange = (category: CategoryFilter) => {
    setSelectedCategory(category);
    if (category === 'All' && trending.length > 0) {
      setHeroItem(trending[0]);
    } else if (category === 'Movies' && popularMovies.length > 0) {
      setHeroItem(popularMovies[0]);
    } else if (category === 'TV Series' && popularTv.length > 0) {
      setHeroItem(popularTv[0]);
    } else if (category === 'Anime' && topAnime.length > 0) {
      setHeroItem(topAnime[0]);
    } else if (category === 'Cinema Vault' && vaultFilms.length > 0) {
      setHeroItem(vaultFilms[0]);
    }
  };

  const handleMediaPress = (item: MediaItem) => {
    navigation.navigate('Details', { media: item });
  };

  const handleHeroPlay = async (item: MediaItem) => {
    const streams = await ProviderManager.resolveStreams(item);
    if (streams.length > 0) {
      const activeSource = streams[0];
      const activeQuality = activeSource.qualities[0];
      setActivePlayback(item, activeSource, activeQuality);
      navigation.navigate('Player');
    } else {
      navigation.navigate('Details', { media: item });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing MovieTonee Engine...</Text>
      </View>
    );
  }

  // Filtered feeds for categorized views
  const trendingMovies = trending.filter((m) => m.mediaType === 'movie');
  const trendingTv = trending.filter((m) => m.mediaType === 'tv');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Brand & Category Filter Header */}
      <View style={styles.floatingHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandContainer}>
            <Film size={20} color={COLORS.accent} />
            <Text style={styles.brandTitle}>
              MOVIE<Text style={styles.brandAccent}>TONEE</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.searchIconButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search')}
          >
            <Search size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Top Category Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={styles.categoryBar}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                activeOpacity={0.75}
                onPress={() => handleCategoryChange(cat)}
              >
                {cat === 'Cinema Vault' ? (
                  <Sparkles
                    size={13}
                    color={isSelected ? '#FBBF24' : COLORS.accent}
                    style={{ marginRight: 4 }}
                  />
                ) : null}
                <Text
                  style={[styles.categoryText, isSelected && styles.categoryTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Hero Section */}
        {heroItem && (
          <HeroBanner
            item={heroItem}
            onPlayPress={handleHeroPlay}
            onInfoPress={handleMediaPress}
          />
        )}

        {/* Continue Watching Section (Shown across categories if available) */}
        {continueWatching.length > 0 && selectedCategory === 'All' && (
          <View style={styles.continueSection}>
            <Text style={styles.sectionHeading}>Continue Watching</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.continueList}
            >
              {continueWatching.map((item) => {
                const percent =
                  item.durationMillis > 0
                    ? (item.positionMillis / item.durationMillis) * 100
                    : 0;

                return (
                  <TouchableOpacity
                    key={`cw-${item.mediaId}`}
                    style={styles.continueCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate('Details', {
                        mediaId: item.mediaId,
                        mediaType: item.mediaType,
                      });
                    }}
                  >
                    <Image source={{ uri: item.posterPath }} style={styles.continueThumb} />
                    <View style={styles.continueOverlay}>
                      <PlayCircle size={28} color="#FFFFFF" fill="rgba(0,0,0,0.4)" />
                    </View>
                    <View style={styles.progressBarWrapper}>
                      <View style={[styles.progressBarActive, { width: `${percent}%` }]} />
                    </View>
                    <Text style={styles.continueTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* CATEGORY: ALL */}
        {selectedCategory === 'All' && (
          <>
            <SectionRow
              title="Top 10 Trending This Week"
              items={trending.slice(0, 10)}
              showRank
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Popular Movies"
              items={popularMovies}
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Binge-Worthy TV Series"
              items={popularTv}
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Top Rated Anime"
              items={topAnime}
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Cinema Vault Classics"
              items={vaultFilms}
              onItemPress={handleMediaPress}
            />
          </>
        )}

        {/* CATEGORY: MOVIES */}
        {selectedCategory === 'Movies' && (
          <>
            <SectionRow
              title="Top 10 Movies This Week"
              items={trendingMovies.slice(0, 10)}
              showRank
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Popular Movies"
              items={popularMovies}
              onItemPress={handleMediaPress}
            />

            {trendingMovies.length > 10 && (
              <SectionRow
                title="Trending Blockbusters"
                items={trendingMovies.slice(10)}
                onItemPress={handleMediaPress}
              />
            )}
          </>
        )}

        {/* CATEGORY: TV SERIES */}
        {selectedCategory === 'TV Series' && (
          <>
            <SectionRow
              title="Top 10 TV Shows This Week"
              items={trendingTv.slice(0, 10)}
              showRank
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Binge-Worthy TV Series"
              items={popularTv}
              onItemPress={handleMediaPress}
            />

            {trendingTv.length > 10 && (
              <SectionRow
                title="More Trending Series"
                items={trendingTv.slice(10)}
                onItemPress={handleMediaPress}
              />
            )}
          </>
        )}

        {/* CATEGORY: ANIME */}
        {selectedCategory === 'Anime' && (
          <>
            <SectionRow
              title="Top Rated Anime"
              items={topAnime.slice(0, 10)}
              showRank
              onItemPress={handleMediaPress}
            />

            {topAnime.length > 10 && (
              <SectionRow
                title="Anime Showcase"
                items={topAnime.slice(10)}
                onItemPress={handleMediaPress}
              />
            )}
          </>
        )}

        {/* CATEGORY: CINEMA VAULT */}
        {selectedCategory === 'Cinema Vault' && (
          <>
            <View style={styles.vaultBanner}>
              <View style={styles.vaultBannerHeader}>
                <ShieldCheck size={20} color={COLORS.accent} />
                <Text style={styles.vaultBannerTitle}>MovieTonee Open Cinema Vault</Text>
              </View>
              <Text style={styles.vaultBannerDesc}>
                Preserved public domain classics, Creative Commons cinema, and open-source animated features with high-bitrate streaming.
              </Text>
            </View>

            <SectionRow
              title="Top 10 Vault Classics"
              items={vaultFilms.slice(0, 10)}
              showRank
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Open-Source Animated Films"
              items={vaultFilms.filter((f) => f.genres.includes('Animation'))}
              onItemPress={handleMediaPress}
            />

            <SectionRow
              title="Sci-Fi & Preserved Masterpieces"
              items={vaultFilms.filter((f) => !f.genres.includes('Animation'))}
              onItemPress={handleMediaPress}
            />
          </>
        )}

        <View style={styles.footerSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: 'rgba(7, 10, 19, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandAccent: {
    color: COLORS.accent,
  },
  searchIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryBar: {
    flexGrow: 0,
  },
  categoryScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 104,
  },
  continueSection: {
    marginVertical: SPACING.md,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  continueList: {
    paddingLeft: SPACING.md,
    gap: SPACING.sm,
  },
  continueCard: {
    width: 130,
  },
  continueThumb: {
    width: 130,
    height: 85,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cardSecondary,
  },
  continueOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 130,
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrapper: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  continueTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  vaultBanner: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  vaultBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vaultBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  vaultBannerDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  footerSpacing: {
    height: 80,
  },
});
