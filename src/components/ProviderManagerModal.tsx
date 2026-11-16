import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ProviderItem, ProviderCategory } from '../types';
import { ManifestSyncService } from '../services/providers/manifestSync';
import { ProviderIconImage } from './ProviderIconImage';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import {
  X,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Globe,
  Server,
  Layers,
} from 'lucide-react-native';

interface ProviderManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onProvidersUpdated?: () => void;
}

const CATEGORY_TABS: { label: string; value: ProviderCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Global', value: 'global' },
  { label: 'India', value: 'india' },
  { label: 'English', value: 'english' },
  { label: 'Anime', value: 'anime' },
  { label: 'Italy', value: 'italy' },
];

export const ProviderManagerModal: React.FC<ProviderManagerModalProps> = ({
  visible,
  onClose,
  onProvidersUpdated,
}) => {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | 'all'>('all');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const onProvidersUpdatedRef = useRef(onProvidersUpdated);
  useEffect(() => {
    onProvidersUpdatedRef.current = onProvidersUpdated;
  });

  useEffect(() => {
    if (visible) {
      loadProviders();

      // Subscribe to provider changes to keep state reactively in sync
      const unsubscribe = ManifestSyncService.subscribe((updated) => {
        setProviders(updated);
        if (onProvidersUpdatedRef.current) {
          onProvidersUpdatedRef.current();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [visible]);

  const loadProviders = async () => {
    setLoading(true);
    const data = await ManifestSyncService.getProviders();
    const syncTime = await ManifestSyncService.getLastSyncTime();
    setProviders(data);
    setLastSyncTime(syncTime);
    setLoading(false);
  };

  const handleToggle = (id: string, value: boolean) => {
    // Optimistic local update to guarantee zero UI latency
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, userEnabled: value } : p))
    );
    ManifestSyncService.toggleProvider(id, value);
  };

  // Filtered providers
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesId = (p.id || '').toLowerCase().includes(q);
        const matchesUrl = (p.baseUrl || '').toLowerCase().includes(q);
        return matchesName || matchesId || matchesUrl;
      }
      return true;
    });
  }, [providers, selectedCategory, searchQuery]);

  const totalCount = providers.length;
  const activeCount = providers.filter((p) => p.userEnabled).length;
  const isFiltered = selectedCategory !== 'all' || searchQuery.trim().length > 0;

  const handleSetAll = async (enable: boolean) => {
    const targetIds = isFiltered ? filteredProviders.map((p) => p.id) : undefined;
    const targetSet = targetIds ? new Set(targetIds) : null;

    // Optimistic local state update
    setProviders((prev) =>
      prev.map((p) => (!targetSet || targetSet.has(p.id) ? { ...p, userEnabled: enable } : p))
    );

    await ManifestSyncService.setAllProviders(enable, targetIds);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Providers',
      'Reset all provider settings and active states to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const updated = await ManifestSyncService.resetToDefaults();
            setProviders(updated);
            Alert.alert('Reset Complete', 'Providers restored to factory defaults.');
          },
        },
      ]
    );
  };

  const handleSyncManifest = async () => {
    setSyncing(true);
    const res = await ManifestSyncService.syncRemoteManifest();
    setSyncing(false);
    if (res.success) {
      const updated = await ManifestSyncService.getProviders();
      setProviders(updated);
      setLastSyncTime(new Date().toISOString());
      Alert.alert('Sync Successful', `Synchronized ${res.count} providers from remote GitHub repository.`);
    } else {
      Alert.alert('Sync Notice', `Could not reach remote repository (${res.error}). Current offline catalog preserved.`);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: totalCount };
    for (const p of providers) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [providers, totalCount]);

  const getCategoryColor = (cat: ProviderCategory) => {
    switch (cat) {
      case 'global':
        return '#38BDF8'; // Sky blue
      case 'india':
        return '#FB923C'; // Orange
      case 'english':
        return '#34D399'; // Emerald
      case 'anime':
        return '#A78BFA'; // Violet
      case 'italy':
        return '#F43F5E'; // Rose
      default:
        return COLORS.textMuted;
    }
  };

  const renderProviderCard = ({ item }: { item: ProviderItem }) => {
    const catColor = getCategoryColor(item.category);

    return (
      <View style={[styles.card, !item.userEnabled && styles.cardDisabled]}>
        <View style={styles.cardHeaderRow}>
          {/* Icon with automatic error fallback to Lucide Server icon */}
          <View style={styles.iconContainer}>
            <ProviderIconImage
              iconUri={item.icon}
              size={22}
              iconColor={COLORS.primary}
              style={styles.providerIcon}
            />
          </View>

          {/* Details */}
          <View style={styles.detailsCol}>
            <View style={styles.titleRow}>
              <Text style={styles.providerName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.categoryBadge, { borderColor: catColor }]}>
                <Text style={[styles.categoryBadgeText, { color: catColor }]}>
                  {item.category.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Sub details: version & baseUrl */}
            <View style={styles.subDetailsRow}>
              <Text style={styles.versionText}>v{item.version}</Text>
              <Text style={styles.dot}>•</Text>
              <Globe size={11} color={COLORS.textMuted} />
              <Text style={styles.urlText} numberOfLines={1}>
                {item.baseUrl ? item.baseUrl.replace('https://', '') : 'Dynamic Mirror'}
              </Text>
            </View>
          </View>

          {/* Toggle */}
          <Switch
            value={item.userEnabled}
            onValueChange={(val) => handleToggle(item.id, val)}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerBadge}>
              <Layers size={16} color={COLORS.accent} />
              <Text style={styles.headerBadgeText}>ScreenScape Provider System</Text>
            </View>
            <Text style={styles.headerTitle}>Manage Content Providers</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} Providers Available • {activeCount} Active
            </Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Action Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
            onPress={handleSyncManifest}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw size={14} color="#FFFFFF" />
            )}
            <Text style={styles.syncBtnText}>
              {syncing ? 'Syncing...' : 'Sync Manifest'}
            </Text>
          </TouchableOpacity>

          <View style={styles.toolbarRight}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => handleSetAll(true)}>
              <CheckCircle2 size={13} color={COLORS.success} />
              <Text style={styles.toolBtnText}>
                {isFiltered ? `Enable (${filteredProviders.length})` : 'Enable All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={() => handleSetAll(false)}>
              <XCircle size={13} color={COLORS.danger} />
              <Text style={styles.toolBtnText}>
                {isFiltered ? `Disable (${filteredProviders.length})` : 'Disable All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleResetDefaults}>
              <RotateCcw size={13} color={COLORS.textMuted} />
              <Text style={styles.toolBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 66 providers (e.g., vega, autoEmbed, anime)..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsRow}>
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.value;
            const count = categoryCounts[tab.value] || 0;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, isSelected && styles.tabActive]}
                onPress={() => setSelectedCategory(tab.value)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Provider List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading provider ecosystem...</Text>
          </View>
        ) : filteredProviders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Server size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Providers Found</Text>
            <Text style={styles.emptySubtitle}>
              No providers match "{searchQuery}" in category {selectedCategory.toUpperCase()}.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProviders}
            keyExtractor={(item) => item.id}
            renderItem={renderProviderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={16}
            windowSize={10}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.cardBackground,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  toolBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  providerIcon: {
    width: 32,
    height: 32,
  },
  detailsCol: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  dot: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  urlText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
