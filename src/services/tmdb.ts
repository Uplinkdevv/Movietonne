import { APP_CONFIG } from '../constants/config';
import { StorageService } from './storage';
import { MediaItem, MediaType, Season, Episode, CastMember } from '../types';
import {
  FALLBACK_TRENDING,
  FALLBACK_MOVIES,
  FALLBACK_TV,
  FALLBACK_ANIME,
  ALL_FALLBACK_ITEMS,
  getFallbackEpisodes,
} from './fallbackData';

// Standard TMDB Genre ID to Name Mapping
export const TMDB_GENRES: Record<number, string> = {
  // Movies & Shared
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV specific
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export class TmdbService {
  // Network Health Tracker & Circuit Breaker:
  // If TMDB is blocked (e.g. by ISP) or offline, avoid hanging the UI on every request.
  private static lastOfflineTimestamp: number = 0;
  private static readonly OFFLINE_COOLDOWN_MS = 25000; // 25 seconds cooldown before retrying live TMDB
  private static readonly REQUEST_TIMEOUT_MS = 5000; // 5.0 seconds timeout

  private static isNetworkTemporarilyOffline(): boolean {
    if (this.lastOfflineTimestamp === 0) return false;
    return Date.now() - this.lastOfflineTimestamp < this.OFFLINE_COOLDOWN_MS;
  }

  private static recordNetworkFailure(): void {
    this.lastOfflineTimestamp = Date.now();
  }

  private static recordNetworkSuccess(): void {
    this.lastOfflineTimestamp = 0;
  }

  private static async getApiKeysPool(): Promise<string[]> {
    const customKey = await StorageService.getCustomTmdbKey();
    const configuredKeys = (APP_CONFIG as any).tmdbFallbackApiKeys || [APP_CONFIG.tmdbApiKey];
    if (customKey && customKey.trim()) {
      return [customKey.trim(), ...configuredKeys.filter((k: string) => k !== customKey.trim())];
    }
    return configuredKeys;
  }

  /**
   * Robust HTTP requester with automatic API key rotation and timeout
   */
  private static async fetchWithFailover(endpoint: string): Promise<any> {
    const keys = await this.getApiKeysPool();
    let lastError: Error | null = null;

    for (const key of keys) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${APP_CONFIG.tmdbBaseUrl}${endpoint}${separator}api_key=${key}`;

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          this.recordNetworkSuccess();
          return data;
        }

        // If 401/403 or invalid key, try next key in pool
        if (res.status === 401 || res.status === 403) {
          console.warn(`[TMDB] Key rejected with HTTP ${res.status}, attempting fallback key...`);
          lastError = new Error(`TMDB HTTP ${res.status}`);
          continue;
        }

        throw new Error(`TMDB HTTP ${res.status}`);
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        // If aborted or connection failed, break out to circuit breaker
        if (err.name === 'AbortError') {
          break;
        }
      }
    }

    this.recordNetworkFailure();
    throw lastError || new Error('All TMDB API keys failed');
  }

  /**
   * Safe image URL builder:
   * - If path is already a full URL (e.g. from Wikimedia or custom CDN), returns it directly.
   * - If path is missing, returns a verified high-resolution fallback image.
   * - Ensures leading slash is present.
   */
  static buildImageUrl(path: string | null | undefined, size: string = 'w500'): string {
    if (!path || typeof path !== 'string' || !path.trim()) {
      return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
    }
    const cleanPath = path.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      return cleanPath;
    }
    const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${APP_CONFIG.tmdbImageBaseUrl}/${size}${normalizedPath}`;
  }

  /**
   * Unified MediaItem formatter with automatic genre mapping and anime detection
   */
  static formatMediaItem(raw: any, typeFallback?: MediaType): MediaItem {
    let mediaType: MediaType = raw.media_type || typeFallback || (raw.first_air_date ? 'tv' : 'movie');
    const title = (raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled').trim();
    
    // Resolve genres from raw.genres or TMDB genre_ids
    let genres: string[] = [];
    if (Array.isArray(raw.genres) && raw.genres.length > 0) {
      genres = raw.genres.map((g: any) => (typeof g === 'string' ? g : g?.name || '')).filter(Boolean);
    } else if (Array.isArray(raw.genre_ids) && raw.genre_ids.length > 0) {
      genres = raw.genre_ids.map((id: number) => TMDB_GENRES[id]).filter(Boolean);
    }

    // Auto-detect Anime for Japanese animation
    const isJapanese = raw.original_language === 'ja';
    const hasAnimationGenre = genres.some((g) => g.toLowerCase().includes('animation')) || raw.genre_ids?.includes(16);
    if ((isJapanese && hasAnimationGenre) || typeFallback === 'anime') {
      mediaType = 'anime';
    }

    const voteAverage = typeof raw.vote_average === 'number' && !isNaN(raw.vote_average)
      ? Number(raw.vote_average.toFixed(1))
      : (typeof raw.voteAverage === 'number' ? raw.voteAverage : 0);

    const poster = this.buildImageUrl(raw.poster_path || raw.posterPath, 'w500');
    const backdrop = (raw.backdrop_path || raw.backdropPath)
      ? this.buildImageUrl(raw.backdrop_path || raw.backdropPath, 'original')
      : poster;

    let id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (raw.id) {
      const strId = String(raw.id);
      id = strId.startsWith('tmdb-') || strId.startsWith('open-') || strId.startsWith('custom-')
        ? strId
        : `tmdb-${strId}`;
    }

    return {
      id,
      tmdbId: typeof raw.tmdbId === 'number' ? raw.tmdbId : (typeof raw.id === 'number' ? raw.id : undefined),
      imdbId: raw.imdb_id || raw.imdbId,
      title,
      originalTitle: raw.original_title || raw.original_name || raw.originalTitle || title,
      overview: (raw.overview || 'No synopsis available.').trim(),
      posterPath: poster,
      backdropPath: backdrop,
      mediaType,
      releaseDate: raw.release_date || raw.first_air_date || raw.releaseDate || '',
      voteAverage,
      voteCount: raw.vote_count || raw.voteCount || 0,
      genres,
      seasons: raw.seasons,
      cast: raw.cast,
      trailerUrl: raw.trailerUrl,
    };
  }

  /**
   * Fetch Trending Content (Movies & Shows)
   * Falls back to curated offline catalog if network fails or TMDB is offline.
   */
  static async getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
    if (this.isNetworkTemporarilyOffline()) {
      return FALLBACK_TRENDING;
    }

    try {
      const data = await this.fetchWithFailover(`/trending/all/${timeWindow}`);
      const results = (data.results || [])
        .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map((item: any) => this.formatMediaItem(item));

      if (results.length > 0) {
        return results;
      }
      return FALLBACK_TRENDING;
    } catch (e) {
      console.warn('[TMDB] getTrending offline fallback triggered:', e);
      return FALLBACK_TRENDING;
    }
  }

  /**
   * Fetch Popular Movies
   */
  static async getPopularMovies(page = 1): Promise<MediaItem[]> {
    if (this.isNetworkTemporarilyOffline()) {
      return FALLBACK_MOVIES;
    }

    try {
      const data = await this.fetchWithFailover(`/movie/popular?page=${page}`);
      const results = (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => this.formatMediaItem(item, 'movie'));

      if (results.length > 0) {
        return results;
      }
      return FALLBACK_MOVIES;
    } catch (e) {
      console.warn('[TMDB] getPopularMovies offline fallback triggered:', e);
      return FALLBACK_MOVIES;
    }
  }

  /**
   * Fetch Popular TV Series
   */
  static async getPopularTv(page = 1): Promise<MediaItem[]> {
    if (this.isNetworkTemporarilyOffline()) {
      return FALLBACK_TV;
    }

    try {
      const data = await this.fetchWithFailover(`/tv/popular?page=${page}`);
      const results = (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => this.formatMediaItem(item, 'tv'));

      if (results.length > 0) {
        return results;
      }
      return FALLBACK_TV;
    } catch (e) {
      console.warn('[TMDB] getPopularTv offline fallback triggered:', e);
      return FALLBACK_TV;
    }
  }

  /**
   * Fetch Top Anime
   */
  static async getTopAnime(page = 1): Promise<MediaItem[]> {
    if (this.isNetworkTemporarilyOffline()) {
      return FALLBACK_ANIME;
    }

    try {
      const data = await this.fetchWithFailover(
        `/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200&page=${page}`
      );
      const results = (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => this.formatMediaItem(item, 'anime'));

      if (results.length > 0) {
        return results;
      }
      return FALLBACK_ANIME;
    } catch (e) {
      console.warn('[TMDB] getTopAnime offline fallback triggered:', e);
      return FALLBACK_ANIME;
    }
  }

  /**
   * Offline Catalog Search Helper
   */
  static searchOfflineCatalog(query: string): MediaItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return ALL_FALLBACK_ITEMS.filter((item) => {
      const titleMatch = item.title ? item.title.toLowerCase().includes(q) : false;
      const originalTitleMatch = item.originalTitle ? item.originalTitle.toLowerCase().includes(q) : false;
      const overviewMatch = item.overview ? item.overview.toLowerCase().includes(q) : false;
      const genresMatch = Array.isArray(item.genres)
        ? item.genres.some((g) => g && g.toLowerCase().includes(q))
        : false;

      return titleMatch || originalTitleMatch || overviewMatch || genresMatch;
    });
  }

  /**
   * Search Multi (Movies, Series, Anime) with Instant Zero-Latency Offline Fallback
   */
  static async search(query: string, page = 1): Promise<MediaItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const offlineResults = this.searchOfflineCatalog(query);

    // If TMDB is known to be offline or blocked, immediately serve curated offline catalog without delay
    if (this.isNetworkTemporarilyOffline()) {
      return offlineResults;
    }

    try {
      const encoded = encodeURIComponent(query.trim());
      const data = await this.fetchWithFailover(`/search/multi?query=${encoded}&page=${page}`);
      const liveResults = (data.results || [])
        .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map((item: any) => this.formatMediaItem(item));

      // Merge offline matching items (e.g. Cinema Vault classics) with live results, eliminating duplicates
      const seenIds = new Set<string>();
      const combined: MediaItem[] = [];

      for (const item of liveResults) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combined.push(item);
        }
      }

      for (const item of offlineResults) {
        const key = item.tmdbId ? `tmdb-${item.tmdbId}` : item.id;
        if (!seenIds.has(key) && !seenIds.has(item.id)) {
          seenIds.add(key);
          combined.push(item);
        }
      }

      return combined.length > 0 ? combined : offlineResults;
    } catch (e) {
      console.warn('[TMDB] Search network error, serving offline catalog search:', e);
      return offlineResults;
    }
  }

  /**
   * Fetch Complete Details including Credits, Seasons, and Videos
   */
  static async getDetails(tmdbId: number, mediaType: MediaType): Promise<MediaItem | null> {
    if (this.isNetworkTemporarilyOffline()) {
      const fallback = ALL_FALLBACK_ITEMS.find((m) => m.tmdbId === tmdbId || m.id === `tmdb-${tmdbId}`);
      return fallback || null;
    }

    try {
      const endpointType = mediaType === 'movie' ? 'movie' : 'tv';
      const data = await this.fetchWithFailover(
        `/${endpointType}/${tmdbId}?append_to_response=credits,videos,external_ids`
      );
      
      const cast: CastMember[] = (data.credits?.cast || []).slice(0, 15).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character || 'Self',
        profilePath: c.profile_path ? this.buildImageUrl(c.profile_path, 'w500') : null,
      }));

      const seasons: Season[] = (data.seasons || [])
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          id: s.id,
          seasonNumber: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          episodeCount: s.episode_count || 0,
        }));

      // Trailer
      const trailer = (data.videos?.results || []).find(
        (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

      const formatted = this.formatMediaItem(data, mediaType);
      formatted.cast = cast;
      formatted.seasons = seasons;
      formatted.trailerUrl = trailerUrl;
      formatted.imdbId = data.external_ids?.imdb_id;

      return formatted;
    } catch (e) {
      console.warn('[TMDB] getDetails offline fallback:', e);
      const fallback = ALL_FALLBACK_ITEMS.find((m) => m.tmdbId === tmdbId || m.id === `tmdb-${tmdbId}`);
      return fallback || null;
    }
  }

  /**
   * Fetch Season Episodes
   */
  static async getSeasonEpisodes(tvId: number, seasonNumber: number): Promise<Episode[]> {
    if (this.isNetworkTemporarilyOffline()) {
      return getFallbackEpisodes(tvId, seasonNumber);
    }

    try {
      const data = await this.fetchWithFailover(`/tv/${tvId}/season/${seasonNumber}`);

      return (data.episodes || []).map((ep: any) => ({
        id: ep.id,
        episodeNumber: ep.episode_number,
        seasonNumber: ep.season_number,
        name: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview || '',
        stillPath: ep.still_path ? this.buildImageUrl(ep.still_path, 'w500') : null,
        airDate: ep.air_date,
        durationMinutes: ep.runtime,
      }));
    } catch (e) {
      console.warn('[TMDB] getSeasonEpisodes offline fallback:', e);
      return getFallbackEpisodes(tvId, seasonNumber);
    }
  }
}
