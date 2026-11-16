import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../services/storage';
import { ProviderManager } from '../services/providers';
import { ManifestSyncService } from '../services/providers/manifestSync';
import { MediaProvider, ProviderItem } from '../types';
import { ProviderManagerModal } from '../components/ProviderManagerModal';
import { ProviderIconImage } from '../components/ProviderIconImage';
import { APP_CONFIG } from '../constants/config';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import {
  Settings as SettingsIcon,
  Key,
  Sliders,
  Trash2,
  Film,
  Server,
  Info,
  CheckCircle2,
  Layers,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [providers, setProviders] = useState<MediaProvider[]>([]);
  const [allProviders, setAllProviders] = useState<ProviderItem[]>([]);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [hardwareAccel, setHardwareAccel] = useState(true);

  useEffect(() => {
    loadSettings();
    const unsubscribe = ManifestSyncService.subscribe((updated) => {
      setAllProviders(updated);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    const customKey = await StorageService.getCustomTmdbKey();
    if (customKey) setApiKeyInput(customKey);
    setProviders([...ProviderManager.getRegisteredProviders()]);
    const manifestItems = await ManifestSyncService.getProviders();
    setAllProviders(manifestItems);
  };

  const handleSaveApiKey = async () => {
    await StorageService.setCustomTmdbKey(apiKeyInput);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  const handleToggleQuickProvider = async (id: string, val: boolean) => {
    const updated = await ManifestSyncService.toggleProvider(id, val);
    setAllProviders(updated);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will reset your Watchlist, Playback History, and Cache. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            await loadSettings();
            Alert.alert('Data Cleared', 'All local state has been reset.');
          },
        },
      ]
    );
  };

  const activeCount = allProviders.filter((p) => p.userEnabled).length;
  const totalCount = allProviders.length;

  // Selected top featured providers to display quick switches in settings
  const featuredQuickIds = ['autoEmbed', 'vega', 'drive', 'uhd', 'hdhub4u', 'showbox', 'anikoto'];
  const featuredProviders = allProviders.filter((p) => featuredQuickIds.includes(p.id));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Brand Banner */}
        <View style={styles.brandCard}>
          <Film size={32} color={COLORS.accent} />
          <View style={styles.brandTextWrapper}>
            <Text style={styles.brandTitle}>MOVIETONEE</Text>
            <Text style={styles.brandSubtitle}>ScreenScape Reconstructed Streaming Engine</Text>
            <Text style={styles.versionBadge}>v{APP_CONFIG.appVersion} Universal • 66 Providers</Text>
          </View>
        </View>

        {/* ScreenScape Provider Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Layers size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Content Providers Ecosystem</Text>
          </View>
          <Text style={styles.sectionDesc}>
            MovieTonee integrates all 66 ScreenScape/Vega providers across Global, India, English, Anime, and Italy categories with dynamic GitHub repository sync.
          </Text>

          {/* Manage All Providers CTA */}
          <TouchableOpacity
            style={styles.providerManagerBtn}
            activeOpacity={0.8}
            onPress={() => setProviderModalVisible(true)}
          >
            <View style={styles.pmBtnLeft}>
              <View style={styles.pmIconBg}>
                <Server size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.pmBtnTitle}>Manage All Providers</Text>
                <Text style={styles.pmBtnSubtitle}>
                  {totalCount} Providers Registered • {activeCount} Active
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Featured Quick Toggles */}
          <View style={styles.quickHeaderRow}>
            <Text style={styles.quickTitle}>Popular Scraper Providers</Text>
            <TouchableOpacity onPress={() => setProviderModalVisible(true)}>
              <Text style={styles.viewAllText}>View All ({totalCount})</Text>
            </TouchableOpacity>
          </View>

          {featuredProviders.map((fp) => (
            <View key={fp.id} style={styles.quickProviderRow}>
              <View style={styles.qpLeft}>
                <View style={styles.qpIconContainer}>
                  <ProviderIconImage
                    iconUri={fp.icon}
                    size={18}
                    iconColor={COLORS.primary}
                    style={styles.qpIcon}
                  />
                </View>
                <View>
                  <Text style={styles.qpName}>{fp.name}</Text>
                  <Text style={styles.qpMeta}>
                    {fp.category.toUpperCase()} • v{fp.version}
                  </Text>
                </View>
              </View>
              <Switch
                value={fp.userEnabled}
                onValueChange={(val) => handleToggleQuickProvider(fp.id, val)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* TMDB Integration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>The Movie Database (TMDB) API</Text>
          </View>
          <Text style={styles.sectionDesc}>
            MovieTonee comes pre-configured with a public API key. You can supply your own private TMDB v3 API key below.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter TMDB v3 API Key"
              placeholderTextColor={COLORS.textMuted}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
          {apiKeySaved && (
            <View style={styles.savedFeedback}>
              <CheckCircle2 size={14} color={COLORS.success} />
              <Text style={styles.savedFeedbackText}>API key saved successfully!</Text>
            </View>
          )}
        </View>

        {/* Playback Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Playback Preferences</Text>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Auto-Play Next Episode</Text>
              <Text style={styles.switchSublabel}>Automatically buffer next episode for series</Text>
            </View>
            <Switch
              value={autoPlayNext}
              onValueChange={setAutoPlayNext}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Hardware Video Acceleration</Text>
              <Text style={styles.switchSublabel}>Utilize device GPU for H.264 / HEVC decoding</Text>
            </View>
            <Switch
              value={hardwareAccel}
              onValueChange={setHardwareAccel}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Storage & Maintenance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={18} color={COLORS.danger} />
            <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Storage & Maintenance</Text>
          </View>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Trash2 size={18} color="#FFFFFF" />
            <Text style={styles.dangerBtnText}>Clear Watch History & Cache</Text>
          </TouchableOpacity>
        </View>

        {/* About & Legal Notice */}
        <View style={styles.aboutCard}>
          <Info size={16} color={COLORS.textMuted} />
          <Text style={styles.aboutText}>
            MovieTonee is an open-source media aggregator with modular multi-provider scraping architecture. Metadata is provided by TMDB. This application adheres to fair use guidelines and streams through user-configured external sources.
          </Text>
        </View>
      </ScrollView>

      {/* Provider Manager Modal */}
      <ProviderManagerModal
        visible={providerModalVisible}
        onClose={() => setProviderModalVisible(false)}
        onProvidersUpdated={loadSettings}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
    paddingBottom: 80,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  brandTextWrapper: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 6,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  providerManagerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  pmBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pmIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pmBtnSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  quickProviderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  qpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  qpIconContainer: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qpIcon: {
    width: 24,
    height: 24,
  },
  qpName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qpMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  savedFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  savedFeedbackText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  switchSublabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.xs,
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  aboutCard: {
    flexDirection: 'row',
    gap: 8,
    padding: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
