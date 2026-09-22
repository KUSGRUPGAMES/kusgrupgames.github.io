/**
 * Yerel veritabanı — şartname §5.
 * Migration çalıştırıcısı. `expo-sqlite` dışarıdan verilir; böylece
 * "hangi sürümden hangi ifadeler çalışır" sorusu sınanabilir.
 */
import { logger } from '@/lib/log';
import { MIGRATIONS, LATEST_VERSION, pendingMigrations, type Migration } from './migrations';

const log = logger('db');

export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}

export interface MigrationReport {
  from: number;
  to: number;
  applied: readonly string[];
}

/** Şu anki şema sürümü. Okunamazsa 0 sayılır (yeni kurulum gibi davranılır). */
export async function currentVersion(db: SqlDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ user_version: number }>('pragma user_version');
    return row?.user_version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Bekleyen migration'ları sırayla uygular. Her sürüm **kendi işlemi içinde**
 * çalışır: ortada kalan bir sürüm olmaz, yarım uygulanmış şema oluşmaz.
 */
export async function migrate(db: SqlDatabase, list: readonly Migration[] = MIGRATIONS): Promise<MigrationReport> {
  const from = await currentVersion(db);
  const applied: string[] = [];
  for (const m of pendingMigrations(from, list)) {
    await db.execAsync('begin');
    try {
      for (const sql of m.statements) await db.execAsync(sql);
      await db.execAsync(`pragma user_version = ${m.version}`);
      await db.execAsync('commit');
      applied.push(m.name);
    } catch (e) {
      await db.execAsync('rollback').catch(() => undefined);
      log.error('migration başarısız', { version: m.version, name: m.name, error: e });
      throw e;
    }
  }
  const to = await currentVersion(db);
  return { from, to, applied };
}

export { LATEST_VERSION };
