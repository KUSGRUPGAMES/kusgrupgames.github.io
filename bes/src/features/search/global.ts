/**
 * Akıllı global arama — şartname §51, §78.
 *
 * Tek kutu, her şeyi bulur: sure adı, âyet numarası ("2:255" ya da
 * "bakara 255"), Arapça kelime, dua, esmâ ve bilgi maddesi.
 *
 * Türkçe normalizasyonu `location/normalize` ile ortaktır: "ISTANBUL" ile
 * "istanbul" aynı sonucu veriyorsa "IHLAS" ile "ihlas" da aynı sonucu
 * vermelidir — iki ayrı normalizasyon yazmak bu tutarlılığı bozardı.
 */
import { normalizeSearch, matchScore } from '@/features/location/normalize';
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function containsArabicQuery(text: string): boolean {
  return ARABIC_RANGE.test(text);
}
import { DUAS, DUA_CATEGORIES } from '@/content/duas';
import { KNOWLEDGE, KNOWLEDGE_TOPICS } from '@/content/knowledge';
import { DIVINE_NAMES } from '@/content/names';

export type ResultKind = 'ayahRef' | 'surah' | 'ayahText' | 'translation' | 'dua' | 'name' | 'knowledge';

export interface SearchResult {
  kind: ResultKind;
  /** Yönlendirme için: '/reader?surah=2&ayah=255' gibi. */
  href: string;
  title: string;
  subtitle?: string;
  /** Sıralama puanı; büyük olan üstte. */
  score: number;
}

export interface SurahIndexEntry {
  number: number;
  nameTr: string;
  nameAr: string;
  ayahCount: number;
}

export interface AyahHit {
  surah: number;
  ayah: number;
  surahName: string;
}

export interface TranslationHitLite {
  surah: number;
  ayah: number;
  surahName: string;
  body: string;
}

export interface GlobalSearchDeps {
  surahs: readonly SurahIndexEntry[];
  /** Arapça metin araması — veri katmanından gelir. */
  searchAyahs: (query: string, limit: number) => AyahHit[];
  /** Meal araması. Meal yüklü değilse verilmez. */
  searchTranslations?: (query: string, limit: number) => TranslationHitLite[];
}

/** "2:255", "2/255", "bakara 255" gibi âyet başvurularını çözer. */
export function parseAyahReference(
  query: string,
  surahs: readonly SurahIndexEntry[],
): { surah: number; ayah: number } | null {
  const q = query.trim();

  const sayisal = /^(\d{1,3})\s*[:/.\- ]\s*(\d{1,3})$/.exec(q);
  if (sayisal) {
    const s = Number(sayisal[1]);
    const a = Number(sayisal[2]);
    const meta = surahs.find((x) => x.number === s);
    if (meta && a >= 1 && a <= meta.ayahCount) return { surah: s, ayah: a };
    return null;
  }

  const adli = /^(.+?)\s+(\d{1,3})$/.exec(q);
  if (adli) {
    const ad = normalizeSearch(adli[1]!);
    const a = Number(adli[2]);
    const meta = surahs.find((x) => normalizeSearch(x.nameTr) === ad)
      ?? surahs.find((x) => normalizeSearch(x.nameTr).startsWith(ad));
    if (meta && a >= 1 && a <= meta.ayahCount) return { surah: meta.number, ayah: a };
  }

  return null;
}

export function globalSearch(query: string, deps: GlobalSearchDeps, limit = 30): SearchResult[] {
  const ham = query.trim();
  if (ham.length < 2) return [];
  const out: SearchResult[] = [];

  // 1. Âyet başvurusu — en güçlü eşleşme, her zaman en üstte.
  const ref = parseAyahReference(ham, deps.surahs);
  if (ref) {
    const ad = deps.surahs.find((s) => s.number === ref.surah)?.nameTr ?? String(ref.surah);
    out.push({
      kind: 'ayahRef',
      href: `/reader?surah=${ref.surah}&ayah=${ref.ayah}`,
      title: `${ad} ${ref.ayah}`,
      score: 1000,
    });
  }

  // 2. Sure adı.
  for (const s of deps.surahs) {
    const puan = Math.max(matchScore(s.nameTr, ham), matchScore(s.nameAr, ham));
    if (puan > 0) {
      out.push({
        kind: 'surah',
        href: `/reader?surah=${s.number}&ayah=1`,
        title: `${s.number}. ${s.nameTr}`,
        subtitle: s.nameAr,
        score: 500 + puan * 10,
      });
    }
  }

  // 3. Esmâ.
  for (const n of DIVINE_NAMES) {
    const puan = Math.max(matchScore(n.transliteration, ham), matchScore(n.meaning, ham));
    if (puan > 0) {
      out.push({
        kind: 'name',
        href: '/names',
        title: n.transliteration,
        subtitle: n.meaning,
        score: 400 + puan * 10,
      });
    }
  }

  // 4. Dualar. Kategori adı da aranır: kullanıcı "yolculuk" yazdığında
  // "Yola çıkarken" duasını bulması beklenir.
  const duaKategori = new Map(DUA_CATEGORIES.map((c) => [c.id, c.label]));
  for (const d of DUAS) {
    const kategoriAdi = duaKategori.get(d.category) ?? '';
    const puan = Math.max(
      matchScore(d.title, ham),
      matchScore(kategoriAdi, ham),
      matchScore(d.category, ham),
      matchScore(d.body, ham) > 0 ? 1 : 0,
    );
    if (puan > 0) {
      out.push({ kind: 'dua', href: '/duas', title: d.title, subtitle: d.body.slice(0, 80), score: 300 + puan * 10 });
    }
  }

  // 5. Bilgi maddeleri — konu adı da aranır.
  const bilgiKonu = new Map(KNOWLEDGE_TOPICS.map((c) => [c.id, c.label]));
  for (const k of KNOWLEDGE) {
    const puan = Math.max(
      matchScore(k.title, ham),
      matchScore(bilgiKonu.get(k.topic) ?? '', ham),
      matchScore(k.body, ham) > 0 ? 1 : 0,
    );
    if (puan > 0) {
      out.push({ kind: 'knowledge', href: '/knowledge', title: k.title, subtitle: k.body.slice(0, 80), score: 200 + puan * 10 });
    }
  }

  // 6. Arapça metin — yalnız sorgu Arapça harf içeriyorsa taranır.
  // Latin sorguda 6236 âyeti boşuna gezmek olurdu.
  if (containsArabicQuery(ham)) {
    for (const hit of deps.searchAyahs(ham, 20)) {
      out.push({
        kind: 'ayahText',
        href: `/reader?surah=${hit.surah}&ayah=${hit.ayah}`,
        title: `${hit.surahName} ${hit.ayah}`,
        score: 100,
      });
    }
  }

  // 7. Meal — Latin sorguda en değerli kaynak, bu yüzden Arapça metinden
  // önce gelir. Kullanıcı "sabır" yazdığında âyeti mealden bulur.
  if (!containsArabicQuery(ham) && deps.searchTranslations && ham.length >= 3) {
    for (const hit of deps.searchTranslations(ham, 20)) {
      out.push({
        kind: 'translation',
        href: `/reader?surah=${hit.surah}&ayah=${hit.ayah}`,
        title: `${hit.surahName} ${hit.ayah}`,
        subtitle: hit.body.slice(0, 120),
        score: 150,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'tr')).slice(0, limit);
}
