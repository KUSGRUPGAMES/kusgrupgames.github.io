/** İbadet ve Keşfet için aynı kart ailesi; ekran genişliğine göre esner. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { Column, Row } from './Stack';

export function FeatureTile({ icon, title, description, onPress, featured = false }: {
  icon: IconName; title: string; description?: string; onPress: () => void; featured?: boolean;
}) {
  const theme = useTheme();
  const ink = featured ? theme.colors.onAccent : theme.colors.text;
  const gold = featured ? theme.colors.onAccentHighlight : theme.colors.highlight;
  return (
    <Card
      accent={featured}
      onPress={onPress}
      accessibilityLabel={title}
      padding="lg"
      style={{ flexBasis: '46%', flexGrow: 1, minHeight: featured ? 132 : 124,
        justifyContent: 'space-between' }}
    >
      <View style={{ width: 44, height: 44, borderRadius: theme.radius.md,
        backgroundColor: featured ? theme.colors.onAccentBorder : theme.colors.surfaceRaised,
        borderWidth: 1, borderColor: theme.colors.bezemeSolgun,
        alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} color={gold} size={24} />
      </View>
      <Row align="center" gap="xs" style={{ marginTop: theme.spacing.md }}>
        <Column flex={1} gap="xxs">
          <Text variant="bodyStrong" style={{ color: ink }} lines={2}>{title}</Text>
          {description ? <Text variant="caption" style={{ color: featured ? theme.colors.onAccent : theme.colors.textMuted }} lines={2}>{description}</Text> : null}
        </Column>
        <Icon name="chevronRight" size={16} color={gold} />
      </Row>
    </Card>
  );
}
