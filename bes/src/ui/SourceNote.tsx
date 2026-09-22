/**
 * Kaynak künyesi — `CONTENT_SOURCES.md` kuralı: gösterilen her dinî metnin
 * kaynağı **ekranda görünür**. Meal, tefsir, hadis ve kıraat bu bileşen
 * olmadan ekrana çıkamaz.
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface SourceNoteProps {
  /** Ör. "Kur'an metni: Tanzil.net · Hafs/Uthmani". */
  source: string;
  /** Lisans adı, biliniyorsa. */
  license?: string;
}

export function SourceNote({ source, license }: SourceNoteProps) {
  const theme = useTheme();
  return (
    <View style={{ paddingTop: theme.spacing.sm }}>
      <Text variant="micro" tone="subtle">
        {license ? `${source} · ${license}` : source}
      </Text>
    </View>
  );
}
