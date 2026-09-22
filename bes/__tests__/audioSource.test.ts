import {
  RECITERS, AUDIO_SOURCE, DEFAULT_RECITER, getReciter, resolveBitrate,
  ayahAudioUrl, surahAudioUrls, estimateBytes,
} from '@/features/audio/source';

describe('kıraat kaynağı', () => {
  it('katalog boş değil ve kimlikler tekildir', () => {
    expect(RECITERS.length).toBeGreaterThan(10);
    expect(new Set(RECITERS.map((r) => r.id)).size).toBe(RECITERS.length);
  });

  it('her okuyucunun en az bir bit hızı ölçülmüştür', () => {
    for (const r of RECITERS) {
      expect({ id: r.id, ok: r.bitrates.length > 0 }).toEqual({ id: r.id, ok: true });
      for (const b of r.bitrates) expect([64, 128]).toContain(b);
    }
  });

  it('varsayılan okuyucu katalogda vardır', () => {
    expect(getReciter(DEFAULT_RECITER)).toBeDefined();
  });

  it('kaynak künyesi ve şart bağlantısı kayıtlıdır', () => {
    expect(AUDIO_SOURCE.name).toContain('Islamic Network');
    expect(AUDIO_SOURCE.terms).toContain('terms');
    expect(AUDIO_SOURCE.note.length).toBeGreaterThan(40);
  });

  it('olmayan bit hızı istenince en yükseğe düşülür', () => {
    const tekBit = RECITERS.find((r) => r.bitrates.length === 1)!;
    expect(resolveBitrate(tekBit, 128)).toBe(tekBit.bitrates[0]);
    const cift = RECITERS.find((r) => r.bitrates.length === 2)!;
    expect(resolveBitrate(cift, 128)).toBe(128);
    expect(resolveBitrate(cift, 64)).toBe(64);
  });

  it('âyet adresi beklenen biçimdedir', () => {
    const url = ayahAudioUrl('ar.alafasy', 262, 128);
    expect(url).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3');
  });

  it('mushaf sınırları dışında adres üretilmez', () => {
    expect(ayahAudioUrl('ar.alafasy', 0)).toBeNull();
    expect(ayahAudioUrl('ar.alafasy', 6237)).toBeNull();
    expect(ayahAudioUrl('ar.alafasy', 1.5)).toBeNull();
    expect(ayahAudioUrl('yok.okuyucu', 1)).toBeNull();
  });

  it('sınır âyetleri geçerlidir', () => {
    expect(ayahAudioUrl('ar.alafasy', 1)).toContain('/1.mp3');
    expect(ayahAudioUrl('ar.alafasy', 6236)).toContain('/6236.mp3');
  });

  it('sure adresleri âyet sayısı kadar ve sıralıdır', () => {
    const urls = surahAudioUrls('ar.alafasy', 1, 7);
    expect(urls).toHaveLength(7);
    expect(urls[0]).toContain('/1.mp3');
    expect(urls[6]).toContain('/7.mp3');
  });

  it('boyut tahmini bit hızıyla ölçeklenir', () => {
    expect(estimateBytes(100, 128)).toBeGreaterThan(estimateBytes(100, 64));
    expect(estimateBytes(0, 128)).toBe(0);
    expect(estimateBytes(-5, 128)).toBe(0);
  });

  it('ticari kullanımı yasak kaynak katalogda yok', () => {
    const s = JSON.stringify(AUDIO_SOURCE).toLowerCase();
    expect(s).not.toContain('quranicaudio');
  });
});
