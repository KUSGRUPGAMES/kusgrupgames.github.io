/** Ana sayfa düzeni — şartname §21. */
import React from 'react';
import { Stack } from 'expo-router';
import { Screen, Text, Card, ListItem, Row, IconButton, Button } from '@/ui';
import { useT } from '@/lib/i18n';
import { useHomeLayoutStore, PINNED_CARDS, type HomeCardId } from '@/store/homeLayout';

import type { StringKey } from '@/lib/i18n';

const CARD_LABEL: Record<HomeCardId, StringKey> = {
  nextPrayer: 'home.card.nextPrayer',
  friday: 'friday.title',
  ramadan: 'ramadan.title',
  dailyAyah: 'explore.dailyAyah',
  todayTimes: 'home.card.todayTimes',
  hijriDate: 'home.card.hijriDate',
  dailyDua: 'home.card.dailyDua',
  dailyKnowledge: 'home.card.dailyKnowledge',
  dailyName: 'home.card.dailyName',
  religiousDay: 'home.card.religiousDay',
  moon: 'home.card.moon',
};

export default function HomeLayoutScreen() {
  const t = useT();
  const cards = useHomeLayoutStore((s) => s.cards);
  const toggle = useHomeLayoutStore((s) => s.toggle);
  const move = useHomeLayoutStore((s) => s.move);
  const reset = useHomeLayoutStore((s) => s.reset);

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: t('home.customize') }} />
      <Text variant="caption" tone="muted">{t('home.customizeHint')}</Text>

      <Card padding="sm">
        {cards.map((c, i) => {
          const sabit = PINNED_CARDS.includes(c.id);
          return (
            <ListItem
              key={c.id}
              title={t(CARD_LABEL[c.id])}
              {...(sabit ? { subtitle: t('home.cardPinned') } : {})}
              chevron={false}
              /* Sıralama düğmeleri "aşağı ok / sağ ok" idi ve ekran okuyucuya
                 "İleri" / "Geri" diyordu: yukarı taşıyan düğme sağa bakıyor,
                 adı da "Geri" diye okunuyordu. Artık yön hem çizimde hem
                 adda doğru. */
              right={
                <Row gap="xs" align="center">
                  <IconButton
                    name="chevronUp"
                    label={t('home.moveUp')}
                    size={16}
                    disabled={i === 0}
                    onPress={() => move(c.id, -1)}
                  />
                  <IconButton
                    name="chevronDown"
                    label={t('home.moveDown')}
                    size={16}
                    disabled={i === cards.length - 1}
                    onPress={() => move(c.id, 1)}
                  />
                  <IconButton
                    name={c.visible ? 'check' : 'close'}
                    label={c.visible ? t('common.disable') : t('common.enable')}
                    size={18}
                    disabled={sabit}
                    onPress={() => toggle(c.id)}
                  />
                </Row>
              }
            />
          );
        })}
      </Card>

      <Row style={{ marginTop: 16 }}>
        <Button label={t('home.reset')} variant="secondary" icon="refresh" onPress={reset} />
      </Row>
    </Screen>
  );
}
