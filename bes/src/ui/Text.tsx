/**
 * Tipografi bileşeni — şartname §8, §10, §79.
 * Ham `<Text>` yerine hep bu kullanılır: ölçek token'dan gelir, renk
 * temadan gelir, Dynamic Type ölçeklemesi tek noktadan sınırlanır.
 */
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle, I18nManager } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { TypographyToken } from '@/theme/tokens';

export type TextTone = 'default' | 'muted' | 'subtle' | 'accent' | 'highlight' | 'onAccent' | 'danger' | 'success' | 'warning';

export interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  tone?: TextTone;
  align?: TextStyle['textAlign'];
  /** Satır kırpma — kart içi başlıklarda. */
  lines?: number;
}

export function Text({ variant = 'body', tone = 'default', align, lines, style, ...rest }: TextProps) {
  const theme = useTheme();
  const scale = theme.typography[variant];
  const color = toneColor(theme.colors, tone);
  const base: TextStyle = {
    fontSize: scale.size,
    lineHeight: scale.lineHeight,
    fontWeight: scale.weight as TextStyle['fontWeight'],
    color,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  };
  if (align) base.textAlign = align;
  return (
    <RNText
      {...rest}
      numberOfLines={lines}
      // Çok büyük Dynamic Type ayarında düzen kırılmasın diye üst sınır.
      maxFontSizeMultiplier={variant === 'arabic' || variant === 'arabicSmall' ? 1.6 : 1.8}
      style={[base, style]}
    />
  );
}

function toneColor(c: ReturnType<typeof useTheme>['colors'], tone: TextTone): string {
  switch (tone) {
    case 'muted': return c.textMuted;
    case 'subtle': return c.textSubtle;
    case 'accent': return c.accent;
    case 'highlight': return c.highlight;
    case 'onAccent': return c.onAccent;
    case 'danger': return c.danger;
    case 'success': return c.success;
    case 'warning': return c.warning;
    default: return c.text;
  }
}
