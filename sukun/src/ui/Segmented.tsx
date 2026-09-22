/** Segment seçici — ikiden dörde kadar seçenek. Şartname §8. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /**
   * Dar ekranda gösterilecek kısa karşılık. Erişilebilirlik adı **her zaman**
   * uzun `label`tır; ekran okuyucu kısaltmayı okumaz.
   */
  short?: string;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  const theme = useTheme();
  // Dört seçenekte hücre ~70 piksele düşüyor; `callout` taşıyor.
  const variant = options.length >= 4 ? 'caption' : 'callout';
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.radius.pill,
        padding: theme.spacing.xxs,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              // `min-width: auto` esnek hücrenin içeriğinden küçülmesini
              // engelliyor; dört uzun etiketli seçici 320 piksellik ekranda
              // birbirinin üstüne biniyordu (ibadet defteri). Sıfırlanmazsa
              // hücre metin genişliğinin altına inemez.
              minWidth: 0,
              // 44, Apple HIG'in en küçük dokunma hedefi; Android 48dp istiyor
              // ama listede sıkışık durmasın diye hitSlop ile tamamlanıyor.
              minHeight: 44,
              paddingHorizontal: theme.spacing.xs,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
              backgroundColor: active ? theme.colors.surface : 'transparent',
            }}
          >
            <Text variant={variant} tone={active ? 'accent' : 'muted'} align="center" lines={1}>
              {o.short ?? o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
