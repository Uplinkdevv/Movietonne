import { create } from 'zustand';
import { MediaItem, PlaybackProgress, StreamSource, StreamQuality } from '../types';
import { StorageService } from '../services/storage';

interface AppState {
  // Watchlist & Progress
  watchlist: MediaItem[];
  continueWatching: PlaybackProgress[];
  
  // Active Playback
  activeMedia: MediaItem | null;
  activeSource: StreamSource | null;
  activeQuality: StreamQuality | null;
  activeSeason: number | null;
  activeEpisode: number | null;
  availableSources: StreamSource[];
  
  // Actions
  loadInitialData: () => Promise<void>;
  toggleWatchlist: (item: MediaItem) => Promise<void>;
  isInWatchlist: (itemId: string) => boolean;
  updateProgress: (progress: PlaybackProgress) => Promise<void>;
  removeProgress: (mediaId: string) => Promise<void>;
  setActivePlayback: (
    media: MediaItem,
    source: StreamSource,
    quality: StreamQuality,
    season?: number,
    episode?: number,
    availableSources?: StreamSource[]
  ) => void;
  clearActivePlayback: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  watchlist: [],
  continueWatching: [],
  activeMedia: null,
  activeSource: null,
  activeQuality: null,
  activeSeason: null,
  activeEpisode: null,
  availableSources: [],

  loadInitialData: async () => {
    const [watchlist, continueWatching] = await Promise.all([
      StorageService.getWatchlist(),
      StorageService.getContinueWatching(),
    ]);
    set({ watchlist, continueWatching });
  },

  toggleWatchlist: async (item: MediaItem) => {
    const { watchlist } = get();
    const exists = watchlist.some((x) => x.id === item.id);
    if (exists) {
      await StorageService.removeFromWatchlist(item.id);
      set({ watchlist: watchlist.filter((x) => x.id !== item.id) });
    } else {
      await StorageService.addToWatchlist(item);
      set({ watchlist: [item, ...watchlist] });
    }
  },

  isInWatchlist: (itemId: string) => {
    return get().watchlist.some((x) => x.id === itemId);
  },

  updateProgress: async (progress: PlaybackProgress) => {
    await StorageService.saveProgress(progress);
    const updated = await StorageService.getContinueWatching();
    set({ continueWatching: updated });
  },

  removeProgress: async (mediaId: string) => {
    await StorageService.removeProgress(mediaId);
    set((state) => ({
      continueWatching: state.continueWatching.filter((x) => x.mediaId !== mediaId),
    }));
  },

  setActivePlayback: (media, source, quality, season, episode, availableSources) => {
    set({
      activeMedia: media,
      activeSource: source,
      activeQuality: quality,
      activeSeason: season ?? null,
      activeEpisode: episode ?? null,
      availableSources: availableSources && availableSources.length > 0 ? availableSources : [source],
    });
  },

  clearActivePlayback: () => {
    set({
      activeMedia: null,
      activeSource: null,
      activeQuality: null,
      activeSeason: null,
      activeEpisode: null,
      availableSources: [],
    });
  },
}));
