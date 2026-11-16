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

export class TmdbService {
  private static async getApiKey(): Promise<string> {
    const customKey = await StorageService.getCustomTmdbKey();
    return customKey || APP_CONFIG.tmdbApiKey;
  }

  private static buildImageUrl(path: string | null | undefined, size: 'w500' | 'original' = 'w500'): string {
    if (!path) {
      return 'https://placehold.jp/24/1e293b/ffffff/300x450.png?text=MovieTonee';
    }
    return `${APP_CONFIG.tmdbImageBaseUrl}/${size}${path}`;
  }

  private static formatMediaItem(raw: any, typeFallback?: MediaType): MediaItem {
    const mediaType: MediaType = raw.media_type || typeFallback || (raw.first_air_date ? 'tv' : 'movie');
    const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
    
    return {
      id: `tmdb-${raw.id}`,
      tmdbId: raw.id,
      title,
      originalTitle: raw.original_title || raw.original_name,
      overview: raw.overview || 'No synopsis available.',
      posterPath: this.buildImageUrl(raw.poster_path, 'w500'),
      backdropPath: raw.backdrop_path ? this.buildImageUrl(raw.backdrop_path, 'original') : undefined,
      mediaType,
      releaseDate: raw.release_date || raw.first_air_date || '',
      voteAverage: Number((raw.vote_average || 0).toFixed(1)),
      voteCount: raw.vote_count || 0,
      genres: (raw.genres || []).map((g: any) => g.name || g),
    };
  }

  /**
   * Fetch Trending Content (Movies & Shows)
   * Falls back to high-resolution curated offline catalog if network fails.
   */
  static async getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${APP_CONFIG.tmdbBaseUrl}/trending/all/${timeWindow}?api_key=${apiKey}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map((item: any) => this.formatMediaItem(item));

      if (results.length > 0) return results;
      return FALLBACK_TRENDING;
    } catch (e) {
      console.warn('[TMDB] Error getting trending, serving curated fallback catalog:', e);
      return FALLBACK_TRENDING;
    }
  }

  /**
   * Fetch Popular Movies
   * Falls back to high-resolution curated offline catalog if network fails.
   */
  static async getPopularMovies(page = 1): Promise<MediaItem[]> {
    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${APP_CONFIG.tmdbBaseUrl}/movie/popular?api_key=${apiKey}&page=${page}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => this.formatMediaItem(item, 'movie'));

      if (results.length > 0) return results;
      return FALLBACK_MOVIES;
    } catch (e) {
      console.warn('[TMDB] Error getting popular movies, serving curated fallback catalog:', e);
      return FALLBACK_MOVIES;
    }
  }

  /**
   * Fetch Popular TV Series
   * Falls back to high-resolution curated offline catalog if network fails.
   */
  static async getPopularTv(page = 1): Promise<MediaItem[]> {
    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${APP_CONFIG.tmdbBaseUrl}/tv/popular?api_key=${apiKey}&page=${page}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => this.formatMediaItem(item, 'tv'));

      if (results.length > 0) return results;
      return FALLBACK_TV;
    } catch (e) {
      console.warn('[TMDB] Error getting popular tv, serving curated fallback catalog:', e);
      return FALLBACK_TV;
    }
  }

  /**
   * Fetch Top Anime (Discover TV with Animation genre ID 16 and Japanese original language)
   * Falls back to high-resolution curated offline catalog if network fails.
   */
  static async getTopAnime(page = 1): Promise<MediaItem[]> {
    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `${APP_CONFIG.tmdbBaseUrl}/discover/tv?api_key=${apiKey}&with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200&page=${page}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => {
          const formatted = this.formatMediaItem(item, 'anime');
          formatted.mediaType = 'anime';
          return formatted;
        });

      if (results.length > 0) return results;
      return FALLBACK_ANIME;
    } catch (e) {
      console.warn('[TMDB] Error getting anime, serving curated fallback catalog:', e);
      return FALLBACK_ANIME;
    }
  }

  /**
   * Search Multi (Movies, Series, Anime) with offline fallback search
   */
  static async search(query: string, page = 1): Promise<MediaItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const encoded = encodeURIComponent(query.trim());
      const res = await fetch(`${APP_CONFIG.tmdbBaseUrl}/search/multi?api_key=${apiKey}&query=${encoded}&page=${page}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
      const results = (data.results || [])
        .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
        .map((item: any) => this.formatMediaItem(item));

      if (results.length > 0) return results;
      // If live search had 0 results, check curated fallback collection
      return ALL_FALLBACK_ITEMS.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        (item.originalTitle && item.originalTitle.toLowerCase().includes(q)) ||
        item.overview.toLowerCase().includes(q) ||
        item.genres.some((g) => g.toLowerCase().includes(q))
      );
    } catch (e) {
      console.warn('[TMDB] Search error, using fallback catalog search:', e);
      return ALL_FALLBACK_ITEMS.filter((item) =>
        item.title.toLowerCase().includes(q) ||
        (item.originalTitle && item.originalTitle.toLowerCase().includes(q)) ||
        item.overview.toLowerCase().includes(q) ||
        item.genres.some((g) => g.toLowerCase().includes(q))
      );
    }
  }

  /**
   * Fetch Complete Details including Credits, Seasons, and Videos
   */
  static async getDetails(tmdbId: number, mediaType: MediaType): Promise<MediaItem | null> {
    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const endpointType = mediaType === 'movie' ? 'movie' : 'tv';
      const res = await fetch(
        `${APP_CONFIG.tmdbBaseUrl}/${endpointType}/${tmdbId}?api_key=${apiKey}&append_to_response=credits,videos,external_ids`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
      
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
      console.warn('[TMDB] Error getting details, checking fallback catalog:', e);
      // Look up in curated fallback catalog
      const fallback = ALL_FALLBACK_ITEMS.find((m) => m.tmdbId === tmdbId);
      if (fallback) {
        return fallback;
      }
      return null;
    }
  }

  /**
   * Fetch Season Episodes
   */
  static async getSeasonEpisodes(tvId: number, seasonNumber: number): Promise<Episode[]> {
    try {
      const apiKey = await this.getApiKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        `${APP_CONFIG.tmdbBaseUrl}/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`TMDB HTTP ${res.status}`);
      const data = await res.json();
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
      console.warn('[TMDB] Error getting season episodes, using fallback episodes:', e);
      return getFallbackEpisodes(tvId, seasonNumber);
    }
  }
}
