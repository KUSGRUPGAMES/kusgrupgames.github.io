/**
 * Birleşik dua listesi — dualar ekranı, "Günün Duası" kartı ve widget aynı
 * listeyi kullanır; ayrışırlarsa ana sayfa ile widget farklı dua gösterir.
 *
 * İki kaynak, karıştırılmadan:
 * - `own`: bu uygulama için yazılmış Türkçe dualar (`content/duas.ts`).
 * - `quran`: Kur'an'daki dualar (`content/quranDuas.ts`). Arapça metin ve
 *   meal paketten okunur; bir âyet bulunamazsa o dua listeye girmez — metin
 *   asla elle doldurulmaz.
 */
import { DUAS, type DuaCategory } from '@/content/duas';
import { QURAN_DUAS, type QuranDua } from '@/content/quranDuas';
import { getAyah, getSurah, getTranslation } from '@/features/quran/data';

export interface DuaEntry {
  id: string;
  category: DuaCategory;
  title: string;
  /** Türkçe metin: yazılmış dua ya da Elmalılı meali. */
  body: string;
  kind: 'own' | 'quran';
  arabic?: string;
  /** "Bakara 201" ya da "Tâhâ 25-28". */
  reference?: string;
  surah?: number;
  ayah?: number;
}

export function resolveQuranDua(d: QuranDua): DuaEntry | null {
  const sure = getSurah(d.surah);
  if (!sure) return null;
  const son = d.to ?? d.ayah;
  const arapca: string[] = [];
  const meal: string[] = [];
  for (let a = d.ayah; a <= son; a++) {
    const ayet = getAyah(d.surah, a);
    const m = getTranslation(d.surah, a);
    if (!ayet || !m) return null;
    arapca.push(ayet.text);
    meal.push(m);
  }
  return {
    id: d.id,
    category: d.category,
    title: d.title,
    body: meal.join(' '),
    kind: 'quran',
    arabic: arapca.join(' '),
    reference: `${sure.nameTr} ${d.ayah}${d.to ? `-${d.to}` : ''}`,
    surah: d.surah,
    ayah: d.ayah,
  };
}

let onbellek: DuaEntry[] | null = null;

/** Yazılmış dualar önce, Kur'an duaları sonra; sıra sabittir (günlük seçim buna dayanır). */
export function allDuas(): DuaEntry[] {
  if (onbellek) return onbellek;
  const kendi: DuaEntry[] = DUAS.map((d) => ({ ...d, kind: 'own' }));
  const kuran = QURAN_DUAS.map(resolveQuranDua).filter((d): d is DuaEntry => d !== null);
  onbellek = [...kendi, ...kuran];
  return onbellek;
}
