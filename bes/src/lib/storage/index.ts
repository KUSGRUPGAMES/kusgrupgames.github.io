/** Kalıcılık katmanı — tek giriş noktası. Şartname §5. */
export { KeyValueStore, MemoryBackend, KEYS, type KeyValueBackend, type Codec, type StorageKey } from './kv';
export { SecureStore, SECURE_KEYS, type SecureBackend } from './secure';
export { migrate, currentVersion, LATEST_VERSION, type SqlDatabase, type MigrationReport } from './db';
export { MIGRATIONS, pendingMigrations, validateMigrations, type Migration } from './migrations';
export { settingsSchema, defaultSettings, parseSettings, type Settings } from './settings';
