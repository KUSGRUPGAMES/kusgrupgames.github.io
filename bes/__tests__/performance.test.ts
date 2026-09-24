/**
 * Performans denetimi — şartname §80.
 *
 * Uzun listeler sanallaştırılmalı. Bu sınama, bir ekran yüzlerce satırı
 * `.map()` ile çizmeye başlarsa uyarır — telefonda fark edilmesini beklemek
 * yerine burada yakalanır.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { DIVINE_NAMES } from '@/content/names';

const ROOT = join(__dirname, '..');
const oku = (p: string) => readFileSync(p, 'utf8');

function tsx(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(tsx(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Yüzlerce satır üretebilecek veri kaynakları. */
const UZUN_KAYNAKLAR = ['getSurahs()', 'DIVINE_NAMES', 'sureler.map', 'RECITERS.map'];

describe('uzun listeler sanallaştırılmış', () => {
  const ekranlar = tsx(join(ROOT, 'app'));

  it('114 sure ve 99 esmâ doğrudan .map ile çizilmiyor', () => {
    const ihlal: string[] = [];
    for (const p of ekranlar) {
      const s = oku(p);
      const sanalMi = s.includes('VirtualList') || s.includes('FlatList');
      if (sanalMi) continue;
      for (const kaynak of UZUN_KAYNAKLAR) {
        if (s.includes(kaynak) && /\.map\(/.test(s)) ihlal.push(`${basename(p)} — ${kaynak}`);
      }
    }
    expect(ihlal).toEqual([]);
  });

  it('sanal liste toplu çizim sınırlarını belirliyor', () => {
    const s = oku(join(ROOT, 'src', 'ui', 'VirtualList.tsx'));
    for (const ayar of ['initialNumToRender', 'maxToRenderPerBatch', 'windowSize', 'removeClippedSubviews']) {
      expect({ ayar, var: s.includes(ayar) }).toEqual({ ayar, var: true });
    }
  });

  it('okuyucu ekranı âyetleri sanal listeyle çiziyor', () => {
    const s = oku(join(ROOT, 'app', 'reader.tsx'));
    expect(s).toContain('FlatList');
    // Âyet kartları font ölçeği ve meal nedeniyle farklı yükseklikte olabilir.
    // Yer imine giderken ölçülmemiş satır için yaklaşık kaydırma yapılır.
    expect(s).toContain('onScrollToIndexFailed');
    expect(s).toContain('scrollToOffset');
  });
});

describe('gereksiz yeniden hesap yok', () => {
  it('ağır hesaplar useMemo ile korunuyor', () => {
    for (const ad of ['reader.tsx', 'prayer-calendar.tsx', 'ramadan.tsx', 'khatm.tsx']) {
      const s = oku(join(ROOT, 'app', ad));
      expect({ ad, var: s.includes('useMemo') }).toEqual({ ad, var: true });
    }
  });

  it('canlı görünüm astronomiyi saniyede bir yeniden hesaplamıyor', () => {
    const s = oku(join(ROOT, 'src', 'features', 'prayer', 'useSchedule.ts'));
    // Çizelge gün anahtarına bağlı memo ile korunuyor.
    expect(s).toContain('gunAnahtari');
    expect(s).toContain('useMemo');
  });

  it('liste satırları useCallback ile sabitleniyor', () => {
    for (const ad of ['names.tsx']) {
      expect(oku(join(ROOT, 'app', ad))).toContain('useCallback');
    }
    expect(oku(join(ROOT, 'app', '(tabs)', 'quran.tsx'))).toContain('useCallback');
  });
});

describe('veri boyutları', () => {
  it('esmâ listesi beklenen büyüklükte', () => {
    expect(DIVINE_NAMES.length).toBe(99);
  });

  it('Kur’an paketi makul boyutta', () => {
    const boyut = statSync(join(ROOT, 'assets', 'quran', 'quran.json')).size;
    // 6236 âyet + meta veri ~1.7 MB. 4 MB'ı aşarsa bir şey şişmiş demektir.
    expect(boyut).toBeLessThan(4 * 1024 * 1024);
    expect(boyut).toBeGreaterThan(1024 * 1024);
  });

  it('meal paketi makul boyutta', () => {
    const boyut = statSync(join(ROOT, 'assets', 'quran', 'translations', 'tr-yazir.json')).size;
    expect(boyut).toBeLessThan(2 * 1024 * 1024);
  });

  it('ses paketle dağıtılmıyor', () => {
    const varlik = join(ROOT, 'assets');
    const sesler: string[] = [];
    const tara = (d: string) => {
      for (const e of readdirSync(d)) {
        const f = join(d, e);
        if (statSync(f).isDirectory()) tara(f);
        else if (/\.(mp3|m4a|wav|aac|ogg)$/i.test(e)) sesler.push(e);
      }
    };
    tara(varlik);
    expect(sesler).toEqual([]);
  });
});
