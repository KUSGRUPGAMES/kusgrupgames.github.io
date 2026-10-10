/**
 * Dualar — şartname §24, §39.
 * İki kaynak tek listede (`features/duas/pool.ts`): Kur'an'daki dualar
 * (Arapça + meal + künye) ve bu uygulama için yazılmış dualar.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen, SectionHeader, Card, Chip, Row, Column, Text, IconButton, Banner, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { DUA_CATEGORIES, type DuaCategory } from '@/content/duas';
import { useAllDuas } from '@/features/duas/pool';
import { DuaText } from '@/features/duas/DuaText';
import { useFavoriteStore } from '@/store/favorites';

export default function DuasScreen() {
  const t = useT();
  const theme = useTheme();
  // Arama sonucundan tekil bir duaya gelindiyse: kategori ona göre açılır,
  // liste o duaya kaydırılır ve kısa süre vurgulanır (önceden hep /duas
  // ana sayfasına gidiyordu, hangi duya tıklanırsa tıklansın).
  const { id: hedefId } = useLocalSearchParams<{ id?: string }>();
  const [kategori, setKategori] = useState<DuaCategory | null>(null);
  const [yalnizKuran, setYalnizKuran] = useState(false);
  const [vurgulu, setVurgulu] = useState<string | null>(null);
  const fav = useFavoriteStore();
  const scrollRef = useRef<ScrollView>(null);
  const konumlar = useRef<Record<string, number>>({});

  const duaListesi = useAllDuas();
  const liste = useMemo(
    () => duaListesi.filter((d) => (!kategori || d.category === kategori) && (!yalnizKuran || d.kind === 'quran')),
    [kategori, yalnizKuran, duaListesi],
  );

  useEffect(() => {
    if (!hedefId) return;
    const hedef = duaListesi.find((d) => d.id === hedefId);
    if (!hedef) return;
    setKategori(hedef.category);
    setYalnizKuran(false);
    setVurgulu(hedefId);
    const kaydir = setTimeout(() => {
      const y = konumlar.current[hedefId];
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - theme.spacing.lg), animated: true });
    }, 250);
    const sonlandir = setTimeout(() => setVurgulu(null), 3000);
    return () => { clearTimeout(kaydir); clearTimeout(sonlandir); };
  }, [hedefId, duaListesi]);

  return (
    <Screen topInset={false} scroll scrollRef={scrollRef} motif="arch">
      <Stack.Screen options={{ headerShown: true, title: t('dua.title') }} />
      <SectionHeader title={t('dua.categories')} />

      <Row gap="sm" wrap>
        <Chip label={t('common.all')} selected={kategori === null && !yalnizKuran}
          onPress={() => { setKategori(null); setYalnizKuran(false); }} />
        <Chip label={t('dua.fromQuran')} selected={yalnizKuran} onPress={() => setYalnizKuran(!yalnizKuran)} />
        {DUA_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={t(`dua.cat.${c.id}`)}
            selected={kategori === c.id}
            onPress={() => setKategori(c.id)}
          />
        ))}
      </Row>

      <Banner tone="info" title={t('common.source')} description={t('dua.sourcesNote')} />

      {liste.length === 0 ? (
        <EmptyState icon="heart" title={t('empty.title')} description={t('empty.body')} />
      ) : (
        <Column gap="md" style={{ marginTop: theme.spacing.md }}>
          {liste.map((d) => {
            const secili = fav.has('dua', d.id);
            return (
              <Card
                key={d.id}
                onLayout={(e) => { konumlar.current[d.id] = e.nativeEvent.layout.y; }}
                style={vurgulu === d.id
                  ? { borderWidth: 2, borderColor: theme.colors.highlight }
                  : undefined}
              >
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
                  <DuaText dua={d} />
                </Column>
              </Card>
            );
          })}
        </Column>
      )}
    </Screen>
  );
}
