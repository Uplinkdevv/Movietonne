import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StreamQuality, StreamSource, MediaItem, Episode } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { QualitySelectorModal } from './QualitySelectorModal';
import { SpeedSelectorModal } from './SpeedSelectorModal';
import { EpisodePickerModal } from './EpisodePickerModal';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sliders,
  Film,
  ArrowLeft,
  Maximize,
  Minimize,
  Gauge,
  Crop,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { ProviderManager } from '../services/providers';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface AspectModeConfig {
  mode: ResizeMode;
  label: string;
  short: string;
}

const ASPECT_MODES: AspectModeConfig[] = [
  { mode: ResizeMode.CONTAIN, label: 'CONTAIN (Fit)', short: 'FIT' },
  { mode: ResizeMode.COVER, label: 'COVER (Fill)', short: 'FILL' },
  { mode: ResizeMode.STRETCH, label: 'STRETCH', short: 'STRETCH' },
];

interface VideoPlayerViewProps {
  media: MediaItem;
  streamSource: StreamSource;
  initialQuality: StreamQuality;
  availableSources?: StreamSource[];
  currentSeasonNumber?: number;
  currentEpisodeNumber?: number;
  onBack: () => void;
  onProgressUpdate?: (positionMillis: number, durationMillis: number) => void;
  onEpisodeChange?: (seasonNumber: number, episode: Episode) => void;
  onSourceChange?: (source: StreamSource, quality: StreamQuality) => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  media,
  streamSource,
  initialQuality,
  availableSources,
  currentSeasonNumber = 1,
  currentEpisodeNumber = 1,
  onBack,
  onProgressUpdate,
  onEpisodeChange,
  onSourceChange,
}) => {
  const videoRef = useRef<Video>(null);

  // Video & Stream State
  const [currentSource, setCurrentSource] = useState<StreamSource>(streamSource);
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality>(initialQuality);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(WINDOW_WIDTH);

  // Auto-failover & Error Recovery State
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [failoverToast, setFailoverToast] = useState<string | null>(null);
  const [isSwitchingStream, setIsSwitchingStream] = useState<boolean>(false);
  const failoverToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const failedUrlsRef = useRef<Set<string>>(new Set());
  const failoverCountRef = useRef<number>(0);

  // Pool of sources for failover
  const sourcesPoolRef = useRef<StreamSource[]>([]);

  // Playback Speed State
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSpeedModal, setShowSpeedModal] = useState<boolean>(false);

  // Aspect Ratio State
  const [aspectIndex, setAspectIndex] = useState<number>(0);
  const [aspectToast, setAspectToast] = useState<string | null>(null);
  const aspectToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Double Tap Skip Animation State
  const [showLeftIndicator, setShowLeftIndicator] = useState<boolean>(false);
  const [showRightIndicator, setShowRightIndicator] = useState<boolean>(false);
  const leftAnimOpacity = useRef(new Animated.Value(0)).current;
  const leftAnimScale = useRef(new Animated.Value(0.7)).current;
  const rightAnimOpacity = useRef(new Animated.Value(0)).current;
  const rightAnimScale = useRef(new Animated.Value(0.7)).current;

  // Modals
  const [showQualityModal, setShowQualityModal] = useState<boolean>(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState<boolean>(false);

  // Double tap references
  const lastTapLeftRef = useRef<number>(0);
  const lastTapRightRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls timer
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (aspectToastTimerRef.current) clearTimeout(aspectToastTimerRef.current);
      if (failoverToastTimerRef.current) clearTimeout(failoverToastTimerRef.current);
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    setCurrentSource(streamSource);
    setSelectedQuality(initialQuality);
    setPlaybackError(null);
    setIsLoading(true);
  }, [streamSource, initialQuality]);

  useEffect(() => {
    const fallbacks = ProviderManager.getFallbackSources();
    const list =
      availableSources && availableSources.length > 0
        ? availableSources
        : [streamSource, ...fallbacks];
    const seen = new Set<string>();
    const pool: StreamSource[] = [];
    for (const s of list) {
      const key = `${s.providerId}-${s.serverName}`;
      if (!seen.has(key)) {
        seen.add(key);
        pool.push(s);
      }
    }
    for (const f of fallbacks) {
      const key = `${f.providerId}-${f.serverName}`;
      if (!seen.has(key)) {
        seen.add(key);
        pool.push(f);
      }
    }
    sourcesPoolRef.current = pool;
  }, [availableSources, streamSource]);

  const showFailoverToastMessage = (msg: string) => {
    if (failoverToastTimerRef.current) clearTimeout(failoverToastTimerRef.current);
    setFailoverToast(msg);
    failoverToastTimerRef.current = setTimeout(() => {
      setFailoverToast(null);
    }, 4000);
  };

  const findNextStream = (
    forceNextSource: boolean = false
  ): { source: StreamSource; quality: StreamQuality } | null => {
    const pool = sourcesPoolRef.current;
    if (!pool || pool.length === 0) {
      const fb = ProviderManager.getFallbackSources()[0];
      return { source: fb, quality: fb.qualities[0] };
    }

    // 1. If not forcing a source switch, try another untried quality in currentSource
    if (!forceNextSource && currentSource) {
      const nextQ = currentSource.qualities.find(
        (q) => q.url !== selectedQuality.url && !failedUrlsRef.current.has(q.url)
      );
      if (nextQ) {
        return { source: currentSource, quality: nextQ };
      }
    }

    // 2. Search cyclically through pool starting from next source
    const currentIndex = pool.findIndex(
      (s) => s.providerId === currentSource.providerId && s.serverName === currentSource.serverName
    );

    for (let i = 1; i <= pool.length; i++) {
      const nextIdx = (currentIndex + i) % pool.length;
      const candidateSource = pool[nextIdx];
      // Pick best untried quality in candidate (prefer Auto HLS or 1080p)
      const untriedQualities = candidateSource.qualities.filter(
        (q) => !failedUrlsRef.current.has(q.url)
      );
      if (untriedQualities.length > 0) {
        const autoQ = untriedQualities.find(
          (q) => q.quality === 'Auto' && (q.isM3u8 || q.url.includes('.m3u8'))
        );
        const fhdQ = untriedQualities.find((q) => q.quality === '1080p');
        const chosenQ = autoQ || fhdQ || untriedQualities[0];
        return { source: candidateSource, quality: chosenQ };
      }
    }

    // 3. If all URLs have been attempted, reset failed URLs set and return primary fallback
    failedUrlsRef.current.clear();
    const fallback = ProviderManager.getFallbackSources()[0];
    return { source: fallback, quality: fallback.qualities[0] };
  };

  const handlePlaybackError = (errorMsg: string) => {
    if (selectedQuality?.url) {
      failedUrlsRef.current.add(selectedQuality.url);
    }
    failoverCountRef.current += 1;

    // Automatic failover up to 4 consecutive attempts
    if (failoverCountRef.current <= 4) {
      const nextStream = findNextStream(false);
      if (nextStream) {
        showFailoverToastMessage(
          `Stream failover: Auto-switching to ${nextStream.source.serverName} (${nextStream.quality.quality})...`
        );
        setIsSwitchingStream(true);
        setTimeout(() => {
          setCurrentSource(nextStream.source);
          setSelectedQuality(nextStream.quality);
          setIsLoading(true);
          setIsSwitchingStream(false);
          setPlaybackError(null);
          if (onSourceChange) {
            onSourceChange(nextStream.source, nextStream.quality);
          }
        }, 350);
        return;
      }
    }

    // Display error recovery overlay instead of a black screen
    setPlaybackError(errorMsg || 'Unable to load stream mirror');
  };

  const handleTryNextBestStream = () => {
    resetHideTimer();
    if (selectedQuality?.url) {
      failedUrlsRef.current.add(selectedQuality.url);
    }
    const nextStream = findNextStream(true);
    if (nextStream) {
      showFailoverToastMessage(
        `Connecting to ${nextStream.source.serverName} (${nextStream.quality.quality})...`
      );
      setIsSwitchingStream(true);
      setPlaybackError(null);
      setTimeout(() => {
        setCurrentSource(nextStream.source);
        setSelectedQuality(nextStream.quality);
        setIsLoading(true);
        setIsSwitchingStream(false);
        if (onSourceChange) {
          onSourceChange(nextStream.source, nextStream.quality);
        }
      }, 350);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setIsLoading(false);
        console.warn(`[VideoPlayer] Error: ${status.error}`);
        handlePlaybackError(status.error);
      }
      return;
    }

    if (status.isPlaying) {
      setPlaybackError(null);
      failoverCountRef.current = 0;
    }

    setIsLoading(status.isBuffering);
    setIsPlaying(status.isPlaying);
    setPositionMillis(status.positionMillis);
    setDurationMillis(status.durationMillis || 0);

    if (onProgressUpdate && status.durationMillis) {
      onProgressUpdate(status.positionMillis, status.durationMillis);
    }
  };

  const togglePlayPause = async () => {
    resetHideTimer();
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const seekRelative = async (seconds: number) => {
    resetHideTimer();
    if (!videoRef.current || !durationMillis) return;
    const target = Math.max(0, Math.min(durationMillis, positionMillis + seconds * 1000));
    await videoRef.current.setPositionAsync(target);
  };

  const triggerSkipAnim = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setShowLeftIndicator(true);
      leftAnimOpacity.setValue(1);
      leftAnimScale.setValue(0.7);
      Animated.parallel([
        Animated.spring(leftAnimScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(leftAnimOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowLeftIndicator(false);
      });
    } else {
      setShowRightIndicator(true);
      rightAnimOpacity.setValue(1);
      rightAnimScale.setValue(0.7);
      Animated.parallel([
        Animated.spring(rightAnimScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(rightAnimOpacity, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowRightIndicator(false);
      });
    }
  };

  // Handle single and double taps across the player area
  const handlePlayerTap = (event: GestureResponderEvent) => {
    const x = event.nativeEvent.locationX;
    const midpoint = containerWidth / 2;
    const isLeft = x < midpoint;
    const now = Date.now();

    if (isLeft) {
      if (now - lastTapLeftRef.current < 320) {
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        seekRelative(-10);
        triggerSkipAnim('left');
        lastTapLeftRef.current = 0;
        return;
      }
      lastTapLeftRef.current = now;
      lastTapRightRef.current = 0;
    } else {
      if (now - lastTapRightRef.current < 320) {
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        seekRelative(10);
        triggerSkipAnim('right');
        lastTapRightRef.current = 0;
        return;
      }
      lastTapRightRef.current = now;
      lastTapLeftRef.current = 0;
    }

    // Schedule single tap behavior (toggle controls)
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      if (showControls) {
        setShowControls(false);
      } else {
        resetHideTimer();
      }
    }, 320);
  };

  const handleSelectSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      try {
        await videoRef.current.setRateAsync(speed, true);
      } catch (e) {
        console.warn('[VideoPlayer] Error setting rate:', e);
      }
    }
  };

  const toggleAspectRatio = () => {
    resetHideTimer();
    const nextIndex = (aspectIndex + 1) % ASPECT_MODES.length;
    setAspectIndex(nextIndex);
    const nextConfig = ASPECT_MODES[nextIndex];

    if (aspectToastTimerRef.current) clearTimeout(aspectToastTimerRef.current);
    setAspectToast(nextConfig.label);
    aspectToastTimerRef.current = setTimeout(() => {
      setAspectToast(null);
    }, 1800);
  };

  const toggleFullscreen = async () => {
    resetHideTimer();
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      setIsFullscreen(true);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;
  const currentAspect = ASPECT_MODES[aspectIndex];

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <TouchableWithoutFeedback onPress={handlePlayerTap}>
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={{
              uri: selectedQuality.url,
              headers: currentSource.headers,
            }}
            style={styles.video}
            resizeMode={currentAspect.mode}
            shouldPlay
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {/* Buffering Indicator */}
          {isLoading && !playbackError && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loaderText}>Buffering stream...</Text>
            </View>
          )}

          {/* Switching Stream Indicator */}
          {isSwitchingStream && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#34D399" />
              <Text style={styles.loaderText}>Switching to optimal stream...</Text>
            </View>
          )}

          {/* Failover Toast Banner */}
          {failoverToast && (
            <View style={styles.failoverToast} pointerEvents="none">
              <RefreshCw size={13} color="#34D399" />
              <Text style={styles.failoverToastText} numberOfLines={1}>
                {failoverToast}
              </Text>
            </View>
          )}

          {/* Aspect Ratio Toast Banner */}
          {aspectToast && (
            <View style={styles.aspectToast} pointerEvents="none">
              <Crop size={14} color={COLORS.accent} />
              <Text style={styles.aspectToastText}>Aspect: {aspectToast}</Text>
            </View>
          )}

          {/* Playback Error & Auto-Failover Recovery UI (replaces black screen) */}
          {playbackError && (
            <View style={styles.errorOverlay}>
              <View style={styles.errorCard}>
                <View style={styles.errorIconCircle}>
                  <AlertCircle size={32} color="#EF4444" />
                </View>
                <Text style={styles.errorTitle}>Playback Interrupted</Text>
                <Text style={styles.errorMessage}>
                  Stream encountered network turbulence. Alternate fast CDN mirrors are available.
                </Text>
                <View style={styles.errorServerBadge}>
                  <Text style={styles.errorServerText}>
                    {currentSource.serverName} • {selectedQuality.quality}
                  </Text>
                </View>

                {/* Primary Recovery Action: Try Next Best Stream */}
                <TouchableOpacity
                  style={styles.retryBtnPrimary}
                  activeOpacity={0.8}
                  onPress={handleTryNextBestStream}
                >
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.retryBtnPrimaryText}>Try Next Best Stream</Text>
                </TouchableOpacity>

                {/* Secondary Actions */}
                <View style={styles.errorActionsRow}>
                  <TouchableOpacity
                    style={styles.retryBtnSecondary}
                    onPress={() => {
                      resetHideTimer();
                      setShowQualityModal(true);
                    }}
                  >
                    <Sliders size={15} color={COLORS.accent} />
                    <Text style={styles.retryBtnSecondaryText}>Quality</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retryBtnSecondary}
                    onPress={onBack}
                  >
                    <ArrowLeft size={15} color="#FFFFFF" />
                    <Text style={styles.retryBtnSecondaryText}>Exit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Animated Left Double-Tap Skip Indicator */}
          {showLeftIndicator && (
            <Animated.View
              style={[
                styles.skipIndicatorBubble,
                styles.skipIndicatorLeft,
                {
                  opacity: leftAnimOpacity,
                  transform: [{ scale: leftAnimScale }],
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.skipIconRow}>
                <RotateCcw size={26} color="#FFFFFF" />
                <Text style={styles.skipSecText}>10s</Text>
              </View>
              <Text style={styles.skipSubText}>Rewind</Text>
            </Animated.View>
          )}

          {/* Animated Right Double-Tap Skip Indicator */}
          {showRightIndicator && (
            <Animated.View
              style={[
                styles.skipIndicatorBubble,
                styles.skipIndicatorRight,
                {
                  opacity: rightAnimOpacity,
                  transform: [{ scale: rightAnimScale }],
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.skipIconRow}>
                <RotateCw size={26} color="#FFFFFF" />
                <Text style={styles.skipSecText}>10s</Text>
              </View>
              <Text style={styles.skipSubText}>Forward</Text>
            </Animated.View>
          )}

          {/* HUD Overlay */}
          {showControls && (
            <View style={styles.overlay}>
              {/* Top Bar */}
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
                  <ArrowLeft size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {media.title}
                  </Text>
                  {media.mediaType !== 'movie' ? (
                    <Text style={styles.headerSubtitle}>
                      Season {currentSeasonNumber} • Episode {currentEpisodeNumber}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.topRightActions}>
                  {/* Next Best Stream Quick Button */}
                  <TouchableOpacity
                    style={styles.pillActionBtn}
                    onPress={handleTryNextBestStream}
                  >
                    <Sparkles size={14} color="#34D399" />
                    <Text style={[styles.pillActionText, { color: '#34D399' }]}>Next Best</Text>
                  </TouchableOpacity>

                  {/* Episode Picker Button */}
                  {media.seasons && media.seasons.length > 0 && onEpisodeChange && (
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => {
                        resetHideTimer();
                        setShowEpisodeModal(true);
                      }}
                    >
                      <Film size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}

                  {/* Aspect Ratio Toggle (CONTAIN vs COVER vs STRETCH) */}
                  <TouchableOpacity
                    style={styles.pillActionBtn}
                    onPress={toggleAspectRatio}
                  >
                    <Crop size={15} color={COLORS.accent} />
                    <Text style={styles.pillActionText}>{currentAspect.short}</Text>
                  </TouchableOpacity>

                  {/* Playback Speed Selector (0.75x, 1.0x, 1.25x, 1.5x, 2.0x) */}
                  <TouchableOpacity
                    style={styles.pillActionBtn}
                    onPress={() => {
                      resetHideTimer();
                      setShowSpeedModal(true);
                    }}
                  >
                    <Gauge size={15} color={COLORS.accent} />
                    <Text style={styles.pillActionText}>{playbackSpeed}x</Text>
                  </TouchableOpacity>

                  {/* Quality Selector */}
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => {
                      resetHideTimer();
                      setShowQualityModal(true);
                    }}
                  >
                    <Sliders size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Center Controls */}
              <View style={styles.centerControls}>
                <TouchableOpacity
                  style={styles.seekBtn}
                  onPress={() => seekRelative(-10)}
                >
                  <RotateCcw size={28} color="#FFFFFF" />
                  <Text style={styles.seekText}>10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playPauseBtn}
                  onPress={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause size={36} color="#FFFFFF" />
                  ) : (
                    <Play size={36} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.seekBtn}
                  onPress={() => seekRelative(10)}
                >
                  <RotateCw size={28} color="#FFFFFF" />
                  <Text style={styles.seekText}>10s</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Bar */}
              <View style={styles.bottomBar}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                    />
                  </View>
                </View>

                <View style={styles.bottomControls}>
                  <Text style={styles.timeText}>
                    {formatTime(positionMillis)} / {formatTime(durationMillis)}
                  </Text>

                  <View style={styles.bottomRight}>
                    <View style={styles.qualityPill}>
                      <Text style={styles.qualityPillText}>{selectedQuality.quality}</Text>
                    </View>

                    <TouchableOpacity style={styles.iconBtn} onPress={toggleFullscreen}>
                      {isFullscreen ? (
                        <Minimize size={18} color="#FFFFFF" />
                      ) : (
                        <Maximize size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Quality Picker Modal */}
      <QualitySelectorModal
        visible={showQualityModal}
        qualities={currentSource.qualities}
        selectedQuality={selectedQuality}
        onSelect={(q) => {
          setSelectedQuality(q);
          setPlaybackError(null);
          setIsLoading(true);
        }}
        onClose={() => setShowQualityModal(false)}
      />

      {/* Playback Speed Selector Modal */}
      <SpeedSelectorModal
        visible={showSpeedModal}
        selectedSpeed={playbackSpeed}
        onSelect={handleSelectSpeed}
        onClose={() => setShowSpeedModal(false)}
      />

      {/* Episode Picker Modal */}
      {media.seasons && onEpisodeChange && (
        <EpisodePickerModal
          visible={showEpisodeModal}
          seasons={media.seasons}
          currentSeasonNumber={currentSeasonNumber}
          currentEpisodeNumber={currentEpisodeNumber}
          onSelectEpisode={onEpisodeChange}
          onClose={() => setShowEpisodeModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loaderText: {
    color: '#F8FAFC',
    marginTop: SPACING.sm,
    fontSize: 13,
  },
  aspectToast: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    zIndex: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  aspectToastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  failoverToast: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.5)',
    zIndex: 45,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '85%',
  },
  failoverToastText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 19, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    zIndex: 50,
  },
  errorCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  errorIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  errorServerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  errorServerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  retryBtnPrimary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  retryBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  retryBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  retryBtnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  skipIndicatorBubble: {
    position: 'absolute',
    top: '42%',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 35,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  skipIndicatorLeft: {
    left: '12%',
  },
  skipIndicatorRight: {
    right: '12%',
  },
  skipIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skipSecText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  skipSubText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 19, 0.45)',
    justifyContent: 'space-between',
    padding: SPACING.md,
    zIndex: 25,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 7,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  seekBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  seekText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  bottomBar: {
    gap: SPACING.xs,
    paddingBottom: 8,
  },
  progressContainer: {
    width: '100%',
    height: 16,
    justifyContent: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  qualityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  qualityPillText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
});
