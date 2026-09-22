/**
 * Gizli değer deposu — şartname §5, §89.
 *
 * Oturum jetonu ve benzeri sırlar **yalnız** buradan geçer: iOS Keychain,
 * Android Keystore. AsyncStorage'a sır yazmak (düz dosya) bu üründe yasaktır.
 *
 * Platform katmanı dışarıdan verilir; böylece sınamada gerçek Keychain'e
 * dokunulmaz ve "sır nereye yazıldı" sorusu sınanabilir hâle gelir.
 */
import { logger } from '@/lib/log';

const log = logger('secure');

export interface SecureBackend {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export const SECURE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
} as const;

export class SecureStore {
  constructor(private readonly backend: SecureBackend) {}

  async get(key: string): Promise<string | null> {
    try {
      return await this.backend.getItemAsync(key);
    } catch {
      // Cihaz kilidi kaldırılmamışken Keychain okunamayabilir; bu hata değil.
      log.warn('gizli değer okunamadı', { key });
      return null;
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    try {
      await this.backend.setItemAsync(key, value);
      return true;
    } catch {
      log.error('gizli değer yazılamadı', { key });
      return false;
    }
  }

  async clear(): Promise<void> {
    for (const key of Object.values(SECURE_KEYS)) {
      try {
        await this.backend.deleteItemAsync(key);
      } catch {
        log.warn('gizli değer silinemedi', { key });
      }
    }
  }
}
