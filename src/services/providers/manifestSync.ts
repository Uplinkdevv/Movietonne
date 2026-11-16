import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProviderItem, ProviderCategory } from '../../types';
import { BUNDLED_PROVIDERS } from './manifestData';

const STORAGE_KEY_USER_STATE = '@movietonee/providers_user_state';
const STORAGE_KEY_CACHED_MANIFEST = '@movietonee/providers_cached_manifest';
const STORAGE_KEY_LAST_SYNC = '@movietonee/providers_last_sync';

const REMOTE_MANIFEST_URL = 'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/main/manifest.json';
const REMOTE_URLS_URL = 'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/main/urls.json';
const REMOTE_URLS_BACKUP_URL = 'https://raw.githubusercontent.com/Anshu78780/json/main/providers.json';

const VALID_CATEGORIES = new Set<ProviderCategory>(['global', 'india', 'english', 'anime', 'italy']);

export class ManifestSyncService {
  private static listeners: Array<(providers: ProviderItem[]) => void> = [];
  private static cachedProviders: ProviderItem[] | null = null;
  private static inMemoryUserState: Record<string, boolean> | null = null;
  private static inMemoryManifest: ProviderItem[] | null = null;
  private static initPromise: Promise<void> | null = null;
  private static persistencePromise: Promise<void> = Promise.resolve();

  /**
   * Subscribe to provider state changes
   */
  static subscribe(listener: (providers: ProviderItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(providers: ProviderItem[]): void {
    this.cachedProviders = providers;
    const currentListeners = [...this.listeners];
    for (const listener of currentListeners) {
      try {
        listener(providers);
      } catch (e) {
        console.warn('[ManifestSyncService] Listener callback error:', e);
      }
    }
  }

  /**
   * Sequential background persistence queue to eliminate AsyncStorage race conditions
   */
  private static enqueuePersistence(key: string, value: string | null): void {
    this.persistencePromise = this.persistencePromise.then(async () => {
      try {
        if (value === null) {
          await AsyncStorage.removeItem(key);
        } else {
          await AsyncStorage.setItem(key, value);
        }
      } catch (e) {
        console.error(`[ManifestSyncService] Error persisting storage key ${key}:`, e);
      }
    });
  }

  /**
   * Ensure user toggles and cached manifest are loaded from storage once into memory
   */
  private static async ensureInitialized(): Promise<void> {
    if (this.inMemoryUserState !== null && this.inMemoryManifest !== null) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          // 1. Load user custom toggle states (id -> boolean)
          const userStateRaw = await AsyncStorage.getItem(STORAGE_KEY_USER_STATE);
          this.inMemoryUserState = userStateRaw ? JSON.parse(userStateRaw) : {};
        } catch (e) {
          console.warn('[ManifestSyncService] Error reading user state, initializing empty:', e);
          this.inMemoryUserState = {};
        }

        try {
          // 2. Load synced manifest if available and valid
          const cachedManifestRaw = await AsyncStorage.getItem(STORAGE_KEY_CACHED_MANIFEST);
          if (cachedManifestRaw) {
            const parsed = JSON.parse(cachedManifestRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.inMemoryManifest = parsed;
            } else {
              this.inMemoryManifest = [...BUNDLED_PROVIDERS];
            }
          } else {
            this.inMemoryManifest = [...BUNDLED_PROVIDERS];
          }
        } catch (e) {
          console.warn('[ManifestSyncService] Error reading cached manifest, using bundled:', e);
          this.inMemoryManifest = [...BUNDLED_PROVIDERS];
        }
      })();
    }

    await this.initPromise;
  }

  /**
   * Recompute merged provider items from manifest and user enable/disable toggles
   */
  private static buildMergedProviders(): ProviderItem[] {
    const base = this.inMemoryManifest || BUNDLED_PROVIDERS;
    const userState = this.inMemoryUserState || {};

    return base.map((p) => {
      const customEnabled = userState[p.id];
      return {
        ...p,
        userEnabled: customEnabled !== undefined ? customEnabled : !p.disabledByDefault,
      };
    });
  }

  /**
   * Retrieve all providers (cached/bundled) merged with user enable/disable toggles
   */
  static async getProviders(): Promise<ProviderItem[]> {
    if (this.cachedProviders) {
      return this.cachedProviders;
    }

    await this.ensureInitialized();
    const merged = this.buildMergedProviders();
    this.cachedProviders = merged;
    return merged;
  }

  /**
   * Toggle a single provider on or off with atomic in-memory mutation
   */
  static async toggleProvider(id: string, isEnabled: boolean): Promise<ProviderItem[]> {
    await this.ensureInitialized();

    // Mutate in-memory synchronously to prevent race conditions
    this.inMemoryUserState![id] = isEnabled;
    const updated = this.buildMergedProviders();
    this.notifyListeners(updated);

    // Enqueue sequential persistence
    this.enqueuePersistence(STORAGE_KEY_USER_STATE, JSON.stringify(this.inMemoryUserState));

    return updated;
  }

  /**
   * Bulk enable or disable providers (all, or an optional target subset)
   */
  static async setAllProviders(enable: boolean, targetIds?: string[]): Promise<ProviderItem[]> {
    await this.ensureInitialized();

    const base = this.inMemoryManifest || BUNDLED_PROVIDERS;
    const targetSet = targetIds ? new Set(targetIds) : null;

    for (const p of base) {
      if (!targetSet || targetSet.has(p.id)) {
        this.inMemoryUserState![p.id] = enable;
      }
    }

    const updated = this.buildMergedProviders();
    this.notifyListeners(updated);

    // Enqueue sequential persistence
    this.enqueuePersistence(STORAGE_KEY_USER_STATE, JSON.stringify(this.inMemoryUserState));

    return updated;
  }

  /**
   * Reset providers to their defaults from manifest
   */
  static async resetToDefaults(): Promise<ProviderItem[]> {
    await this.ensureInitialized();

    this.inMemoryUserState = {};
    this.inMemoryManifest = [...BUNDLED_PROVIDERS];
    this.cachedProviders = null;

    // Remove persistence from storage
    this.enqueuePersistence(STORAGE_KEY_USER_STATE, null);
    this.enqueuePersistence(STORAGE_KEY_CACHED_MANIFEST, null);

    const resetProviders = this.buildMergedProviders();
    this.notifyListeners(resetProviders);

    return resetProviders;
  }

  /**
   * Synchronize live provider manifest and endpoint base URLs from GitHub
   */
  static async syncRemoteManifest(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Fetch manifest and URLs concurrently
      let manifestRes: PromiseSettledResult<Response>;
      let urlsRes: PromiseSettledResult<Response>;
      let backupUrlsRes: PromiseSettledResult<Response>;

      try {
        [manifestRes, urlsRes, backupUrlsRes] = await Promise.allSettled([
          fetch(REMOTE_MANIFEST_URL, { signal: controller.signal }),
          fetch(REMOTE_URLS_URL, { signal: controller.signal }),
          fetch(REMOTE_URLS_BACKUP_URL, { signal: controller.signal }),
        ]);
      } finally {
        clearTimeout(timeoutId);
      }

      if (manifestRes.status !== 'fulfilled' || !manifestRes.value.ok) {
        throw new Error('Failed to fetch remote manifest from GitHub repository');
      }

      const remoteManifest = await manifestRes.value.json();
      if (!Array.isArray(remoteManifest) || remoteManifest.length === 0) {
        throw new Error('Invalid or empty manifest payload received');
      }

      let remoteUrls: Record<string, any> = {};
      if (urlsRes.status === 'fulfilled' && urlsRes.value.ok) {
        try {
          remoteUrls = await urlsRes.value.json();
        } catch {}
      }

      let backupUrls: Record<string, any> = {};
      if (backupUrlsRes.status === 'fulfilled' && backupUrlsRes.value.ok) {
        try {
          backupUrls = await backupUrlsRes.value.json();
        } catch {}
      }

      // Map base URLs
      const normalizedUrls: Record<string, string> = {};
      for (const [k, v] of Object.entries(remoteUrls)) {
        normalizedUrls[k.toLowerCase()] = typeof v === 'string' ? v : (v && v.url ? v.url : '');
      }
      for (const [k, v] of Object.entries(backupUrls)) {
        const key = k.toLowerCase();
        if (!normalizedUrls[key]) {
          normalizedUrls[key] = typeof v === 'string' ? v : (v && v.url ? v.url : '');
        }
      }

      // Build updated list
      const updatedManifest: ProviderItem[] = remoteManifest
        .filter((item: any) => item && (item.value || item.id))
        .map((item: any) => {
          const val = String(item.value || item.id);
          const valKey = val.toLowerCase();
          const existing = BUNDLED_PROVIDERS.find((bp) => bp.id === val || bp.value === val);

          let resolvedUrl = normalizedUrls[valKey] || (existing ? existing.baseUrl : '');
          if (!resolvedUrl) {
            for (const [k, u] of Object.entries(normalizedUrls)) {
              if (k.includes(valKey) || valKey.includes(k)) {
                resolvedUrl = u;
                break;
              }
            }
          }

          let category: ProviderCategory = 'global';
          if (VALID_CATEGORIES.has(item.type)) {
            category = item.type;
          } else if (existing && VALID_CATEGORIES.has(existing.category)) {
            category = existing.category;
          }

          return {
            id: val,
            value: val,
            name: item.display_name || item.name || existing?.name || val,
            version: String(item.version || existing?.version || '1.0'),
            icon: item.icon || (existing ? existing.icon : `https://cdn.jsdelivr.net/gh/Zenda-Cross/vega-providers@main/assets/${val}.png`),
            category,
            baseUrl: resolvedUrl || existing?.baseUrl || 'https://vegamovies.lease',
            disabledByDefault: !!item.disabled,
            userEnabled: !item.disabled,
            hasSettings: !!item.hasSettings,
          };
        });

      // Ensure any bundled providers not present in remote manifest are safely retained
      const remoteIds = new Set(updatedManifest.map((p) => p.id));
      for (const bundled of BUNDLED_PROVIDERS) {
        if (!remoteIds.has(bundled.id)) {
          updatedManifest.push(bundled);
        }
      }

      // Update in-memory manifest
      this.inMemoryManifest = updatedManifest;

      // Enqueue persistence
      this.enqueuePersistence(STORAGE_KEY_CACHED_MANIFEST, JSON.stringify(updatedManifest));
      const nowStr = new Date().toISOString();
      this.enqueuePersistence(STORAGE_KEY_LAST_SYNC, nowStr);

      // Re-read with user toggles preserved
      await this.ensureInitialized();
      const finalProviders = this.buildMergedProviders();
      this.notifyListeners(finalProviders);

      return {
        success: true,
        count: updatedManifest.length,
      };
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      const errorMsg = isTimeout
        ? 'Network request timed out after 10 seconds'
        : (err.message || 'Network timeout or unreachable repository');

      console.warn('[ManifestSyncService] Sync failed:', errorMsg);
      return {
        success: false,
        count: 0,
        error: errorMsg,
      };
    }
  }

  /**
   * Get timestamp of last manifest sync
   */
  static async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
    } catch {
      return null;
    }
  }
}
