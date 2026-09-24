/**
 * Anahtar-değer deposu — şartname §5, §89.
 *
 * Ayarlar ve küçük durum burada tutulur. İki kural:
 * 1. **Okunan her değer doğrulanır.** Depodaki JSON bozuksa ya da eski
 *    sürümden kalmışsa varsayılana düşülür; uygulama açılamamazlık etmez.
 * 2. **Sır burada durmaz.** Jeton ve anahtar `secure.ts` içine gider.
 */
import { logger } from '@/lib/log';

const log = logger('kv');

export interface KeyValueBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Bellek içi yedek: depo açılamazsa uygulama yine çalışır (§82). */
export class MemoryBackend implements KeyValueBackend {
  private readonly map = new Map<string, string>();
  async getItem(key: string) { return this.map.get(key) ?? null; }
  async setItem(key: string, value: string) { this.map.set(key, value); }
  async removeItem(key: string) { this.map.delete(key); }
}

export interface Codec<T> {
  /** Ham veriyi doğrular; geçersizse hata fırlatır. */
  parse: (raw: unknown) => T;
  fallback: T;
}

export class KeyValueStore {
  constructor(private readonly backend: KeyValueBackend, private readonly prefix = 'bes.') {}

  async read<T>(key: string, codec: Codec<T>): Promise<T> {
    try {
      const raw = await this.backend.getItem(this.prefix + key);
      if (raw === null) return codec.fallback;
      return codec.parse(JSON.parse(raw));
    } catch {
      log.warn('bozuk kayıt, varsayılana düşüldü', { key });
      return codec.fallback;
    }
  }

  async write<T>(key: string, value: T): Promise<boolean> {
    try {
      await this.backend.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch {
      log.warn('yazılamadı', { key });
      return false;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.backend.removeItem(this.prefix + key);
    } catch {
      log.warn('silinemedi', { key });
    }
  }
}

/** Uygulamanın kullandığı anahtarlar — tek yerde, yazım hatası olmasın diye. */
export const KEYS = {
  settings: 'settings',
  language: 'language',
  themeMode: 'themeMode',
  locations: 'locations',
  onboardingDone: 'onboardingDone',
  homeLayout: 'homeLayout',
  lastSyncAt: 'lastSyncAt',
  favorites: 'favorites',
  reading: 'reading',
  quranSettings: 'quranSettings',
  worship: 'worship',
  crashes: 'crashes',
  learning: 'learning',
  directionReloadAt: 'directionReloadAt',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];
