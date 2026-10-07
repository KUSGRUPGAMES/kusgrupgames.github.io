/**
 * Bir duanın gövdesi — dualar ekranında ve "Günün Duası" kartında aynı.
 * Kur'an duasında Arapça metin, meal, referans ve meal künyesi görünür
 * (§107); yazılmış duada "bu uygulama için yazıldı" notu görünür — iki tür
 * birbirine karışmaz.
 */
import React from 'react';
import { Text, ArabicText, SourceNote } from '@/ui';
import { useT } from '@/lib/i18n';
import { getTranslationInfo } from '@/features/quran/data';
import type { DuaEntry } from './pool';

export function DuaText({ dua, showOwnNote = false }: { dua: DuaEntry; showOwnNote?: boolean }) {
  const t = useT();
  if (dua.kind === 'quran') {
    return (
      <>
        {dua.arabic ? <ArabicText size="small">{dua.arabic}</ArabicText> : null}
        <Text variant="body" tone="muted">{dua.body}</Text>
        {dua.reference ? <Text variant="micro" tone="subtle">{dua.reference}</Text> : null}
        <SourceNote
          source={t('quran.translationSource', { name: getTranslationInfo().name, rights: t('quran.publicDomain') })}
        />
      </>
    );
  }
  return (
    <>
      <Text variant="body" tone="muted">{dua.body}</Text>
      {showOwnNote ? <Text variant="micro" tone="subtle">{t('dua.ownContent')}</Text> : null}
    </>
  );
}
