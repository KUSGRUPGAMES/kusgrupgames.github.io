/**
 * Arapça metin — şartname §10.
 *
 * Kur'an ve dua metni buradan geçer: sağdan sola akar, harekeler için satır
 * aralığı geniştir, yazı tipi Amiri ailesindendir. Kullanıcı yazı boyutunu
 * ayarlayabilir (`scale`), ama satır aralığı oranı korunur ki harekeler
 * üst üste binmesin.
 */
import React from 'react';
import { Text as RNText, type TextStyle, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { SCRIPTURE_ALIGN, SCRIPTURE_DIRECTION } from '@/lib/i18n/direction';
import { scriptureFont, type ArabicFont } from '@/lib/i18n/fonts';

export interface ArabicTextProps extends Omit<RNTextProps, 'style'> {
  children: string;
  /** Büyük mushaf ölçeği mi, satır içi küçük ölçek mi. */
  size?: 'normal' | 'small';
  /** Kullanıcı yazı boyutu çarpanı (0.8 – 2.0). */
  scale?: number;
  font?: ArabicFont;
  tone?: 'default' | 'muted' | 'accent';
  style?: TextStyle;
}

const MIN_SCALE = 0.8;
const MAX_SCALE = 2.0;

export function ArabicText({
  children, size = 'normal', scale = 1, font, tone = 'default', style, ...rest
}: ArabicTextProps) {
  const theme = useTheme();
  const token = size === 'small' ? theme.typography.arabicSmall : theme.typography.arabic;
  const k = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number.isFinite(scale) ? scale : 1));
  const color = tone === 'muted' ? theme.colors.textMuted : tone === 'accent' ? theme.colors.accent : theme.colors.text;
  return (
    <RNText
      {...rest}
      // Ölçek kullanıcı ayarından geldiği için sistem çarpanı kapatılır;
      // aksi hâlde iki çarpan üst üste binip satır aralığını bozar.
      allowFontScaling={false}
      style={[
        {
          fontFamily: scriptureFont(font),
          fontSize: token.size * k,
          // Satır aralığı oranı sabit: harekeler bir üst satıra değmez.
          lineHeight: token.lineHeight * k,
          color,
          textAlign: SCRIPTURE_ALIGN,
          writingDirection: SCRIPTURE_DIRECTION,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
