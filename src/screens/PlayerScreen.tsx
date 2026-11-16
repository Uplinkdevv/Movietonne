import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { VideoPlayerView } from '../components/VideoPlayerView';
import { Episode, StreamSource, StreamQuality } from '../types';

export const PlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    activeMedia,
    activeSource,
    activeQuality,
    activeSeason,
    activeEpisode,
    availableSources,
    updateProgress,
    setActivePlayback,
  } = useAppStore();

  if (!activeMedia || !activeSource || !activeQuality) {
    navigation.goBack();
    return null;
  }

  const handleProgressUpdate = (positionMillis: number, durationMillis: number) => {
    updateProgress({
      mediaId: activeMedia.id,
      title: activeMedia.title,
      posterPath: activeMedia.posterPath,
      mediaType: activeMedia.mediaType,
      positionMillis,
      durationMillis,
      seasonNumber: activeSeason || undefined,
      episodeNumber: activeEpisode || undefined,
      lastWatchedTimestamp: Date.now(),
    });
  };

  const handleEpisodeChange = (seasonNumber: number, episode: Episode) => {
    setActivePlayback(
      activeMedia,
      activeSource,
      activeQuality,
      seasonNumber,
      episode.episodeNumber,
      availableSources
    );
  };

  const handleSourceChange = (source: StreamSource, quality: StreamQuality) => {
    setActivePlayback(
      activeMedia,
      source,
      quality,
      activeSeason || 1,
      activeEpisode || 1,
      availableSources
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <VideoPlayerView
        media={activeMedia}
        streamSource={activeSource}
        initialQuality={activeQuality}
        availableSources={availableSources}
        currentSeasonNumber={activeSeason || 1}
        currentEpisodeNumber={activeEpisode || 1}
        onBack={() => navigation.goBack()}
        onProgressUpdate={handleProgressUpdate}
        onEpisodeChange={handleEpisodeChange}
        onSourceChange={handleSourceChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
