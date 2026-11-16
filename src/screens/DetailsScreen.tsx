import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { TmdbService } from '../services/tmdb';
import { PublicDomainProvider } from '../services/providers/publicDomainProvider';
import { ProviderManager } from '../services/providers';
import { StorageService } from '../services/storage';
import { APP_CONFIG } from '../constants/config';
import { MediaItem, Season, Episode, StreamSource, StreamQuality } from '../types';
import { MediaCard } from '../components/MediaCard';
import { useAppStore } from '../store/useAppStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  ArrowLeft,
  Tv,
  Layers,
  Sparkles,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DetailsRouteParams = {
  Details: {
    media?: MediaItem;
    mediaId?: string;
    mediaType?: 'movie' | 'tv' | 'anime';
  };
};

export const DetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<DetailsRouteParams, 'Details'>>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const { isInWatchlist, toggleWatchlist, setActivePlayback } = useAppStore();

  const [media, setMedia] = useState<MediaItem | null>(route.params.media || null);
  const [loading, setLoading] = useState(!route.params.media);
  const [availableStreams, setAvailableStreams] = useState<StreamSource[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);

  // Series details
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Recommendations ("More Like This")
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    const fetchFullDetails = async () => {
      let currentItem: MediaItem | null | undefined = route.params.media;

      if (!currentItem && route.params.mediaId) {
        // Fetch by ID
        const tmdbNum = parseInt(route.params.mediaId.replace('tmdb-', ''), 10);
        if (!isNaN(tmdbNum)) {
          currentItem = await TmdbService.getDetails(tmdbNum, route.params.mediaType || 'movie');
        }
      } else if (currentItem?.tmdbId) {
        // Upgrade partial media item with credits and seasons
        const full = await TmdbService.getDetails(currentItem.tmdbId, currentItem.mediaType);
        if (full) currentItem = full;
      }

      if (currentItem) {
        setMedia(currentItem);
        loadStreamsForMedia(currentItem);
        loadRecommendations(currentItem);

        // If series, load season 1 episodes
        if (currentItem.mediaType !== 'movie' && currentItem.tmdbId) {
          loadEpisodes(currentItem.tmdbId, 1);
        }
      }
      setLoading(false);
    };

    fetchFullDetails();
  }, [route.params.media, route.params.mediaId]);

  const loadStreamsForMedia = async (item: MediaItem, season?: number, episode?: number) => {
    setLoadingStreams(true);
    try {
      const streams = await ProviderManager.resolveStreams(item, season, episode);
      setAvailableStreams(streams);
    } catch (e) {
      console.warn('[DetailsScreen] Stream resolution error:', e);
    } finally {
      setLoadingStreams(false);
    }
  };

  const loadEpisodes = async (tvId: number, seasonNumber: number) => {
    setLoadingEpisodes(true);
    try {
      const eps = await TmdbService.getSeasonEpisodes(tvId, seasonNumber);
      setSeasonEpisodes(eps);
      setSelectedSeason(seasonNumber);
    } catch (e) {
      console.warn('[DetailsScreen] Error loading episodes:', e);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const loadRecommendations = async (item: MediaItem) => {
    setLoadingRecommendations(true);
    try {
      let recs: MediaItem[] = [];

      // If it's a Cinema Vault open item
      if (item.id.startsWith('open-')) {
        const vaultProvider = new PublicDomainProvider();
        const vaultAll = await vaultProvider.getTrending();
        recs = vaultAll.filter((v) => v.id !== item.id);
      } else if (item.tmdbId) {
        // Query TMDB recommendations
        const customKey = await StorageService.getCustomTmdbKey();
        const apiKey = customKey || APP_CONFIG.tmdbApiKey;
        const endpointType = item.mediaType === 'movie' ? 'movie' : 'tv';

        const res = await fetch(
          `${APP_CONFIG.tmdbBaseUrl}/${endpointType}/${item.tmdbId}/recommendations?api_key=${apiKey}&page=1`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            recs = (data.results || [])
              .filter((r: any) => r.poster_path)
              .slice(0, 12)
              .map((r: any) => ({
                id: `tmdb-${r.id}`,
                tmdbId: r.id,
                title: r.title || r.name || 'Untitled',
                originalTitle: r.original_title || r.original_name,
                overview: r.overview || '',
                posterPath: `${APP_CONFIG.tmdbImageBaseUrl}/w500${r.poster_path}`,
                backdropPath: r.backdrop_path
                  ? `${APP_CONFIG.tmdbImageBaseUrl}/original${r.backdrop_path}`
                  : undefined,
                mediaType: item.mediaType,
                releaseDate: r.release_date || r.first_air_date || '',
                voteAverage: Number((r.vote_average || 0).toFixed(1)),
                voteCount: r.vote_count || 0,
                genres: [],
              }));
          }
        }

        // Fallback to /similar if recommendations was empty
        if (recs.length === 0) {
          const simRes = await fetch(
            `${APP_CONFIG.tmdbBaseUrl}/${endpointType}/${item.tmdbId}/similar?api_key=${apiKey}&page=1`
          );
          if (simRes.ok) {
            const simData = await simRes.json();
            if (simData.results && simData.results.length > 0) {
              recs = (simData.results || [])
                .filter((r: any) => r.poster_path)
                .slice(0, 12)
                .map((r: any) => ({
                  id: `tmdb-${r.id}`,
                  tmdbId: r.id,
                  title: r.title || r.name || 'Untitled',
                  originalTitle: r.original_title || r.original_name,
                  overview: r.overview || '',
                  posterPath: `${APP_CONFIG.tmdbImageBaseUrl}/w500${r.poster_path}`,
                  backdropPath: r.backdrop_path
                    ? `${APP_CONFIG.tmdbImageBaseUrl}/original${r.backdrop_path}`
                    : undefined,
                  mediaType: item.mediaType,
                  releaseDate: r.release_date || r.first_air_date || '',
                  voteAverage: Number((r.vote_average || 0).toFixed(1)),
                  voteCount: r.vote_count || 0,
                  genres: [],
                }));
            }
          }
        }
      }

      // If still empty (offline or error), fallback to popular items
      if (recs.length === 0) {
        if (item.mediaType === 'movie') {
          const pop = await TmdbService.getPopularMovies();
          recs = pop.filter((m) => m.id !== item.id).slice(0, 10);
        } else if (item.mediaType === 'anime') {
          const anime = await TmdbService.getTopAnime();
          recs = anime.filter((m) => m.id !== item.id).slice(0, 10);
        } else {
          const tv = await TmdbService.getPopularTv();
          recs = tv.filter((m) => m.id !== item.id).slice(0, 10);
        }
      }

      setRecommendations(recs);
    } catch (e) {
      console.warn('[DetailsScreen] Error loading recommendations:', e);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleRecommendationPress = (recItem: MediaItem) => {
    if ((navigation as any).push) {
      (navigation as any).push('Details', { media: recItem });
    } else {
      navigation.navigate('Details', { media: recItem });
    }
  };

  const handlePlay = async (sourceChoice?: StreamSource, episode?: Episode) => {
    if (!media) return;

    let streams = availableStreams;
    if (!streams || streams.length === 0) {
      setLoadingStreams(true);
      try {
        streams = await ProviderManager.resolveStreams(media, selectedSeason, episode?.episodeNumber || 1);
        setAvailableStreams(streams);
      } catch (e) {
        console.warn('[DetailsScreen] Stream resolution error:', e);
        streams = ProviderManager.getFallbackSources();
      } finally {
        setLoadingStreams(false);
      }
    }

    let targetSource: StreamSource;
    let targetQuality: StreamQuality;

    if (sourceChoice) {
      targetSource = sourceChoice;
      // Auto-select best quality for chosen source
      const autoQ = sourceChoice.qualities.find((q) => q.quality === 'Auto' && (q.isM3u8 || q.url.includes('.m3u8')));
      const fhdQ = sourceChoice.qualities.find((q) => q.quality === '1080p');
      targetQuality = autoQ || fhdQ || sourceChoice.qualities[0];
    } else {
      // Find the best stream across all active providers (prefer adaptive multi-bitrate HLS with Auto/1080p)
      const best = ProviderManager.getBestStream(streams);
      targetSource = best.source;
      targetQuality = best.quality;
    }

    setActivePlayback(
      media,
      targetSource,
      targetQuality,
      selectedSeason,
      episode?.episodeNumber || 1,
      streams
    );

    navigation.navigate('Player');
  };

  if (loading || !media) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isBookmarked = isInWatchlist(media.id);
  const releaseYear = media.releaseDate ? media.releaseDate.split('-')[0] : '';
  const backdrop = media.backdropPath || media.posterPath;
  const bestStreamChoice = availableStreams.length > 0 ? ProviderManager.getBestStream(availableStreams) : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Backdrop Header */}
        <View style={styles.headerImageWrapper}>
          <Image source={{ uri: backdrop }} style={styles.backdropImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(7, 10, 19, 0.4)', 'transparent', COLORS.background]}
            locations={[0, 0.5, 1]}
            style={styles.backdropGradient}
          />

          {/* Top Bar Actions */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => toggleWatchlist(media)}
              >
                {isBookmarked ? (
                  <BookmarkCheck size={20} color={COLORS.accent} />
                ) : (
                  <Bookmark size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content Meta */}
        <View style={styles.contentBody}>
          <Text style={styles.title}>{media.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingText}>{media.voteAverage}</Text>
            </View>
            {releaseYear ? <Text style={styles.metaDot}>•</Text> : null}
            {releaseYear ? <Text style={styles.metaText}>{releaseYear}</Text> : null}
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.typeTag}>{media.mediaType.toUpperCase()}</Text>
          </View>

          {/* Genre Chips */}
          <View style={styles.genreRow}>
            {media.genres.map((g, i) => (
              <View key={`g-${i}`} style={styles.genrePill}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))}
          </View>

          {/* Play CTA Button */}
          <TouchableOpacity
            style={styles.mainPlayBtn}
            activeOpacity={0.85}
            onPress={() => handlePlay()}
          >
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.mainPlayText}>Start Streaming</Text>
            <View style={styles.bestStreamBadgeSmall}>
              <Sparkles size={11} color="#34D399" />
              <Text style={styles.bestStreamBadgeSmallText}>Fast Auto HLS</Text>
            </View>
          </TouchableOpacity>

          {/* Synopsis */}
          <View style={styles.synopsisContainer}>
            <Text style={styles.sectionHeading}>Overview</Text>
            <Text style={styles.overviewText}>{media.overview}</Text>
          </View>

          {/* Stream Servers & Sources Available */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={18} color={COLORS.primary} />
              <Text style={styles.sectionHeading}>Available MovieTonee Sources</Text>
            </View>

            {loadingStreams ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />
            ) : availableStreams.length > 0 ? (
              <View style={styles.streamList}>
                {availableStreams.map((s, idx) => {
                  const isBest =
                    bestStreamChoice?.source.providerId === s.providerId &&
                    bestStreamChoice?.source.serverName === s.serverName;
                  return (
                    <TouchableOpacity
                      key={`stream-${idx}`}
                      style={[styles.streamCard, isBest && styles.streamCardBest]}
                      activeOpacity={0.8}
                      onPress={() => handlePlay(s)}
                    >
                      <View style={{ flex: 1, marginRight: SPACING.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.streamServerName}>{s.serverName}</Text>
                          {isBest && (
                            <View style={styles.recommendedBadge}>
                              <Sparkles size={10} color="#10B981" />
                              <Text style={styles.recommendedBadgeText}>BEST</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.streamProviderName}>Source: {s.providerName}</Text>
                      </View>
                      <View style={styles.qualityPillList}>
                        {s.qualities.map((q, qIdx) => (
                          <View key={`qual-${qIdx}`} style={styles.qualityTag}>
                            <Text style={styles.qualityTagText}>{q.quality}</Text>
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>Resolving optimal media mirrors...</Text>
            )}
          </View>

          {/* Seasons & Episodes Selector (for TV / Anime) */}
          {media.seasons && media.seasons.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Tv size={18} color={COLORS.primary} />
                <Text style={styles.sectionHeading}>Seasons & Episodes</Text>
              </View>

              {/* Season Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seasonScroll}>
                {media.seasons.map((s) => {
                  const isActive = s.seasonNumber === selectedSeason;
                  return (
                    <TouchableOpacity
                      key={`s-${s.seasonNumber}`}
                      style={[styles.seasonChip, isActive && styles.seasonChipActive]}
                      onPress={() => {
                        if (media.tmdbId) loadEpisodes(media.tmdbId, s.seasonNumber);
                      }}
                    >
                      <Text style={[styles.seasonChipText, isActive && styles.seasonChipTextActive]}>
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Episodes List */}
              {loadingEpisodes ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.episodesWrapper}>
                  {seasonEpisodes.map((ep) => (
                    <TouchableOpacity
                      key={`ep-${ep.id}`}
                      style={styles.episodeCard}
                      activeOpacity={0.7}
                      onPress={() => handlePlay(undefined, ep)}
                    >
                      <View style={styles.epLeft}>
                        <Text style={styles.epNumText}>EP {ep.episodeNumber}</Text>
                        <Text style={styles.epTitleText} numberOfLines={1}>
                          {ep.name}
                        </Text>
                      </View>
                      <Play size={16} color={COLORS.accent} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Cast & Crew */}
          {media.cast && media.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Cast & Crew</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
                {media.cast.map((c) => (
                  <View key={`cast-${c.id}`} style={styles.castCard}>
                    {c.profilePath ? (
                      <Image source={{ uri: c.profilePath }} style={styles.castImage} />
                    ) : (
                      <View style={styles.castPlaceholder} />
                    )}
                    <Text style={styles.castName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.castCharacter} numberOfLines={1}>
                      {c.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* More Like This Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Sparkles size={18} color={COLORS.primary} />
              <Text style={styles.sectionHeading}>More Like This</Text>
            </View>

            {loadingRecommendations ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : recommendations.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={recommendations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <MediaCard
                    item={item}
                    width={130}
                    height={195}
                    onPress={handleRecommendationPress}
                  />
                )}
                contentContainerStyle={styles.recommendationsList}
              />
            ) : (
              <Text style={styles.emptyText}>No similar titles found.</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
  },
  headerImageWrapper: {
    width: SCREEN_WIDTH,
    height: 380,
    backgroundColor: COLORS.cardBackground,
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 10, 19, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  contentBody: {
    paddingHorizontal: SPACING.md,
    marginTop: -20,
  },
  title: {
    ...TYPOGRAPHY.titleLarge,
    fontSize: 24,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
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
    fontSize: 13,
  },
  typeTag: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  mainPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  mainPlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bestStreamBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    marginLeft: 6,
  },
  bestStreamBadgeSmallText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  synopsisContainer: {
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  overviewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 6,
  },
  streamList: {
    gap: SPACING.xs,
  },
  streamCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  streamCardBest: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  recommendedBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streamServerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  streamProviderName: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  qualityPillList: {
    flexDirection: 'row',
    gap: 4,
  },
  qualityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  qualityTagText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  seasonScroll: {
    marginVertical: SPACING.sm,
  },
  seasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardSecondary,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seasonChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  seasonChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  seasonChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  episodesWrapper: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  episodeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  epLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  epNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  epTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  castList: {
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  castCard: {
    width: 90,
    alignItems: 'center',
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardSecondary,
    marginBottom: 6,
  },
  castPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    marginBottom: 6,
  },
  castName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  castCharacter: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  recommendationsList: {
    paddingTop: SPACING.xs,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingVertical: 8,
  },
  bottomPadding: {
    height: 60,
  },
});
