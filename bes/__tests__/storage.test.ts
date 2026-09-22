import {
  KeyValueStore, MemoryBackend, SecureStore, migrate, currentVersion,
  MIGRATIONS, LATEST_VERSION, pendingMigrations, validateMigrations,
  parseSettings, defaultSettings, type SqlDatabase, type SecureBackend,
} from '@/lib/storage';

/** Küçük bir SQLite taklidi: uygulanan ifadeleri ve sürümü izler. */
function sahteDb(startVersion = 0, kirilacakSurum?: number): SqlDatabase & { sql: string[]; version: number } {
  const state = {
    sql: [] as string[],
    version: startVersion,
    async execAsync(sql: string) {
      state.sql.push(sql);
      const m = /^pragma user_version = (\d+)$/.exec(sql);
      if (m) state.version = Number(m[1]);
      if (kirilacakSurum !== undefined && sql.includes(`kirik${kirilacakSurum}`)) {
        throw new Error('sql hatası');
      }
    },
    async getFirstAsync<T>(sql: string): Promise<T | null> {
      if (sql === 'pragma user_version') return { user_version: state.version } as unknown as T;
      return null;
    },
  };
  return state as SqlDatabase & { sql: string[]; version: number };
}

describe('anahtar-değer deposu', () => {
  const codec = {
    parse: (raw: unknown) => {
      if (typeof raw !== 'number') throw new Error('sayı değil');
      return raw;
    },
    fallback: 42,
  };

  it('yazılan değer okunur', async () => {
    const kv = new KeyValueStore(new MemoryBackend());
    await kv.write('x', 7);
    expect(await kv.read('x', codec)).toBe(7);
  });

  it('kayıt yoksa varsayılan döner', async () => {
    const kv = new KeyValueStore(new MemoryBackend());
    expect(await kv.read('yok', codec)).toBe(42);
  });

  it('bozuk JSON uygulamayı çökertmez, varsayılana düşer', async () => {
    const backend = new MemoryBackend();
    await backend.setItem('bes.x', '{bozuk');
    const kv = new KeyValueStore(backend);
    expect(await kv.read('x', codec)).toBe(42);
  });

  it('şemaya uymayan değer varsayılana düşer', async () => {
    const kv = new KeyValueStore(new MemoryBackend());
    await kv.write('x', 'metin');
    expect(await kv.read('x', codec)).toBe(42);
  });

  it('depo yazamazsa uygulama hata fırlatmaz', async () => {
    const kirik = {
      getItem: async () => null,
      setItem: async () => { throw new Error('dolu'); },
      removeItem: async () => undefined,
    };
    const kv = new KeyValueStore(kirik);
    expect(await kv.write('x', 1)).toBe(false);
  });
});

describe('gizli değer deposu', () => {
  function sahteSecure(): SecureBackend & { map: Map<string, string> } {
    const map = new Map<string, string>();
    return {
      map,
      getItemAsync: async (k) => map.get(k) ?? null,
      setItemAsync: async (k, v) => { map.set(k, v); },
      deleteItemAsync: async (k) => { map.delete(k); },
    };
  }

  it('jeton yalnız güvenli depoya yazılır', async () => {
    const backend = sahteSecure();
    const store = new SecureStore(backend);
    await store.set('accessToken', 'gizli-jeton');
    expect(backend.map.get('accessToken')).toBe('gizli-jeton');
  });

  it('çıkışta bilinen sırların hepsi silinir', async () => {
    const backend = sahteSecure();
    const store = new SecureStore(backend);
    await store.set('accessToken', 'a');
    await store.set('refreshToken', 'b');
    await store.clear();
    expect(backend.map.size).toBe(0);
  });

  it('Keychain okunamazsa null döner, hata fırlatmaz', async () => {
    const store = new SecureStore({
      getItemAsync: async () => { throw new Error('kilitli'); },
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    });
    expect(await store.get('accessToken')).toBeNull();
  });
});

describe('yerel şema migration', () => {
  it('sürümler 1den başlar ve boşluksuz artar', () => {
    expect(validateMigrations()).toEqual([]);
  });

  it('yeni kurulumda hepsi uygulanır', async () => {
    const db = sahteDb(0);
    const rapor = await migrate(db);
    expect(rapor.from).toBe(0);
    expect(rapor.to).toBe(LATEST_VERSION);
    expect(rapor.applied).toHaveLength(MIGRATIONS.length);
    expect(await currentVersion(db)).toBe(LATEST_VERSION);
  });

  it('güncel kurulumda hiçbir şey uygulanmaz', async () => {
    const db = sahteDb(LATEST_VERSION);
    const rapor = await migrate(db);
    expect(rapor.applied).toEqual([]);
    expect(db.sql.filter((s) => s.startsWith('begin'))).toHaveLength(0);
  });

  it('yarı güncel kurulumda yalnız eksikler uygulanır', async () => {
    const db = sahteDb(1);
    const rapor = await migrate(db);
    expect(rapor.applied).toEqual(MIGRATIONS.filter((m) => m.version > 1).map((m) => m.name));
  });

  it('her migration kendi işlemi içinde çalışır', async () => {
    const db = sahteDb(0);
    await migrate(db);
    expect(db.sql.filter((s) => s === 'begin')).toHaveLength(MIGRATIONS.length);
    expect(db.sql.filter((s) => s === 'commit')).toHaveLength(MIGRATIONS.length);
  });

  it('bir ifade patlarsa geri alınır ve sürüm ilerlemez', async () => {
    const kirikListe = [
      { version: 1, name: 'ilk', statements: ['create table a (x integer)'] },
      { version: 2, name: 'kirik', statements: ['kirik2'] },
    ];
    const db = sahteDb(0, 2);
    await expect(migrate(db, kirikListe)).rejects.toThrow();
    expect(db.version).toBe(1);
    expect(db.sql).toContain('rollback');
  });

  it('bekleyen liste sürüm sırasındadır', () => {
    const p = pendingMigrations(0);
    expect(p.map((m) => m.version)).toEqual([...p].map((m) => m.version).sort((a, b) => a - b));
  });
});

describe('ayar doğrulaması', () => {
  it('boş kayıttan tam varsayılan üretilir', () => {
    expect(parseSettings({})).toEqual(defaultSettings);
  });

  it('bozuk kayıt varsayılana düşer', () => {
    expect(parseSettings('saçmalık')).toEqual(defaultSettings);
    expect(parseSettings(null)).toEqual(defaultSettings);
  });

  it('geçerli alanlar korunur', () => {
    const s = parseSettings({ themeMode: 'dark', language: 'en', hijriOffset: 1 });
    expect(s.themeMode).toBe('dark');
    expect(s.language).toBe('en');
    expect(s.hijriOffset).toBe(1);
  });

  it('aralık dışı değer tüm kaydı varsayılana düşürür', () => {
    expect(parseSettings({ hijriOffset: 9 })).toEqual(defaultSettings);
    expect(parseSettings({ quran: { fontScale: 5 } })).toEqual(defaultSettings);
  });

  it('bilinmeyen dil kabul edilmez', () => {
    expect(parseSettings({ language: 'ja' })).toEqual(defaultSettings);
  });
});
