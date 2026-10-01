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
import { DUAS, DUA_CATEGORIES, type DuaCategory } from '@/content/duas';
import { hiddenTargets, ofType, useRemoteContent, type RemoteItem } from '@/features/content/remote';
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

const KATEGORILER = new Set<string>(DUA_CATEGORIES.map((c) => c.id));

/**
 * Panelden eklenen dua (D36). `extra.surah/ayah[/to]` verilmişse Kur'an
 * duasıdır ve metni paketten okunur; verilmemişse yazılı metindir.
 */
export function remoteDua(r: RemoteItem): DuaEntry | null {
  const kategori = (typeof r.extra.category === 'string' && KATEGORILER.has(r.extra.category)
    ? r.extra.category : 'iman') as DuaCategory;
  const surah = Number(r.extra.surah); const ayah = Number(r.extra.ayah);
  if (Number.isInteger(surah) && Number.isInteger(ayah) && surah > 0 && ayah > 0) {
    const to = Number(r.extra.to);
    return resolveQuranDua({ id: `r-${r.id}`, category: kategori, title: r.title, surah, ayah, ...(Number.isInteger(to) && to > ayah ? { to } : {}) });
  }
  if (!r.body.trim()) return null;
  return {
    id: `r-${r.id}`, category: kategori, title: r.title || r.body.slice(0, 40), body: r.body, kind: 'own',
    ...(typeof r.extra.arabic === 'string' && r.extra.arabic ? { arabic: r.extra.arabic } : {}),
    ...(typeof r.extra.reference === 'string' && r.extra.reference ? { reference: r.extra.reference } : {}),
  };
}

let yerlesik: DuaEntry[] | null = null;
let onbellek: { surum: number; liste: DuaEntry[] } | null = null;

/**
 * Yazılmış dualar, Kur'an duaları, sonra panelden eklenenler; panelden
 * gizlenen yerleşikler çıkar. Sıra sabittir (günlük seçim buna dayanır).
 */
export function allDuas(): DuaEntry[] {
  const { items, version } = useRemoteContent.getState();
  if (onbellek && onbellek.surum === version) return onbellek.liste;
  if (!yerlesik) {
    const kendi: DuaEntry[] = DUAS.map((d) => ({ ...d, kind: 'own' }));
    const kuran = QURAN_DUAS.map(resolveQuranDua).filter((d): d is DuaEntry => d !== null);
    yerlesik = [...kendi, ...kuran];
  }
  const gizli = hiddenTargets(items);
  const uzak = ofType(items, 'dua').map(remoteDua).filter((d): d is DuaEntry => d !== null);
  const liste = [...yerlesik.filter((d) => !gizli.has(`dua:${d.id}`)), ...uzak];
  onbellek = { surum: version, liste };
  return liste;
}

/** Bileşenler için: uzak içerik değişince yeniden çizer. */
export function useAllDuas(): DuaEntry[] {
  useRemoteContent((s) => s.version);
  return allDuas();
}
