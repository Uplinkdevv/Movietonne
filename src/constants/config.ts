export const APP_CONFIG = {
  appName: 'MovieTonee',
  appVersion: '1.0.0',
  brandName: 'MovieTonee',
  defaultUserAgent: 'MovieTonee/1.0.0 (Linux; Android; movietonee-client)',
  
  // Public TMDB Read-Access Configuration
  tmdbApiKey: '844dba0bfd8f3a4f3799f6130ef9e335', // Verified active public key
  tmdbFallbackApiKeys: [
    '844dba0bfd8f3a4f3799f6130ef9e335',
    '4e44d9029b1270a757cddc766a1bcb63',
    '2dca580c2a14b55200e784d157207b4d',
  ],
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
