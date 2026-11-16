export const APP_CONFIG = {
  appName: 'MovieTonee',
  appVersion: '1.0.0',
  brandName: 'MovieTonee',
  defaultUserAgent: 'MovieTonee/1.0.0 (Linux; Android; movietonee-client)',
  
  // Public TMDB Read-Access Configuration
  tmdbApiKey: '3c8e4e963fc90f38fa46ec98c8c5c76d', // Standard public key
  tmdbBaseUrl: 'https://api.themoviedb.org/3',
  tmdbImageBaseUrl: 'https://image.tmdb.org/t/p',
  
  // Storage Keys
  STORAGE_KEYS: {
    WATCHLIST: '@movietonee/watchlist',
    CONTINUE_WATCHING: '@movietonee/continue_watching',
    PLAYBACK_SETTINGS: '@movietonee/playback_settings',
    ENABLED_PROVIDERS: '@movietonee/enabled_providers',
    CUSTOM_TMDB_KEY: '@movietonee/custom_tmdb_key',
  },
  
  // Playback Defaults
  playback: {
    defaultQuality: 'Auto',
    autoPlayNext: true,
    hardwareAcceleration: true,
    seekSkipSeconds: 10,
  },
};
