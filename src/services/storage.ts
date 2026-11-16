import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';
import { MediaItem, PlaybackProgress } from '../types';

export class StorageService {
  /**
   * Watchlist Operations
   */
  static async getWatchlist(): Promise<MediaItem[]> {
    try {
      const data = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('[Storage] Error reading watchlist:', e);
      return [];
    }
  }

  static async addToWatchlist(item: MediaItem): Promise<void> {
    try {
      const current = await this.getWatchlist();
      if (!current.some((x) => x.id === item.id)) {
        const updated = [item, ...current];
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[Storage] Error adding to watchlist:', e);
    }
  }

  static async removeFromWatchlist(itemId: string): Promise<void> {
    try {
      const current = await this.getWatchlist();
      const filtered = current.filter((x) => x.id !== itemId);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.WATCHLIST, JSON.stringify(filtered));
    } catch (e) {
      console.warn('[Storage] Error removing from watchlist:', e);
    }
  }

  static async isInWatchlist(itemId: string): Promise<boolean> {
    const list = await this.getWatchlist();
    return list.some((x) => x.id === itemId);
  }

  /**
   * Continue Watching / Progress Tracking
   */
  static async getContinueWatching(): Promise<PlaybackProgress[]> {
    try {
      const data = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.CONTINUE_WATCHING);
      const list: PlaybackProgress[] = data ? JSON.parse(data) : [];
      // Sort most recent first
      return list.sort((a, b) => b.lastWatchedTimestamp - a.lastWatchedTimestamp);
    } catch (e) {
      console.warn('[Storage] Error reading continue watching:', e);
      return [];
    }
  }

  static async saveProgress(progress: PlaybackProgress): Promise<void> {
    try {
      const list = await this.getContinueWatching();
      // Remove existing record for this media (or update)
      const filtered = list.filter((x) => x.mediaId !== progress.mediaId);
      
      // If position is near the end (>95%), treat as completed and don't re-add
      const isCompleted = progress.durationMillis > 0 && progress.positionMillis / progress.durationMillis > 0.95;
      
      if (!isCompleted) {
        filtered.unshift(progress);
      }
      
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(filtered.slice(0, 30)));
    } catch (e) {
      console.warn('[Storage] Error saving progress:', e);
    }
  }

  static async removeProgress(mediaId: string): Promise<void> {
    try {
      const list = await this.getContinueWatching();
      const filtered = list.filter((x) => x.mediaId !== mediaId);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(filtered));
    } catch (e) {
      console.warn('[Storage] Error removing progress:', e);
    }
  }

  /**
   * User Settings
   */
  static async getCustomTmdbKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.CUSTOM_TMDB_KEY);
    } catch {
      return null;
    }
  }

  static async setCustomTmdbKey(key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.CUSTOM_TMDB_KEY, key.trim());
    } catch (e) {
      console.warn('[Storage] Error saving custom TMDB key:', e);
    }
  }
}
