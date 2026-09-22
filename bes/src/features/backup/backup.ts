/**
 * Yerel yedek: dışa aktarma ve geri yükleme — DECISIONS D12, D19.
 *
 * **Neden sunucu değil de dosya.** "Eşitleme" isteğinin arkasındaki gerçek
 * ihtiyaç ikisi: *kayıtlarımı kaybetmeyeyim* ve *yeni telefona taşıyayım*.
 * İkisi de sunucu istemez. Sunucu istemek (hesap, kimlik doğrulama, kişisel
 * verinin cihazdan çıkması) ürünün en güçlü tarafını — hiçbir şeyin cihazdan
 * çıkmaması — bozar. Bu modül o iki ihtiyacı tek bir JSON dosyasıyla karşılar:
 * kullanıcı dosyayı kendi bulutuna, e-postasına, neresi isterse oraya koyar.
 *
 * **Çakışma mantığı burada, saf ve sınanabilir.** Dosya okuma/yazma ve
 * paylaşım tepsisi `file.ts` içindedir; bu dosya Node'da çalışır ve
 * `__tests__/backup.test.ts` onu doğrudan sınar.
 *
 * Birleştirmenin değişmez kuralı: **hiçbir kayıt kaybolmaz.** İki taraf da
 * aynı kaydı taşıyorsa yeni olan kazanır; yalnız bir tarafta varsa eklenir.
 * Sayaçlar ve ayarlar ise ayrı bir sorundur, aşağıda anlatıldı.
 */
import { z } from 'zod';
import type { SavedLocation } from '@/features/location/types';
import type { Favorite } from '@/store/favorites';
import type { Bookmark, ReadingPosition } from '@/store/reading';
import type { WorshipSnapshot, QadaSlot, WorshipDay, FastDay, Khatm } from '@/store/worship';
import type { DhikrSession } from '@/features/dhikr/stats';
import type { Reminder } from '@/features/notifications/reminders';

export const BACKUP_FORMAT = 'bes.backup';
/** Biçim sürümü. Okuyamadığımız bir sürüm sessizce yarım uygulanmaz, reddedilir. */
export const BACKUP_VERSION = 1;

export interface BackupPayload {
  settings: unknown;
  locations: { locations: SavedLocation[]; activeId: string | null };
  favorites: Favorite[];
  homeLayout: unknown;
  reading: { position: ReadingPosition | null; bookmarks: Bookmark[] };
  worship: WorshipSnapshot;
}

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  /** Yedeği üreten uygulama sürümü — sorun ayıklamada tek işe yarayan bilgi. */
  app: string;
  createdAt: number;
  payload: BackupPayload;
}

// ---------------------------------------------------------------- doğrulama

/**
 * Gevşek şema: bilinmeyen alanlar **atılmaz**, çünkü ileride eklenecek bir
 * alanı eski sürüm okuyup geri yazarsa veri kaybı olur. Bilinen alanların
 * tipi ise sıkı denetlenir; bozuk bir dosya uygulamayı çökertmemeli.
 */
const zamanSchema = z.number().int().nonnegative();

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
  app: z.string().min(1),
  createdAt: zamanSchema,
  payload: z.object({
    settings: z.unknown(),
    locations: z.object({
      locations: z.array(z.object({ id: z.string() }).passthrough()).default([]),
      activeId: z.string().nullable().default(null),
    }),
    favorites: z.array(z.object({
      kind: z.enum(['dua', 'name', 'article', 'ayah', 'hadith']),
      recordId: z.string(),
      createdAt: zamanSchema,
    })).default([]),
    homeLayout: z.unknown(),
    reading: z.object({
      position: z.object({
        surah: z.number().int().min(1).max(114),
        ayah: z.number().int().min(1),
        updatedAt: zamanSchema,
      }).nullable().default(null),
      bookmarks: z.array(z.object({ id: z.string(), createdAt: zamanSchema }).passthrough()).default([]),
    }),
    worship: z.object({
      sessions: z.array(z.object({ id: z.string() }).passthrough()).default([]),
      khatms: z.array(z.object({ id: z.string() }).passthrough()).default([]),
      reminders: z.array(z.object({ id: z.string() }).passthrough()).default([]),
      qada: z.record(z.string(), z.number().int().nonnegative()).default({}),
      qadaHistory: z.array(z.object({ id: z.string(), at: zamanSchema }).passthrough()).default([]),
      days: z.record(z.string(), z.object({ date: z.string() }).passthrough()).default({}),
      fasts: z.record(z.string(), z.object({ date: z.string() }).passthrough()).default({}),
    }),
  }),
});

export type ParseOutcome =
  | { ok: true; backup: Backup }
  | { ok: false; reason: 'json' | 'format' | 'version' | 'schema' };

/**
 * Metni yedeğe çevirir. Başarısızlık sebebi ayrı ayrı döner: kullanıcıya
 * "dosya bozuk" ile "bu yedek daha yeni bir sürümden" farklı şeyler
 * söylenmeli — ikincisinde yapacağı şey uygulamayı güncellemek.
 */
export function parseBackup(text: string): ParseOutcome {
  let ham: unknown;
  try {
    ham = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'json' };
  }
  if (typeof ham !== 'object' || ham === null) return { ok: false, reason: 'format' };
  const kayit = ham as Record<string, unknown>;
  if (kayit.format !== BACKUP_FORMAT) return { ok: false, reason: 'format' };
  if (typeof kayit.version === 'number' && kayit.version > BACKUP_VERSION) {
    return { ok: false, reason: 'version' };
  }
  const sonuc = backupSchema.safeParse(ham);
  if (!sonuc.success) return { ok: false, reason: 'schema' };
  return { ok: true, backup: sonuc.data as unknown as Backup };
}

export function createBackup(payload: BackupPayload, app: string, now = Date.now()): Backup {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, app, createdAt: now, payload };
}

/** Dosya adı: sıralanabilir olsun diye tarih önde, ayırıcı olarak tire. */
export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `bes-yedek-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
    + `-${p(now.getHours())}${p(now.getMinutes())}.json`;
}

// --------------------------------------------------------------- birleştirme

export type RestoreMode = 'merge' | 'replace';

export interface RestoreReport {
  mode: RestoreMode;
  /** Bu cihazda olmayıp yedekten eklenen kayıt sayıları. */
  added: {
    locations: number; favorites: number; bookmarks: number;
    sessions: number; khatms: number; reminders: number; days: number; fasts: number;
  };
  /**
   * Kaza sayaçları ve ayarlar yedekten mi alındı?
   *
   * Sayaçlar birleştirilemez: ortak ata yok. İki telefonda da kaza kılınmışsa
   * "topla" da "en büyüğü al" da yanlış olur. Bu yüzden kural açık: **cihaz
   * boşsa** (hiç kaza girilmemiş, hiç geçmiş yok) yedekten alınır — yeni
   * telefona taşıma durumu budur. Cihazda veri varsa cihazınki korunur ve
   * kullanıcıya böyle söylenir. Aynı mantık ayarlar ve ana sayfa düzeni için
   * de geçerlidir.
   */
  countersFromBackup: boolean;
  settingsFromBackup: boolean;
}

const bosRapor = (mode: RestoreMode): RestoreReport => ({
  mode,
  added: { locations: 0, favorites: 0, bookmarks: 0, sessions: 0, khatms: 0, reminders: 0, days: 0, fasts: 0 },
  countersFromBackup: false,
  settingsFromBackup: false,
});

/** Kimliğe göre birleştirir; çakışmada `daha yeni` kazanır. Eklenen sayısını verir. */
function birlestir<T>(
  yerel: readonly T[],
  uzak: readonly T[],
  anahtar: (x: T) => string,
  daha: (a: T, b: T) => T,
): { list: T[]; added: number } {
  const harita = new Map<string, T>();
  for (const x of yerel) harita.set(anahtar(x), x);
  let added = 0;
  for (const x of uzak) {
    const k = anahtar(x);
    const mevcut = harita.get(k);
    if (!mevcut) { harita.set(k, x); added += 1; continue; }
    harita.set(k, daha(mevcut, x));
  }
  return { list: [...harita.values()], added };
}

/** Cihazda hiç ibadet verisi yok mu? (Yeni kurulum.) */
export function isFreshDevice(p: BackupPayload): boolean {
  const w = p.worship;
  const sayaclar = Object.values(w.qada ?? {});
  return sayaclar.every((v) => !v)
    && (w.qadaHistory ?? []).length === 0
    && (w.sessions ?? []).length === 0
    && Object.keys(w.days ?? {}).length === 0
    && (p.reading.bookmarks ?? []).length === 0;
}

/**
 * Yedeği bu cihazın verisiyle birleştirir.
 *
 * `replace` kipinde yedek olduğu gibi yazılır — kullanıcı bunu onaylamıştır.
 * `merge` kipinde hiçbir kayıt kaybolmaz.
 */
export function restore(
  current: BackupPayload,
  incoming: BackupPayload,
  mode: RestoreMode,
): { payload: BackupPayload; report: RestoreReport } {
  if (mode === 'replace') {
    const rapor = bosRapor('replace');
    rapor.countersFromBackup = true;
    rapor.settingsFromBackup = true;
    return { payload: incoming, report: rapor };
  }

  const rapor = bosRapor('merge');
  const taze = isFreshDevice(current);
  rapor.countersFromBackup = taze;
  rapor.settingsFromBackup = taze;

  // --- Konumlar: kimlik birliği, daha yeni kayıt kazanır.
  const kon = birlestir(
    current.locations.locations, incoming.locations.locations,
    (l) => l.id,
    (a, b) => (b.savedAt > a.savedAt ? b : a),
  );
  rapor.added.locations = kon.added;
  const aktifVar = kon.list.some((l) => l.id === current.locations.activeId);
  const activeId = aktifVar
    ? current.locations.activeId
    : (kon.list.some((l) => l.id === incoming.locations.activeId)
      ? incoming.locations.activeId
      : (kon.list[0]?.id ?? null));

  // --- Favoriler: aynı kayıt iki kez olamaz; **ilk** eklenme anı korunur.
  const fav = birlestir(
    current.favorites, incoming.favorites,
    (f) => `${f.kind}:${f.recordId}`,
    (a, b) => (b.createdAt < a.createdAt ? b : a),
  );
  rapor.added.favorites = fav.added;

  // --- Yer imleri: daha yeni olan kazanır (not/renk düzenlenmiş olabilir).
  const yer = birlestir(
    current.reading.bookmarks, incoming.reading.bookmarks,
    (b) => b.id,
    (a, b) => (b.createdAt > a.createdAt ? b : a),
  );
  rapor.added.bookmarks = yer.added;
  const konum = ((): ReadingPosition | null => {
    const a = current.reading.position;
    const b = incoming.reading.position;
    if (!a) return b;
    if (!b) return a;
    return b.updatedAt > a.updatedAt ? b : a;
  })();

  // --- Zikir oturumları: kayıt, değişmez; kimlik birliği yeter.
  const otu = birlestir<DhikrSession>(
    current.worship.sessions ?? [], incoming.worship.sessions ?? [],
    (s) => s.id, (a) => a,
  );
  rapor.added.sessions = otu.added;

  // --- Hatimler: aynı hatim iki cihazda ilerlemişse cüzler **birleşir**.
  // "Son yazan kazanır" burada okunmuş cüzleri siler.
  const hat = birlestir<Khatm>(
    current.worship.khatms ?? [], incoming.worship.khatms ?? [],
    (k) => k.id,
    (a, b) => ({
      ...a,
      completedJuz: [...new Set([...a.completedJuz, ...b.completedJuz])].sort((x, y) => x - y),
      active: a.active || b.active,
    }),
  );
  rapor.added.khatms = hat.added;

  // --- Hatırlatıcılar: cihazın kendi kurulu planı korunur, eksikler eklenir.
  const hat2 = birlestir<Reminder>(
    current.worship.reminders ?? [], incoming.worship.reminders ?? [],
    (r) => r.id, (a) => a,
  );
  rapor.added.reminders = hat2.added;

  // --- İbadet defteri: gün gün birleşir. Namaz kaydı bir cihazda varsa kalır,
  // Kur'an dakikası ikisinin büyüğüdür, not boşsa yedekten gelir.
  const gunler: Record<string, WorshipDay> = { ...(current.worship.days ?? {}) };
  for (const [tarih, gelen] of Object.entries(incoming.worship.days ?? {})) {
    const mevcut = gunler[tarih];
    if (!mevcut) { gunler[tarih] = gelen; rapor.added.days += 1; continue; }
    gunler[tarih] = {
      ...mevcut,
      prayers: { ...gelen.prayers, ...mevcut.prayers },
      quranMinutes: Math.max(mevcut.quranMinutes, gelen.quranMinutes),
      ...(mevcut.note ? {} : (gelen.note ? { note: gelen.note } : {})),
    };
  }

  // --- Oruç: cihazdaki kayıt korunur, eksik günler eklenir.
  const oruclar: Record<string, FastDay> = { ...(current.worship.fasts ?? {}) };
  for (const [tarih, gelen] of Object.entries(incoming.worship.fasts ?? {})) {
    if (oruclar[tarih]) continue;
    oruclar[tarih] = gelen;
    rapor.added.fasts += 1;
  }

  // --- Kaza geçmişi: kimlik birliği, en yeni 200 kayıt (mağaza da böyle tutuyor).
  const gecmis = birlestir(
    current.worship.qadaHistory ?? [], incoming.worship.qadaHistory ?? [],
    (e) => e.id, (a) => a,
  ).list.sort((a, b) => b.at - a.at).slice(0, 200);

  const sayaclar = taze
    ? (incoming.worship.qada ?? {})
    : (current.worship.qada ?? {});

  return {
    payload: {
      settings: taze ? incoming.settings : current.settings,
      homeLayout: taze ? incoming.homeLayout : current.homeLayout,
      locations: { locations: kon.list, activeId },
      favorites: fav.list,
      reading: { position: konum, bookmarks: yer.list },
      worship: {
        sessions: otu.list,
        khatms: hat.list,
        reminders: hat2.list,
        qada: sayaclar as Partial<Record<QadaSlot, number>>,
        qadaHistory: gecmis,
        days: gunler,
        fasts: oruclar,
      },
    },
    report: rapor,
  };
}

/** Rapordaki toplam eklenen kayıt sayısı — kullanıcıya tek sayı gösterilir. */
export function totalAdded(r: RestoreReport): number {
  return Object.values(r.added).reduce((a, b) => a + b, 0);
}
