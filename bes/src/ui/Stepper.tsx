/** Artı/eksi sayaç — dakika düzeltmesi, hedef sayısı. Şartname §8. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { Row, Column } from './Stack';

export interface StepperProps {
  title: string;
  subtitle?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  /** Değerin yanına yazılacak birim, ör. "dk". */
  unit?: string;
  /**
   * Artı işareti gösterilsin mi. Yalnız **düzeltme** alanlarında anlamlı:
   * "+5 dk" ileri almak demektir. Saat, dakika, punto gibi mutlak
   * değerlerde işaret yanlıştır — hatırlatıcı saati "+21" görünüyordu.
   */
  signed?: boolean;
}

export function Stepper({
  title, subtitle, value, min = -60, max = 60, step = 1, onChange, unit, signed = false,
}: StepperProps) {
  const theme = useTheme();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const shown = `${signed && value > 0 ? '+' : ''}${value}${unit ? ` ${unit}` : ''}`;
  return (
    <Row align="center" gap="md" style={{ minHeight: 52 }}>
      <Column flex={1} gap="xxs">
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted">{subtitle}</Text> : null}
      </Column>
      <Row align="center" gap="xs">
        <IconButton name="minus" label={`${title} azalt`} size={18} filled disabled={value <= min} onPress={() => onChange(clamp(value - step))} />
        <View accessible accessibilityLabel={`${title}: ${shown}`} style={{ minWidth: 64, alignItems: 'center' }}>
          <Text variant="bodyStrong" tone="accent">{shown}</Text>
        </View>
        <IconButton name="plus" label={`${title} artır`} size={18} filled disabled={value >= max} onPress={() => onChange(clamp(value + step))} />
      </Row>
      <View style={{ width: theme.spacing.none }} />
    </Row>
  );
}
