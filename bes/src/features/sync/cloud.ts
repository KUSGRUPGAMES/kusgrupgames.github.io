/**
 * Hesapla eşitleme — üç yönlü birleştirme (saf, sınanır). D35.
 *
 * Giriş yapan kullanıcının kişisel kayıtları (Kur'an konumu ve yer imleri,
 * ibadet defteri, zikir, kaza, hatim, oruç, hatırlatıcılar, favoriler, kurs
 * ilerlemesi, ayarlar) hesabına bağlanır; aynı hesapla giriş yapılan her
 * telefonda aynı veri görünür.
 *
 * Neden üç yönlü: yedekten geri yükleme (`backup.ts → restore`) iki yönlüdür
 * ve hiçbir şeyi silmez — tek seferlik taşımada doğru, sürekli eşitlemede
 * yanlış: bir telefonda silinen yer imi öbüründen geri gelirdi, kaza sayacı
 * iki telefonda düşülünce biri öbürünü ezerdi. Burada `base` = bu cihazın
 * son eşitlediği hâl:
 *
 * - Kimlikli kayıtlar: iki tarafta da varsa birleşir; birinde yok ama base'de
 *   varsa o tarafta **silinmiştir** → silinir; base'de de yoksa **yenidir** → kalır.
 * - Kaza sayaçları: base + (yerel − base) + (uzak − base). İki telefonda
 *   kılınan kazalar toplanır, hiçbiri kaybolmaz.
 * - Ayarlar ve ana sayfa düzeni: base'den değişen taraf kazanır; ikisi de
 *   değiştiyse bu cihazınki.
 * - Etkin konum cihaza özeldir (her telefon bulunduğu şehri gösterir).
 *
 * İlk eşitlemede base yoktur; o zaman yedeğin iki yönlü birleştirmesi
 * kullanılır (hiçbir kayıt kaybolmaz, boş cihaz sayaçları hesaptan alır).
 */
import { restore, type BackupPayload } from '@/features/backup/backup';
import type { WorshipDay, FastDay, QadaSlot, Khatm } from '@/store/worship';

const QADA: readonly QadaSlot[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'];

function ucYonluListe<T>(
  base: readonly T[] | undefined,
  yerel: readonly T[],
  uzak: readonly T[],
  anahtar: (x: T) => string,
  birlestir: (a: T, b: T) => T,
): T[] {
  const b = new Set((base ?? []).map(anahtar));
  const y = new Map(yerel.map((x) => [anahtar(x), x]));
  const u = new Map(uzak.map((x) => [anahtar(x), x]));
  const sonuc: T[] = [];
  for (const [k, x] of y) {
    const karsi = u.get(k);
    if (karsi !== undefined) sonuc.push(birlestir(x, karsi));
    else if (!b.has(k)) sonuc.push(x); // yerelde yeni
    // aksi: uzakta silindi
  }
  for (const [k, x] of u) {
    if (y.has(k)) continue;
    if (!b.has(k)) sonuc.push(x); // uzakta yeni
    // aksi: yerelde silindi
  }
  return sonuc;
}

function ucYonluHarita<T>(
  base: Record<string, T> | undefined,
  yerel: Record<string, T>,
  uzak: Record<string, T>,
  birlestir: (a: T, b: T) => T,
): Record<string, T> {
  const liste = ucYonluListe(
    base ? Object.entries(base) : [],
    Object.entries(yerel), Object.entries(uzak),
    ([k]) => k,
    ([k, a], [, b]) => [k, birlestir(a, b)] as [string, T],
  );
  return Object.fromEntries(liste);
}

const ayni = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Base'den değişen taraf kazanır; ikisi de değiştiyse yerel. */
function degisenKazanir<T>(base: T, yerel: T, uzak: T): T {
  return ayni(yerel, base) ? uzak : yerel;
}

export function mergeThreeWay(base: BackupPayload | null, yerel: BackupPayload, uzak: BackupPayload): BackupPayload {
  if (!base) return restore(yerel, uzak, 'merge').payload;

  const bw = base.worship;
  const yw = yerel.worship;
  const uw = uzak.worship;

  const qada: Partial<Record<QadaSlot, number>> = {};
  for (const s of QADA) {
    const b0 = bw.qada?.[s] ?? 0;
    const v = b0 + ((yw.qada?.[s] ?? 0) - b0) + ((uw.qada?.[s] ?? 0) - b0);
    if (v > 0) qada[s] = v;
  }

  const konumlar = ucYonluListe(
    base.locations.locations, yerel.locations.locations, uzak.locations.locations,
    (l) => l.id, (a, b) => (b.savedAt > a.savedAt ? b : a),
  );
  const activeId = konumlar.some((l) => l.id === yerel.locations.activeId)
    ? yerel.locations.activeId
    : (konumlar.find((l) => l.isPrimary)?.id ?? konumlar[0]?.id ?? null);

  const konum = ((): BackupPayload['reading']['position'] => {
    const a = yerel.reading.position;
    const b = uzak.reading.position;
    if (!a) return b;
    if (!b) return a;
    return b.updatedAt > a.updatedAt ? b : a;
  })();

  return {
    settings: degisenKazanir(base.settings, yerel.settings, uzak.settings),
    homeLayout: degisenKazanir(base.homeLayout, yerel.homeLayout, uzak.homeLayout),
    locations: { locations: konumlar, activeId },
    favorites: ucYonluListe(base.favorites, yerel.favorites, uzak.favorites,
      (f) => `${f.kind}:${f.recordId}`, (a, b) => (b.createdAt < a.createdAt ? b : a)),
    reading: {
      position: konum,
      bookmarks: ucYonluListe(base.reading.bookmarks, yerel.reading.bookmarks, uzak.reading.bookmarks,
        (b) => b.id, (a, b) => degisenKazanir(base.reading.bookmarks.find((x) => x.id === a.id) ?? a, a, b)),
    },
    worship: {
      sessions: ucYonluListe(bw.sessions, yw.sessions ?? [], uw.sessions ?? [], (s) => s.id, (a) => a),
      khatms: ucYonluListe<Khatm>(bw.khatms, yw.khatms ?? [], uw.khatms ?? [], (k) => k.id, (a, b) => ({
        ...a,
        completedJuz: [...new Set([...a.completedJuz, ...b.completedJuz])].sort((x, y) => x - y),
        active: a.active && b.active,
      })),
      reminders: ucYonluListe(bw.reminders, yw.reminders ?? [], uw.reminders ?? [], (r) => r.id,
        (a, b) => degisenKazanir((bw.reminders ?? []).find((x) => x.id === a.id) ?? a, a, b)),
      qada,
      qadaHistory: ucYonluListe(bw.qadaHistory, yw.qadaHistory ?? [], uw.qadaHistory ?? [], (e) => e.id, (a) => a)
        .sort((a, b) => b.at - a.at).slice(0, 200),
      days: ucYonluHarita<WorshipDay>(bw.days, yw.days ?? {}, uw.days ?? {}, (a, b) => ({
        ...a,
        prayers: { ...b.prayers, ...a.prayers },
        quranMinutes: Math.max(a.quranMinutes, b.quranMinutes),
        ...(a.note ? {} : (b.note ? { note: b.note } : {})),
      })),
      fasts: ucYonluHarita<FastDay>(bw.fasts, yw.fasts ?? {}, uw.fasts ?? {},
        (a, b) => degisenKazanir((bw.fasts ?? {})[a.date] ?? a, a, b)),
    },
    learning: ucYonluListe(base.learning, yerel.learning ?? [], uzak.learning ?? [],
      (d) => d.lessonId, (a, b) => (b.stars > a.stars ? b : a)),
  };
}

/** Eşitlemede bir şey değişti mi (gereksiz yazmaları önlemek için). */
export function payloadEquals(a: BackupPayload, b: BackupPayload): boolean {
  return ayni(a, b);
}
