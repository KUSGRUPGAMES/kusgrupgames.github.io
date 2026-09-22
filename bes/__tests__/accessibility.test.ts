/**
 * Erişilebilirlik denetimi — şartname §79.
 *
 * Bu sınama kaynak kodu tarar. Amaç, "erişilebilirlik geçişi yapıldı" demeyi
 * insan hafızasına bırakmamak: bir ekran yeni bir dokunma hedefi eklediğinde
 * etiketi unutursa test kırılır.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

function dosyalar(dir: string, uzanti = '.tsx'): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(dosyalar(full, uzanti));
    else if (entry.endsWith(uzanti)) out.push(full);
  }
  return out;
}

const tumTsx = [...dosyalar(join(ROOT, 'app')), ...dosyalar(join(ROOT, 'src'))];

/**
 * Bir JSX açılış etiketinin özelliklerini çıkarır.
 * Basit bir regex yetmez: `onPress={() => x > 1}` içindeki `>` etiketi erken
 * bitirmiş gibi görünür ve etiketten sonraki erişilebilirlik özellikleri
 * gözden kaçar — bu sınama tam olarak bu yüzden bir kez yanlış alarm verdi.
 */
function acilisEtiketleri(kaynakKod: string, bilesen: string): string[] {
  const out: string[] = [];
  const isaret = `<${bilesen}`;
  let i = kaynakKod.indexOf(isaret);
  while (i >= 0) {
    let derinlik = 0;
    let j = i + isaret.length;
    for (; j < kaynakKod.length; j++) {
      const ch = kaynakKod[j];
      if (ch === '{') derinlik++;
      else if (ch === '}') derinlik--;
      else if (ch === '>' && derinlik === 0) break;
    }
    out.push(kaynakKod.slice(i + isaret.length, j));
    i = kaynakKod.indexOf(isaret, j);
  }
  return out;
}
const kaynak = (p: string) => readFileSync(p, 'utf8');
const kodu = (p: string) =>
  kaynak(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('dokunma hedefleri ve etiketler', () => {
  it('IconButton her kullanımda etiket alır', () => {
    const eksik: string[] = [];
    for (const p of tumTsx) {
      const s = kodu(p);
      for (const ozellikler of acilisEtiketleri(s, 'IconButton')) {
        if (!/\blabel=/.test(ozellikler)) eksik.push(`${p}: ${ozellikler.slice(0, 60)}`);
      }
    }
    expect(eksik).toEqual([]);
  });

  it('ham Pressable kullanan ekranlar erişilebilirlik bilgisi verir', () => {
    const eksik: string[] = [];
    for (const p of tumTsx) {
      const s = kodu(p);
      for (const ozellikler of acilisEtiketleri(s, 'Pressable')) {
        const var_ = /accessibilityLabel|accessibilityRole|accessible\b/.test(ozellikler);
        if (!var_) eksik.push(`${p}: ${ozellikler.slice(0, 80)}`);
      }
    }
    expect(eksik).toEqual([]);
  });

  it('Segment seçicinin ne seçtiği yazıyor', () => {
    // `accessibilityLabel` yalnız ekran okuyucuya konuşur. Zekât ekranında
    // nisap ölçüsü böyleydi: gören kullanıcı "Altın / Gümüş" yazan bir çubuk
    // görüyor, neyi seçtiğini bilmiyordu. Seçenekler kendi başına anlaşılıyorsa
    // (Sureler / Cüzler) `accessibilityLabel` yeter; ikisinden biri şart.
    const eksik: string[] = [];
    for (const p of tumTsx) {
      for (const ozellikler of acilisEtiketleri(kodu(p), 'Segmented')) {
        if (!/\blabel=|\baccessibilityLabel=/.test(ozellikler)) {
          eksik.push(`${p}: ${ozellikler.slice(0, 60)}`);
        }
      }
    }
    expect(eksik).toEqual([]);
  });

  it('seçili satır emir kipiyle işaretlenmez', () => {
    // Kıraat ekranında seçili okuyucunun yanında "Seç" rozeti duruyordu:
    // zaten seçili olan satır kullanıcıya "seç" diyordu. Seçili durum
    // `ListItem selected` ile, onay imi ve `accessibilityState` olarak verilir.
    const ihlal: string[] = [];
    for (const p of tumTsx) {
      const s = kodu(p);
      if (/<Badge[^>]*label=\{t\('common\.select'\)\}/.test(s)) ihlal.push(p);
    }
    expect(ihlal).toEqual([]);
  });

  it('ham Text/View yerine tasarım sistemi kullanılır (ekranlarda)', () => {
    const ihlal: string[] = [];
    for (const p of dosyalar(join(ROOT, 'app'))) {
      const s = kodu(p);
      // `react-native` içinden Text almak, tipografi ve renk token'larını atlar.
      if (/import\s*\{[^}]*\bText\b[^}]*\}\s*from\s*'react-native'/.test(s)) ihlal.push(p);
    }
    expect(ihlal).toEqual([]);
  });
});

describe('metin ölçeklenmesi ve hareket', () => {
  it('Text bileşeni Dynamic Type çarpanını sınırlar', () => {
    const s = kaynak(join(ROOT, 'src', 'ui', 'Text.tsx'));
    expect(s).toContain('maxFontSizeMultiplier');
  });

  it('Arapça metin kullanıcı ölçeğini tek çarpan olarak uygular', () => {
    const s = kaynak(join(ROOT, 'src', 'ui', 'ArabicText.tsx'));
    expect(s).toContain('allowFontScaling={false}');
    expect(s).toContain('lineHeight');
  });

  it('reduced-motion tema katmanında süreleri sıfırlar', () => {
    const s = kaynak(join(ROOT, 'src', 'theme', 'ThemeProvider.tsx'));
    expect(s).toContain('isReduceMotionEnabled');
    expect(s).toContain('reduceMotionChanged');
  });

  it('titreşim veren yerler reduced-motion durumunu okur', () => {
    for (const ad of ['qibla.tsx', 'dhikr.tsx']) {
      const s = kaynak(join(ROOT, 'app', ad));
      expect({ ad, ok: s.includes('reduceMotion') }).toEqual({ ad, ok: true });
    }
  });

  it('iskelet animasyonu reduced-motion açıkken durur', () => {
    expect(kaynak(join(ROOT, 'src', 'ui', 'Skeleton.tsx'))).toContain('reduceMotion');
  });
});

describe('durum bildirimi', () => {
  it('ilerleme ve geri sayım ekran okuyucuya değer bildirir', () => {
    expect(kaynak(join(ROOT, 'src', 'ui', 'ProgressBar.tsx'))).toContain('accessibilityValue');
    expect(kaynak(join(ROOT, 'src', 'ui', 'CountdownRing.tsx'))).toContain('accessibilityLabel');
  });

  it('hata durumu alarm rolüyle duyurulur', () => {
    expect(kaynak(join(ROOT, 'src', 'ui', 'ErrorState.tsx'))).toContain("accessibilityRole=\"alert\"");
  });

  it('kıble hizalanması canlı bölge olarak duyurulur', () => {
    expect(kaynak(join(ROOT, 'app', 'qibla.tsx'))).toContain('accessibilityLiveRegion');
  });

  it('seçim bileşenleri seçili durumu bildirir', () => {
    for (const ad of ['Chip.tsx', 'Segmented.tsx']) {
      expect(kaynak(join(ROOT, 'src', 'ui', ad))).toContain('selected');
    }
  });

  it('düğme devre dışıyken bunu bildirir', () => {
    const s = kaynak(join(ROOT, 'src', 'ui', 'Button.tsx'));
    expect(s).toContain('accessibilityState');
    expect(s).toContain('busy');
  });
});

describe('dokunma hedefi boyutu', () => {
  it('düğme ve ikon düğmesi en az 44 birim yüksekliktedir', () => {
    expect(kaynak(join(ROOT, 'src', 'ui', 'IconButton.tsx'))).toContain('Math.max(44');
    const s = kaynak(join(ROOT, 'src', 'ui', 'Button.tsx'));
    // 'sm' 40 birim; bu durumda hitSlop ile 44'e tamamlanır.
    expect(s).toContain('hitSlop');
  });

  it('dokunulabilir her bileşen 44 birimin altına düşmüyor', () => {
    // Segment seçici 38, çip 36 birimdi. İkisi de parmakla vurulan gerçek
    // denetimler: tema seçimi, ikindi hesabı, zikir seçimi, dua kategorisi.
    // Apple HIG'in alt sınırı 44; altında kalan hedef titrek elde ıskalanır.
    const olcu = (dosya: string) => {
      const m = /minHeight:\s*(\d+)/.exec(kaynak(join(ROOT, 'src', 'ui', dosya)));
      return Number(m?.[1] ?? 0);
    };
    for (const dosya of ['Segmented.tsx', 'Chip.tsx', 'ListItem.tsx', 'Field.tsx', 'Stepper.tsx']) {
      expect({ dosya, yeterli: olcu(dosya) >= 44 }).toEqual({ dosya, yeterli: true });
    }
  });
});
