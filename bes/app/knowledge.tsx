/** İslami bilgi kütüphanesi — şartname §25, §53. */
import React, { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { Screen, SectionHeader, Card, Chip, Row, Column, Text, Field, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { KNOWLEDGE, KNOWLEDGE_TOPICS, type KnowledgeTopic } from '@/content/knowledge';
import { normalizeSearch } from '@/features/location/normalize';

export default function KnowledgeScreen() {
  const t = useT();
  const theme = useTheme();
  const [konu, setKonu] = useState<KnowledgeTopic | null>(null);
  const [sorgu, setSorgu] = useState('');

  const liste = useMemo(() => {
    const q = normalizeSearch(sorgu);
    return KNOWLEDGE.filter((k) => {
      if (konu && k.topic !== konu) return false;
      if (!q) return true;
      return normalizeSearch(k.title).includes(q) || normalizeSearch(k.body).includes(q);
    });
  }, [konu, sorgu]);

  return (
    <Screen topInset={false} scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('knowledge.title') }} />
      <SectionHeader title={t('knowledge.topics')} />

      <Field label={t('common.search')} value={sorgu} onChangeText={setSorgu} />

      <Row gap="sm" wrap style={{ marginTop: theme.spacing.md }}>
        <Chip label={t('common.all')} selected={konu === null} onPress={() => setKonu(null)} />
        {KNOWLEDGE_TOPICS.map((c) => (
          <Chip key={c.id} label={c.label} selected={konu === c.id} onPress={() => setKonu(c.id)} />
        ))}
      </Row>

      {liste.length === 0 ? (
        <EmptyState icon="search" title={t('empty.title')} description={t('empty.body')} />
      ) : (
        <Column gap="md" style={{ marginTop: theme.spacing.md }}>
          {liste.map((k) => (
            <Card key={k.id}>
              <Column gap="sm">
                <Text variant="title3">{k.title}</Text>
                <Text variant="body" tone="muted">{k.body}</Text>
              </Column>
            </Card>
          ))}
        </Column>
      )}
    </Screen>
  );
}
