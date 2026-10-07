/**
 * Uzak içerik katmanı — yönetici panelinden yönetilen içerik (D36).
 *
 * Panel `content_items` tablosuna yazar; uygulama yayınlanmış içeriği kendi
 * dilinde indirir, telefonda saklar (internetsiz de çalışır) ve yerleşik
 * içerikle birleştirir. Yeni derleme gerekmez.
 *
 * Türler:
 * - `announcement`, `info_article`: kendi ekranlarında listelenir.
 * - `share_card`: hazır kartlar ekranında "Topluluk" sekmesi.
 * - `dua`: dualar listesine ve "Günün Duası" sırasına katılır.
 * - `knowledge`: "Günün Bilgisi" ve Bilgiler ekranına katılır.
 * - `verse`: "Günün Âyeti" havuzu. Havuz boşsa âyet bütün Kur'an'dan seçilir;
 *   doluysa yalnız havuzdan. Metin ve meal paketten okunur (yalnız sure:âyet).
 * - `hide`: yerleşik bir maddeyi gizler (`extra.target` = "dua:<id>",
 *   "knowledge:<id>", "card:<id>"). Panelde "düzenle" = gizle + yeni madde.
 *
 * Gizlilik: istek hesapsızdır; yalnız dil kodu gider (gizlilik sayfası §7).
 *
 * Bu dosya saftır (sınanır); ağ ve depolama `remoteRuntime.ts`te.
 */
import { create } from 'zustand';

export type RemoteType = 'announcement' | 'info_article' | 'share_card' | 'dua' | 'knowledge' | 'verse' | 'hide';

export interface RemoteItem {
  id: string;
  type: RemoteType;
  title: string;
  body: string;
  extra: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
}

interface RemoteState {
  locale: string | null;
  items: RemoteItem[];
  fetchedAt: number | null;
  /** Her değişimde artar: önbellekli havuzlar (allDuas) buna bakar. */
  version: number;
}

export const useRemoteContent = create<RemoteState>(() => ({ locale: null, items: [], fetchedAt: null, version: 0 }));

const TURLER: readonly RemoteType[] = ['announcement', 'info_article', 'share_card', 'dua', 'knowledge', 'verse', 'hide'];

/** Sunucudan gelen satırı doğrular; tanınmayan tür ya da bozuk alan sessizce atlanır. */
export function parseRemoteRows(rows: unknown): RemoteItem[] {
  if (!Array.isArray(rows)) return [];
  const out: RemoteItem[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    if (!r || typeof r.id !== 'string' || typeof r.type !== 'string' || !TURLER.includes(r.type as RemoteType)) continue;
    out.push({
      id: r.id,
      type: r.type as RemoteType,
      title: typeof r.title === 'string' ? r.title : '',
      body: typeof r.body === 'string' ? r.body : '',
      extra: r.extra && typeof r.extra === 'object' && !Array.isArray(r.extra) ? r.extra as Record<string, unknown> : {},
      sortOrder: typeof r.sort_order === 'number' ? r.sort_order : 0,
      createdAt: typeof r.created_at === 'string' ? r.created_at : '',
    });
  }
  return out;
}

export function ofType(items: readonly RemoteItem[], type: RemoteType): RemoteItem[] {
  return items.filter((i) => i.type === type);
}

/** Gizlenen yerleşik maddeler: "dua:<id>" biçiminde anahtar kümesi. */
export function hiddenTargets(items: readonly RemoteItem[]): Set<string> {
  return new Set(ofType(items, 'hide').map((i) => String(i.extra.target ?? '')).filter(Boolean));
}

/** Âyet havuzu: geçerli sure:âyet çiftleri, panel sırasıyla. */
export function versePool(items: readonly RemoteItem[]): { surah: number; ayah: number }[] {
  return ofType(items, 'verse')
    .map((i) => ({ surah: Number(i.extra.surah), ayah: Number(i.extra.ayah) }))
    .filter((v) => Number.isInteger(v.surah) && v.surah >= 1 && v.surah <= 114 && Number.isInteger(v.ayah) && v.ayah >= 1);
}
