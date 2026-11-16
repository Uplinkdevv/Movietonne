# 🎬 MovieTonee (v1.0.0)

[![Release](https://img.shields.io/badge/Release-v1.0.0-gold.svg)](https://github.com/Uplinkdevv/Movietonne/releases)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-blue.svg)](https://github.com/Uplinkdevv/Movietonne)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-black.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74.5-61DAFB.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-CC0%201.0-green.svg)](LICENSE)

A modern, high-performance cross-platform streaming, media discovery, and player application built with **React Native**, **Expo SDK 51**, and **TypeScript**. Designed with a clean architecture, comprehensive provider ecosystem (66 streaming providers), adaptive HLS video engine with automatic CDN failover, and native Material You adaptive & monochrome icons.

---

## 📱 Download Shareable APK

You can download the pre-built, signed standalone APK directly from GitHub Releases:

📦 **[Download MovieTonee-v1.0.0.apk](https://github.com/Uplinkdevv/Movietonne/releases/tag/v1.0.0)**

---

## ✨ Key Features & Capabilities

### 1. 🛰️ 66-Provider Streaming Ecosystem
- **All 66 ScreenScape Providers**: Integrated offline catalog (`manifestData.ts`) and live remote sync (`manifestSync.ts`).
- **Interactive Provider Manager**: Filter by type (`all`, `series`, `anime`, `movies`, `livetv`, `sports`, `general`), toggle individual providers, check ping/health status, and view active stream providers.
- **Auto-Failover Stream Engine**: If a stream CDN returns 403, 404, or 503, the player automatically detects failure and falls back to the next available provider/mirror without interrupting user experience.

### 2. 🎥 Custom Cinema Video Player
- **Multi-CDN Adaptive HLS (`.m3u8`) & MP4** video playback.
- **Resolution Selector**: Auto, 1080p Full HD, 720p HD, 480p SD.
- **Playback Speed Selector**: 0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x.
- **Gesture Controls**: Double-tap forward/rewind 10 seconds, scrub bar with buffering indicator.
- **Episode & Season Drawer**: Seamlessly switch between television & anime episodes on the fly.
- **Picture-in-Picture & Fullscreen**: Smooth orientation handling and native controls.

### 3. 🎨 Native Material You & Adaptive Icons
- Full Android 13/14 **Dynamic Themed Icon** (`<monochrome>`) support.
- Custom gold emblem design within the 66% safe zone to ensure crisp rendering on all launcher shapes (circle, squircle, pebble, teardrop).
- Complete mipmap density sets: `mdpi` (160dpi), `hdpi` (240dpi), `xhdpi` (320dpi), `xxhdpi` (480dpi), and `xxxhdpi` (640dpi).

### 4. 🍿 Comprehensive Metadata & Discovery
- Integrated TMDB metadata service for trending movies, binge series, top anime, and upcoming releases.
- Live fuzzy search across titles, genres, actors, and directors.
- Local Watchlist and "Continue Watching" history persisted offline via AsyncStorage.

---

## 📂 Project Structure

```
movietonee/
├── android/                        # Fully configured native Android project
│   ├── app/
│   │   ├── build.gradle            # Native Gradle build config & signing configuration
│   │   ├── movietonee-release.keystore # Production release signing keystore
│   │   └── src/main/res/           # Mipmap drawables, adaptive XMLs & layouts
│   └── build.gradle
├── assets/                         # Vector icons, splash screen, and branding
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── VideoPlayerView.tsx     # Custom HLS/MP4 video player with auto-failover
│   │   ├── ProviderManagerModal.tsx# 66-Provider management UI modal
│   │   ├── QualitySelectorModal.tsx# Stream resolution switcher
│   │   ├── SpeedSelectorModal.tsx  # Playback speed controls
│   │   ├── EpisodePickerModal.tsx  # Episode drawer
│   │   ├── HeroBanner.tsx          # Featured spotlight banner
│   │   ├── MediaCard.tsx           # Media poster cards
│   │   └── SectionRow.tsx          # Horizontal media scroll rows
│   ├── constants/                  # Theme colors, styling tokens, and app config
│   ├── navigation/                 # Stack & Bottom Tab navigators
│   ├── screens/                    # Application screens
│   │   ├── HomeScreen.tsx          # Discovery & Continue Watching
│   │   ├── SearchScreen.tsx        # Multi-genre discovery & search
│   │   ├── DetailsScreen.tsx       # Metadata, trailer & stream resolution
│   │   ├── PlayerScreen.tsx        # Video playback screen
│   │   ├── WatchlistScreen.tsx     # User library & favorites
│   │   └── SettingsScreen.tsx      # Provider & playback settings
│   ├── services/
│   │   ├── providers/              # 66 Providers manifest & failover resolver
│   │   ├── storage.ts              # Async storage persistence
│   │   └── tmdb.ts                 # TMDB API client
│   ├── store/                      # Zustand state store
│   └── types/                      # TypeScript domain models
├── App.tsx                         # App entry root
├── app.json                        # Expo app metadata & splash config
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## 🛠️ Building & Running Locally

### 1. Install Dependencies
```bash
cd movietonee
npm install
```

### 2. Run in Development Mode
```bash
# Start Expo Metro Bundler
npx expo start

# Run on connected Android device/emulator
npm run android
```

### 3. Build Standalone Production Release APK
```bash
cd android
./gradlew assembleRelease
```
The compiled, signed, and aligned APK will be produced at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 📄 License
This project is open-source under the Creative Commons Zero v1.0 Universal (CC0 1.0) License. Media metadata is provided courtesy of TMDB.
