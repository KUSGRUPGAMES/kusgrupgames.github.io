/**
 * Pro özelliğinin altında küçük not: rozet + "şimdilik ücretsiz" / "deneme".
 * Satın almış kullanıcıya gösterilmez.
 */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ProBadge, Row, Text } from '@/ui';
import { useT } from '@/lib/i18n';
import { useProAccess } from './useProAccess';

export function ProFeatureNote({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useT();
  const erisim = useProAccess();
  if (erisim.reason === 'purchased' || erisim.reason === 'none') return null;
  return (
    <Row gap="xs" align="center" style={style}>
      <ProBadge />
      <Text variant="micro" tone="subtle">
        {erisim.reason === 'trial' ? t('pro.trialActive', { n: erisim.trialDaysLeft ?? 0 }) : t('pro.launchShort')}
      </Text>
    </Row>
  );
}
