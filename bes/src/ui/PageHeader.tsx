/** Ana bölümlerde ortak başlık: ikon, başlık ve kısa alt metin. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Row, Column } from './Stack';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export function PageHeader({ title, icon, subtitle }: { title: string; icon: IconName; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.xxl }}>
      <Row align="center" gap="md">
        <View style={{ width: 52, height: 52, borderRadius: theme.radius.lg,
          borderWidth: 1, borderColor: theme.colors.bezemeSolgun,
          backgroundColor: theme.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={26} color={theme.colors.highlight} />
        </View>
        <Column flex={1} gap="xxs">
          <Text variant="title1" accessibilityRole="header">{title}</Text>
          {subtitle ? <Text variant="caption" tone="muted">{subtitle}</Text> : null}
        </Column>
      </Row>
      <View style={{ marginTop: theme.spacing.lg, height: 1,
        backgroundColor: theme.colors.bezemeSolgun }} />
    </View>
  );
}
