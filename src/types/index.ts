export type MediaType = 'movie' | 'tv' | 'anime';

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string | null;
}

export interface Episode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillPath?: string | null;
  airDate?: string;
  durationMinutes?: number;
}

export interface Season {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  episodes?: Episode[];
}

export interface MediaItem {
  id: string; // Unified string identifier (e.g., tmdb-12345)
  tmdbId?: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string;
  backdropPath?: string;
  mediaType: MediaType;
  releaseDate?: string;
  voteAverage: number;
  voteCount?: number;
  genres: string[];
  seasons?: Season[];
  cast?: CastMember[];
  trailerUrl?: string;
}

export interface StreamQuality {
  quality: '360p' | '480p' | '720p' | '1080p' | '4K' | 'Auto';
  url: string;
  isM3u8: boolean;
  bitrate?: number;
}

export interface StreamSource {
  providerId: string;
  providerName: string;
  serverName: string;
  qualities: StreamQuality[];
  subtitles?: {
    lang: string;
    url: string;
    label: string;
  }[];
  headers?: Record<string, string>;
}

export interface PlaybackProgress {
  mediaId: string;
  title: string;
  posterPath: string;
  mediaType: MediaType;
  positionMillis: number;
  durationMillis: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  lastWatchedTimestamp: number;
}

export type ProviderCategory = 'global' | 'india' | 'english' | 'anime' | 'italy';

export interface ProviderItem {
  id: string;
  value: string;
  name: string;
  version: string;
  icon: string;
  category: ProviderCategory;
  baseUrl: string;
  disabledByDefault: boolean;
  userEnabled: boolean;
  hasSettings: boolean;
  description?: string;
}

export interface MediaProvider {
  id: string;
  name: string;
  version: string;
  description: string;
  isEnabled: boolean;
  category?: ProviderCategory;
  icon?: string;
  baseUrl?: string;
  hasSettings?: boolean;
  search(query: string): Promise<MediaItem[]>;
  getTrending(type?: MediaType): Promise<MediaItem[]>;
  getDetails(id: string): Promise<MediaItem | null>;
  getStreams(mediaId: string, season?: number, episode?: number): Promise<StreamSource[]>;
}
