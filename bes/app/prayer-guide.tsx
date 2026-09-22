/** Namaz rehberi — şartname §40. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Screen, SectionHeader, Card, Column, Row, Text, Chip, Banner, Divider } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { PRAYER_GUIDE, GUIDE_NOTE } from '@/content/prayerGuide';

export default function PrayerGuideScreen() {
  const t = useT();
  const theme = useTheme();
  const [acik, setAcik] = useState(PRAYER_GUIDE[0]!.id);
  const bolum = PRAYER_GUIDE.find((s) => s.id === acik) ?? PRAYER_GUIDE[0]!;

  return (
    <Screen scroll motif="arch">
      <Stack.Screen options={{ headerShown: true, title: t('guide.title') }} />

      <Banner tone="info" title={t('guide.disclaimer')} description={GUIDE_NOTE} />

      <Row gap="sm" wrap style={{ marginTop: theme.spacing.md }}>
        {PRAYER_GUIDE.map((s) => (
          <Chip key={s.id} label={s.title} selected={s.id === acik} onPress={() => setAcik(s.id)} />
        ))}
      </Row>

      <SectionHeader title={bolum.title} subtitle={bolum.summary} />

      <Card>
        <Column gap="lg">
          {bolum.steps.map((adim, i) => (
            <View key={adim.title}>
              {i > 0 ? <Divider /> : null}
              <Column gap="xs" style={{ paddingTop: i > 0 ? theme.spacing.md : 0 }}>
                <Row gap="sm" align="center">
                  <Text variant="micro" tone="subtle">{String(i + 1)}</Text>
                  <Text variant="bodyStrong">{adim.title}</Text>
                </Row>
                <Text variant="body" tone="muted">{adim.body}</Text>
              </Column>
            </View>
          ))}
        </Column>
      </Card>
    </Screen>
  );
}
