/**
 * Ayar şeması ve doğrulaması — şartname §5, §60, §89.
 * Depodan okunan her ayar burada doğrulanır; tanınmayan alan atılır,
 * eksik alan varsayılanla tamamlanır.
 */
import { z } from 'zod';
import { LANGUAGES } from '@/lib/i18n/translate';
import { PRAYER_KEYS } from '@/features/prayer/methods';

const languageSchema = z.enum(LANGUAGES as unknown as [string, ...string[]]);

export const settingsSchema = z.object({
  language: languageSchema.default('tr'),
  themeMode: z.enum(['system', 'light', 'dark']).default('system'),
  method: z.string().default('diyanet'),
  /** İkindi gölge oranı: 1 = Şâfiî/Mâlikî/Hanbelî (Diyanet), 2 = Hanefî (§15). */
  asrShadow: z.union([z.literal(1), z.literal(2)]).default(1),
  /** Vakit bazlı dakika düzeltmesi (§15). */
  adjustments: z.record(z.enum(PRAYER_KEYS as unknown as [string, ...string[]]), z.number().int().min(-60).max(60))
    .default({}),
  notifications: z.object({
    enabled: z.boolean().default(true),
    perPrayer: z.record(z.enum(PRAYER_KEYS as unknown as [string, ...string[]]), z.boolean()).default({}),
    beforeMinutes: z.number().int().min(0).max(120).default(0),
    sound: z.boolean().default(true),
    vibration: z.boolean().default(true),
  }).default({}),
  quran: z.object({
    fontScale: z.number().min(0.8).max(2).default(1),
    mode: z.enum(['arabic', 'both', 'translation']).default('both'),
    translationSource: z.string().nullable().default(null),
  }).default({}),
  /** Kıraat ayarları (§32, §33). */
  recitation: z.object({
    reciterId: z.string().default('ar.alafasy'),
    bitrate: z.union([z.literal(64), z.literal(128)]).default(128),
    /** Yalnız Wi-Fi'de indir — mobil veriyi koru. */
    wifiOnlyDownload: z.boolean().default(true),
    repeat: z.enum(['off', 'ayah', 'range', 'surah']).default('off'),
    speed: z.number().min(0.5).max(2).default(1),
  }).default({}),
  /** Hicri tarih için gün düzeltmesi (-2..+2) — bölgesel rüyet farkı (§44). */
  hijriOffset: z.number().int().min(-2).max(2).default(0),
  analyticsOptIn: z.boolean().default(false),
});

export type Settings = z.infer<typeof settingsSchema>;

export const defaultSettings: Settings = settingsSchema.parse({});

/** Bozuk/eksik kaydı varsayılanlarla onarır; asla hata fırlatmaz. */
export function parseSettings(raw: unknown): Settings {
  const result = settingsSchema.safeParse(raw);
  return result.success ? result.data : defaultSettings;
}
