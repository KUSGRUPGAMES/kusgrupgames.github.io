/** Tanılama — şartname §85. Kayıtlar cihazda kalır, kendiliğinden gitmez. */
import React, { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Button, Banner, EmptyState, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { getCrashRecords, clearCrashRecords, formatForSupport } from '@/lib/crash/reporter';
import { Brand } from '@/config/brand';

export default function DiagnosticsScreen() {
  const t = useT();
  const theme = useTheme();
  const [kayitlar, setKayitlar] = useState(() => [...getCrashRecords()]);
  const [kopyalandi, setKopyalandi] = useState(false);

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: t('diagnostics.title') }} />

      <SectionHeader title={t('diagnostics.title')} subtitle={`${Brand.appName} ${Brand.version}`} />
      <Banner tone="info" title={t('settings.privacy')} description={t('diagnostics.localOnly')} />

      {kayitlar.length === 0 ? (
        <EmptyState icon="check" title={t('diagnostics.noCrashes')} description={t('diagnostics.localOnly')} />
      ) : (
        <>
          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
            {kayitlar.map((k, i) => (
              <Column key={k.at + i} gap="xxs" style={{ paddingVertical: theme.spacing.sm }}>
                {i > 0 ? <Divider /> : null}
                <Text variant="bodyStrong">{k.name}</Text>
                <Text variant="caption" tone="muted" lines={3}>{k.message}</Text>
                <Text variant="micro" tone="subtle">{k.at}</Text>
              </Column>
            ))}
          </Card>

          <Row gap="sm" style={{ marginTop: theme.spacing.lg }}>
            <Button
              label={t('diagnostics.copyForSupport')}
              icon="copy"
              variant="secondary"
              size="sm"
              onPress={async () => {
                await Clipboard.setStringAsync(formatForSupport(kayitlar));
                setKopyalandi(true);
              }}
            />
            <Button
              label={t('diagnostics.clear')}
              icon="close"
              variant="ghost"
              size="sm"
              onPress={() => { clearCrashRecords(); setKayitlar([]); }}
            />
          </Row>

          {kopyalandi ? (
            <Banner tone="success" title={t('diagnostics.copied')} />
          ) : null}
        </>
      )}
    </Screen>
  );
}
