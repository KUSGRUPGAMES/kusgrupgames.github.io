/** Hac ve Umre rehberi — şartname §54. Tamamen çevrimdışı. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Chip, Banner, Divider, ProgressBar, Toggle,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { HAJJ_GUIDE, HAJJ_CHECKLIST, HAJJ_NOTE } from '@/content/hajjGuide';

export default function HajjScreen() {
  const t = useT();
  const theme = useTheme();
  const [acik, setAcik] = useState(HAJJ_GUIDE[0]!.id);
  const [hazir, setHazir] = useState<Record<string, boolean>>({});

  const bolum = HAJJ_GUIDE.find((s) => s.id === acik) ?? HAJJ_GUIDE[0]!;
  const gruplar = useMemo(() => {
    const harita = new Map<string, typeof HAJJ_CHECKLIST[number][]>();
    for (const item of HAJJ_CHECKLIST) {
      const liste = harita.get(item.group) ?? [];
      liste.push(item);
      harita.set(item.group, liste);
    }
    return [...harita.entries()];
  }, []);
  const tamam = HAJJ_CHECKLIST.filter((i) => hazir[i.id]).length;

  return (
    <Screen scroll motif="arch">
      <Stack.Screen options={{ headerShown: true, title: t('hajj.title') }} />

      <Banner tone="info" title={t('hajj.offline')} description={HAJJ_NOTE} />

      <SectionHeader title={t('hajj.guide')} />
      <Row gap="sm" wrap>
        {HAJJ_GUIDE.map((s) => (
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
                <Text variant="bodyStrong">{adim.title}</Text>
                <Text variant="body" tone="muted">{adim.body}</Text>
              </Column>
            </View>
          ))}
        </Column>
      </Card>

      <SectionHeader
        title={t('hajj.checklist')}
        subtitle={t('hajj.checklistProgress', { done: tamam, total: HAJJ_CHECKLIST.length })}
      />
      <ProgressBar
        value={tamam / HAJJ_CHECKLIST.length}
        accessibilityLabel={t('hajj.checklistProgress', { done: tamam, total: HAJJ_CHECKLIST.length })}
      />

      <Column gap="md" style={{ marginTop: theme.spacing.md }}>
        {gruplar.map(([grup, maddeler]) => (
          <Card key={grup} padding="sm">
            <Text variant="caption" tone="muted" style={{ paddingHorizontal: theme.spacing.xs }}>{grup}</Text>
            {maddeler.map((m) => (
              <Toggle
                key={m.id}
                title={m.label}
                value={hazir[m.id] ?? false}
                onChange={(v) => setHazir({ ...hazir, [m.id]: v })}
              />
            ))}
          </Card>
        ))}
      </Column>
    </Screen>
  );
}
