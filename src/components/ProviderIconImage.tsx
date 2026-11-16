import React, { useState, useEffect } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { Server } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

interface ProviderIconImageProps {
  iconUri?: string | null;
  size?: number;
  iconColor?: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * Robust provider icon component that displays the remote CDN asset,
 * and automatically falls back to a clean Lucide Server icon if the asset
 * fails to load (e.g. offline, CDN error, broken URL).
 */
export const ProviderIconImage: React.FC<ProviderIconImageProps> = ({
  iconUri,
  size = 22,
  iconColor = COLORS.primary,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [iconUri]);

  if (!iconUri || hasError) {
    return <Server size={size} color={iconColor} />;
  }

  return (
    <Image
      source={{ uri: iconUri }}
      style={style || { width: size + 4, height: size + 4, borderRadius: 4 }}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
};
