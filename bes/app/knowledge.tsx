/** İslami bilgi kütüphanesi — şartname §25, §53. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen, SectionHeader, Card, Chip, Row, Column, Text, Field, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { KNOWLEDGE_TOPICS, type KnowledgeTopic } from '@/content/knowledge';
import { useAllKnowledge } from '@/features/content/pools';
import { normalizeSearch } from '@/features/location/normalize';

export default function KnowledgeScreen() {
  const t = useT();
  const theme = useTheme();
  // Arama sonucundan tekil bir bilgi maddesine gelindiyse: konu ona göre
  // açılır, liste o maddeye kaydırılır ve kısa süre vurgulanır (önceden hep
  // /knowledge ana sayfasına gidiyordu).
  const { id: hedefId } = useLocalSearchParams<{ id?: string }>();
  const [konu, setKonu] = useState<KnowledgeTopic | null>(null);
  const [sorgu, setSorgu] = useState('');
  const [vurgulu, setVurgulu] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const konumlar = useRef<Record<string, number>>({});

  const bilgiler = useAllKnowledge();
  const liste = useMemo(() => {
    const q = normalizeSearch(sorgu);
    return bilgiler.filter((k) => {
      if (konu && k.topic !== konu) return false;
      if (!q) return true;
      return normalizeSearch(k.title).includes(q) || normalizeSearch(k.body).includes(q);
    });
  }, [konu, sorgu, bilgiler]);

  useEffect(() => {
    if (!hedefId) return;
    const hedef = bilgiler.find((k) => k.id === hedefId);
    if (!hedef) return;
    setKonu(hedef.topic);
    setVurgulu(hedefId);
    const kaydir = setTimeout(() => {
      const y = konumlar.current[hedefId];
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - theme.spacing.lg), animated: true });
    }, 250);
    const sonlandir = setTimeout(() => setVurgulu(null), 3000);
    return () => { clearTimeout(kaydir); clearTimeout(sonlandir); };
  }, [hedefId, bilgiler]);

  return (
    <Screen topInset={false} scroll scrollRef={scrollRef} motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('knowledge.title') }} />
      <SectionHeader title={t('knowledge.topics')} />

      <Field label={t('common.search')} value={sorgu} onChangeText={setSorgu} />

      <Row gap="sm" wrap style={{ marginTop: theme.spacing.md }}>
        <Chip label={t('common.all')} selected={konu === null} onPress={() => setKonu(null)} />
        {KNOWLEDGE_TOPICS.map((c) => (
          <Chip key={c.id} label={t(`knowledge.topic.${c.id}`)} selected={konu === c.id} onPress={() => setKonu(c.id)} />
        ))}
      </Row>

      {liste.length === 0 ? (
        <EmptyState icon="search" title={t('empty.title')} description={t('empty.body')} />
      ) : (
        <Column gap="md" style={{ marginTop: theme.spacing.md }}>
          {liste.map((k) => (
            <Card
              key={k.id}
              onLayout={(e) => { konumlar.current[k.id] = e.nativeEvent.layout.y; }}
              style={vurgulu === k.id
                ? { borderWidth: 2, borderColor: theme.colors.highlight }
                : undefined}
            >
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
