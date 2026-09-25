/** Kart yüzeyi — şartname §8. */
import React, { Children, cloneElement, isValidElement } from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Motif } from './motif/Motif';
import { Gradient } from './Gradient';
import { ListItem } from './ListItem';
import { Toggle } from './Toggle';
import type { MotifAdi } from './motif/Motif';
import type { Spacing, Radius } from '@/theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  padding?: Spacing;
  radius?: Radius;
  /** Vurgulu kart — marka renginde dolgu (bir sonraki vakit kartı gibi). */
  accent?: boolean;
  motif?: MotifAdi;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children, padding = 'lg', radius = 'lg', accent = false, motif, onPress, accessibilityLabel, style,
}: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: accent ? theme.colors.accentSurface : theme.colors.surface,
    borderRadius: theme.radius[radius],
    padding: theme.spacing[padding],
    borderWidth: 1,
    borderColor: accent ? theme.colors.onAccentHighlight
      : theme.name === 'dark' ? theme.colors.bezemeSolgun : 'rgba(138,106,42,0.16)',
    // Kırpma yalnız dolgulu (gradyan/motif) kartta gerekir; düz kartta açık
    // olursa iOS gölgeyi de keser.
    ...(accent || motif ? { overflow: 'hidden' as const } : {}),
    // Açık temada kart hafif gölgeyle zeminden ayrılır.
    ...(theme.name === 'light' && !accent ? {
      shadowColor: theme.colors.text, shadowOpacity: 0.07, shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 }, elevation: 2,
    } : {}),
  };
  // Kartın son satırının alt çizgisi kapatılır: her satır kendi altına çizgi
  // çiziyordu ve kartın dibinde kenarlığın hemen üstünde ikinci bir çizgi
  // kalıyordu (açık temada belirgin).
  const cocuklar = Children.toArray(children);
  const son = cocuklar[cocuklar.length - 1];
  if (isValidElement(son) && (son.type === ListItem || son.type === Toggle)) {
    cocuklar[cocuklar.length - 1] = cloneElement(son as React.ReactElement<{ divider?: boolean }>, { divider: false });
  }
  const inner = (
    <>
      {/* Marka kartı ikonun kutucuğu gibi koyulaşır (D18). */}
      {accent ? <Gradient colors={theme.colors.accentGradient} /> : null}
      {motif ? <Motif name={motif} color={accent ? theme.colors.onAccent : undefined} /> : null}
      {cocuklar}
    </>
  );
  if (!onPress) return <View style={[base, style]}>{inner}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed ? { opacity: 0.85 } : null, style]}
    >
      {inner}
    </Pressable>
  );
}
