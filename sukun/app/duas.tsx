/** Dualar — şartname §24, §39. */
import React, { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { Screen, SectionHeader, Card, Chip, Row, Column, Text, IconButton, Banner, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { DUAS, DUA_CATEGORIES, type DuaCategory } from '@/content/duas';
import { useFavoriteStore } from '@/store/favorites';

export default function DuasScreen() {
  const t = useT();
  const theme = useTheme();
  const [kategori, setKategori] = useState<DuaCategory | null>(null);
  const fav = useFavoriteStore();

  const liste = useMemo(
    () => (kategori ? DUAS.filter((d) => d.category === kategori) : DUAS),
    [kategori],
  );

  return (
    <Screen scroll motif="arch">
      <Stack.Screen options={{ headerShown: true, title: t('dua.title') }} />
      <SectionHeader title={t('dua.categories')} />

      <Row gap="sm" wrap>
        <Chip label={t('common.all')} selected={kategori === null} onPress={() => setKategori(null)} />
        {DUA_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            selected={kategori === c.id}
            onPress={() => setKategori(c.id)}
          />
        ))}
      </Row>

      <Banner tone="info" title={t('common.source')} description={t('dua.ownContent')} />

      {liste.length === 0 ? (
        <EmptyState icon="heart" title={t('empty.title')} description={t('empty.body')} />
      ) : (
        <Column gap="md" style={{ marginTop: theme.spacing.md }}>
          {liste.map((d) => {
            const secili = fav.has('dua', d.id);
            return (
              <Card key={d.id}>
                <Column gap="sm">
                  <Row align="center" justify="space-between">
                    <Text variant="title3" style={{ flex: 1 }}>{d.title}</Text>
                    <IconButton
                      name="heart"
                      label={secili ? t('favorite.remove') : t('favorite.add')}
                      size={18}
                      color={secili ? theme.colors.highlight : theme.colors.textSubtle}
                      onPress={() => fav.toggle('dua', d.id)}
                    />
                  </Row>
                  <Text variant="body" tone="muted">{d.body}</Text>
                </Column>
              </Card>
            );
          })}
        </Column>
      )}
    </Screen>
  );
}
