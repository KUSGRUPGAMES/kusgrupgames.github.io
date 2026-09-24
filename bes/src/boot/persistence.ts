/**
 * Durum kalıcılığı — şartname §5.
 * Depodan okuma (hidrasyon) ve değişiklikte yazma. Depo erişimi yalnız
 * burada; mağaza dosyaları (`src/store/`) depolama teknolojisini bilmez.
 */
import { z } from 'zod';
import { KEYS } from '@/lib/storage';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useFavoriteStore, type Favorite } from '@/store/favorites';
import { useHomeLayoutStore } from '@/store/homeLayout';
import { useReadingStore, type Bookmark, type ReadingPosition } from '@/store/reading';
import { useWorshipStore, type WorshipSnapshot } from '@/store/worship';
import { useLearningStore, type LearningMark } from '@/store/learning';
import { configureCrashReporter, type CrashRecord } from '@/lib/crash/reporter';
import type { SavedLocation } from '@/features/location/types';
import type { BackupPayload } from '@/features/backup/backup';
import { kv } from './storage';

const savedLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  timezone: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation: z.number().optional(),
  label: z.string(),
  isPrimary: z.boolean(),
  origin: z.enum(['gps', 'manual']),
  savedAt: z.number(),
});

const storedLocationsSchema = z.object({
  locations: z.array(savedLocationSchema).default([]),
  activeId: z.string().nullable().default(null),
});

const locationsCodec = {
  parse: (raw: unknown) => storedLocationsSchema.parse(raw),
  fallback: { locations: [] as SavedLocation[], activeId: null as string | null },
};

const settingsCodec = {
  parse: (raw: unknown) => raw,
  fallback: {} as unknown,
};

const favoritesCodec = {
  parse: (raw: unknown) => z.array(z.object({
    kind: z.enum(['dua', 'name', 'article', 'ayah', 'hadith']),
    recordId: z.string(),
    createdAt: z.number(),
  })).parse(raw) as Favorite[],
  fallback: [] as Favorite[],
};

const layoutCodec = {
  parse: (raw: unknown) => raw,
  fallback: null as unknown,
};

const readingCodec = {
  parse: (raw: unknown) => z.object({
    position: z.object({
      surah: z.number().int().min(1).max(114),
      ayah: z.number().int().min(1),
      updatedAt: z.number(),
    }).nullable().default(null),
    bookmarks: z.array(z.object({
      id: z.string(),
      surah: z.number().int().min(1).max(114),
      ayah: z.number().int().min(1),
      color: z.string(),
      label: z.string().optional(),
      note: z.string().optional(),
      createdAt: z.number(),
    })).default([]),
  }).parse(raw),
  fallback: { position: null as ReadingPosition | null, bookmarks: [] as Bookmark[] },
};

const qadaSlot = z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr']);

const worshipCodec = {
  parse: (raw: unknown) => z.object({
    sessions: z.array(z.object({
      id: z.string(), title: z.string(),
      count: z.number().int().min(0), target: z.number().int().min(1),
      onDate: z.string(), createdAt: z.number(),
    })).default([]),
    qada: z.record(qadaSlot, z.number().int().min(0)).default({}),
    qadaHistory: z.array(z.object({
      id: z.string(), slot: qadaSlot, delta: z.number().int(), at: z.number(),
    })).default([]),
    days: z.record(z.string(), z.object({
      date: z.string(),
      prayers: z.record(z.string(), z.enum(['alone', 'jamaah', 'qada'])).default({}),
      quranMinutes: z.number().int().min(0).default(0),
      note: z.string().optional(),
    })).default({}),
    reminders: z.array(z.object({
      id: z.string(),
      title: z.string(),
      body: z.string().optional(),
      trigger: z.union([
        z.object({ kind: z.literal('time'), hour: z.number().int().min(0).max(23), minute: z.number().int().min(0).max(59) }),
        z.object({
          kind: z.literal('prayer'),
          slot: z.enum(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']),
          offsetMinutes: z.number().int().min(-180).max(180),
        }),
      ]),
      weekdays: z.array(z.number().int().min(0).max(6)).default([]),
      enabled: z.boolean(),
    })).default([]),
    khatms: z.array(z.object({
      id: z.string(), title: z.string(), startedOn: z.string(),
      targetOn: z.string().optional(),
      completedJuz: z.array(z.number().int().min(1).max(30)).default([]),
      active: z.boolean(),
    })).default([]),
    fasts: z.record(z.string(), z.object({
      date: z.string(),
      kind: z.enum(['ramadan', 'qada', 'nafile', 'kaffara']),
      completed: z.boolean(),
    })).default({}),
  }).parse(raw),
  fallback: {},
};

const learningCodec = {
  parse: (raw: unknown) => z.array(z.object({
    kind: z.enum(['letter', 'harake']),
    recordId: z.string(),
    learnedAt: z.number(),
  })).parse(raw) as LearningMark[],
  fallback: [] as LearningMark[],
};

const crashCodec = {
  parse: (raw: unknown) => z.array(z.object({
    at: z.string(),
    name: z.string(),
    message: z.string(),
    componentStack: z.string().optional(),
    context: z.record(z.string(), z.string()).default({}),
  })).parse(raw) as CrashRecord[],
  fallback: [] as CrashRecord[],
};

const onboardingCodec = {
  parse: (raw: unknown) => raw === true,
  fallback: false,
};

export interface BootState {
  onboardingDone: boolean;
}

/** Açılışta tüm kalıcı durumu yükler ve yazıcıları bağlar. */
export async function hydrateAll(): Promise<BootState> {
  const [ayar, konum, onboarding, favoriler, duzen, okuma, ibadet, cokmeler, ogrenme] = await Promise.all([
    kv.read(KEYS.settings, settingsCodec),
    kv.read(KEYS.locations, locationsCodec),
    kv.read(KEYS.onboardingDone, onboardingCodec),
    kv.read(KEYS.favorites, favoritesCodec),
    kv.read(KEYS.homeLayout, layoutCodec),
    kv.read(KEYS.reading, readingCodec),
    kv.read(KEYS.worship, worshipCodec),
    kv.read(KEYS.crashes, crashCodec),
    kv.read(KEYS.learning, learningCodec),
  ]);

  useSettingsStore.getState().hydrate(ayar);
  useLocationStore.getState().hydrate(konum.locations as SavedLocation[], konum.activeId);
  useFavoriteStore.getState().hydrate(favoriler);
  useHomeLayoutStore.getState().hydrate(duzen);
  useReadingStore.getState().hydrate(okuma.position, okuma.bookmarks as Bookmark[]);
  // Zod çıktısı şemayla birebir; tip daraltması için tek noktada dönüştürülür.
  useWorshipStore.getState().hydrate(ibadet as WorshipSnapshot);
  useLearningStore.getState().hydrate(ogrenme);
  configureCrashReporter({
    initial: cokmeler,
    persist: (kayitlar) => { void kv.write(KEYS.crashes, kayitlar); },
  });

  // Hidrasyondan **sonra** bağlanır: yoksa ilk hidrasyon kendini geri yazar.
  useSettingsStore.subscribe((s) => { void kv.write(KEYS.settings, s.settings); });
  useLocationStore.subscribe((s) => {
    void kv.write(KEYS.locations, { locations: s.locations, activeId: s.activeId });
  });
  useFavoriteStore.subscribe((s) => { void kv.write(KEYS.favorites, s.items); });
  useHomeLayoutStore.subscribe((s) => { void kv.write(KEYS.homeLayout, s.cards); });
  useReadingStore.subscribe((s) => {
    void kv.write(KEYS.reading, { position: s.position, bookmarks: s.bookmarks });
  });
  useWorshipStore.subscribe((s) => {
    void kv.write(KEYS.worship, {
      sessions: s.sessions, khatms: s.khatms, reminders: s.reminders, qada: s.qada,
      qadaHistory: s.qadaHistory, days: s.days, fasts: s.fasts,
    });
  });
  useLearningStore.subscribe((s) => { void kv.write(KEYS.learning, s.items); });

  return { onboardingDone: onboarding };
}

export async function markOnboardingDone(): Promise<void> {
  await kv.write(KEYS.onboardingDone, true);
}

/**
 * Yedek için bütün kullanıcı verisinin anlık kesiti — DECISIONS D19.
 *
 * Mağazalardan okunur, depodan değil: depoya yazma abonelikle ve gecikmeli
 * olduğu için dosyadan okumak "az önce yapılan değişiklik yedeğe girmedi"
 * hatasına açıktır.
 */
export function snapshotAll(): BackupPayload {
  const konum = useLocationStore.getState();
  const okuma = useReadingStore.getState();
  const ibadet = useWorshipStore.getState();
  return {
    settings: useSettingsStore.getState().settings,
    locations: { locations: konum.locations, activeId: konum.activeId },
    favorites: useFavoriteStore.getState().items,
    homeLayout: useHomeLayoutStore.getState().cards,
    reading: { position: okuma.position, bookmarks: okuma.bookmarks },
    worship: {
      sessions: ibadet.sessions, khatms: ibadet.khatms, reminders: ibadet.reminders,
      qada: ibadet.qada, qadaHistory: ibadet.qadaHistory,
      days: ibadet.days, fasts: ibadet.fasts,
    },
  };
}

/**
 * Birleştirilmiş kesiti mağazalara yazar; abonelikler depoya kendiliğinden
 * yazar. Hidrasyon yolunun aynısı kullanılır — geri yükleme için ikinci bir
 * yazma yolu açmak, iki yolun zamanla ayrışması demektir.
 */
export function applySnapshot(payload: BackupPayload): void {
  useSettingsStore.getState().hydrate(payload.settings);
  useLocationStore.getState().hydrate(payload.locations.locations, payload.locations.activeId);
  useFavoriteStore.getState().hydrate(payload.favorites);
  useHomeLayoutStore.getState().hydrate(payload.homeLayout);
  useReadingStore.getState().hydrate(payload.reading.position, payload.reading.bookmarks);
  useWorshipStore.getState().hydrate(payload.worship);
}
