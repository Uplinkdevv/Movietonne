export const COLORS = {
  // Brand Backgrounds - MovieTonee Deep Cinema
  background: '#0A0D14', // Deep midnight cinema slate
  cardBackground: '#101522', // Sleek dark card
  cardSecondary: '#1A2234', // Secondary surface
  modalBackground: '#101522',
  
  // Brand Accents - MovieTonee Signature
  primary: '#6366F1', // Royal Indigo
  primaryHover: '#4F46E5',
  secondary: '#8B5CF6', // Purple Glow
  accent: '#F59E0B', // Cinema Gold / Amber
  accentCyan: '#06B6D4',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Text Colors
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // UI Elements
  border: '#1A2234',
  borderHighlight: '#2A374F',
  overlay: 'rgba(10, 13, 20, 0.78)',
  heroGradient: ['transparent', 'rgba(10, 13, 20, 0.65)', '#0A0D14'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
  round: 9999,
};

export const TYPOGRAPHY = {
  titleLarge: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  bodyRegular: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
};
