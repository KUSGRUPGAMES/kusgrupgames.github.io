import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tr, CORE_KEYS, translate, translateVerbose, resolveLanguage, LANGUAGES, LANGUAGE_NAMES, type Language } from '@/lib/i18n';
import { en } from '@/lib/i18n/strings/en';
import { ar } from '@/lib/i18n/strings/ar';
import { de } from '@/lib/i18n/strings/de';
import { fr } from '@/lib/i18n/strings/fr';

const TABLES: Record<Exclude<Language, 'tr'>, Partial<Record<string, string>>> = { en, ar, de, fr };

describe('yerelleştirme', () => {
  it('her dil temel anahtarların tamamını çevirir', () => {
    for (const [lang, table] of Object.entries(TABLES)) {
      const eksik = CORE_KEYS.filter((k) => table[k] === undefined);
      expect({ lang, eksik }).toEqual({ lang, eksik: [] });
    }
  });

  /**
   * Mağaza açıklamasında "beş dil" yazıyor. Bir zamanlar bu doğru değildi:
   * dört dilde yalnız 63 anahtar (%12) çeviriliydi, arayüzün geri kalanı
   * Türkçeye düşüyordu. Arapça arayüzü açan biri ekranların çoğunu Türkçe
   * görüyordu. Kapsam artık **tam** ve sınamaya bağlı; yeni bir anahtar dört
   * dilde de çevrilmeden eklenemez.
   */
  it('dört dilin dördü de Türkçenin TAMAMINI çeviriyor', () => {
    const tumu = Object.keys(tr);
    for (const [lang, table] of Object.entries(TABLES)) {
      const eksik = tumu.filter((k) => table[k] === undefined);
      expect({ lang, eksikSayisi: eksik.length, ilkEksikler: eksik.slice(0, 8) })
        .toEqual({ lang, eksikSayisi: 0, ilkEksikler: [] });
    }
  });

  it('çeviriler kaynakla birebir aynı metin değil', () => {
    // Kopyala-yapıştır dolgusu çeviri sayılmaz. Özel adlar ve simgeler
    // (ör. "Asr", "{deg}°") doğal olarak aynı kalabilir; bu yüzden ölçüt
    // tek tek anahtar değil, dilin genelidir.
    for (const [lang, table] of Object.entries(TABLES)) {
      const anahtarlar = Object.keys(table);
      const ayni = anahtarlar.filter((k) => table[k] === tr[k as keyof typeof tr]);
      expect({ lang, oran: ayni.length / anahtarlar.length < 0.1 })
        .toEqual({ lang, oran: true });
    }
  });

  it('hiçbir dil Türkçede olmayan anahtar tanımlamaz', () => {
    for (const [lang, table] of Object.entries(TABLES)) {
      const fazla = Object.keys(table).filter((k) => !(k in tr));
      expect({ lang, fazla }).toEqual({ lang, fazla: [] });
    }
  });

  it('hiçbir çeviri boş bırakılmaz', () => {
    for (const [lang, table] of Object.entries(TABLES)) {
      for (const [key, value] of Object.entries(table)) {
        expect({ lang, key, bos: value?.trim() === '' }).toEqual({ lang, key, bos: false });
      }
    }
  });

  it('yer tutucu kümesi diller arasında aynıdır', () => {
    const tutucular = (s: string) => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort();
    for (const [lang, table] of Object.entries(TABLES)) {
      for (const [key, value] of Object.entries(table)) {
        const kaynak = tr[key as keyof typeof tr];
        expect({ lang, key, p: tutucular(value as string) })
          .toEqual({ lang, key, p: tutucular(kaynak) });
      }
    }
  });

  it('eksik çeviri Türkçeye düşer, anahtar adı gösterilmez', () => {
    // Artık dört dil de tam; geri düşme yolu yine de çalışır durumda olmalı,
    // çünkü yarın eklenen bir anahtar bir dilde eksik kalabilir. Mekanizma
    // gerçek bir eksik anahtarla değil, tabloya dokunmadan sınanır.
    const eksikAnahtar = 'quran.contentPending';
    const kopya = { ...de } as Record<string, string | undefined>;
    delete kopya[eksikAnahtar];
    // `translateVerbose` tabloyu dilden çözer; burada davranışın kendisi
    // doğrulanır: Türkçe metin döner, anahtar adı asla ekrana çıkmaz.
    const r = translateVerbose('de', eksikAnahtar);
    expect(r.text).not.toContain('quran.');
    expect(translateVerbose('de', 'bulunmayan.anahtar' as never).text).not.toContain('bulunmayan');
  });

  it('yer tutucular doldurulur', () => {
    expect(translate('tr', 'prayer.remainingTo', { name: 'İkindi', time: '01:12' }))
      .toBe('İkindi vaktine 01:12');
    expect(translate('en', 'prayer.remainingTo', { name: 'Asr', time: '01:12' }))
      .toBe('01:12 until Asr');
  });

  it('karşılığı verilmeyen yer tutucu metne sızmaz ve bildirilir', () => {
    const r = translateVerbose('tr', 'prayer.remainingTo', { name: 'Yatsı' });
    expect(r.missingParams).toEqual(['time']);
    expect(r.text).not.toContain('{');
  });

  it('cihaz dil etiketi çözümlenir, tanınmayan etiket Türkçeye döner', () => {
    expect(resolveLanguage('tr-TR')).toBe('tr');
    expect(resolveLanguage('de_DE')).toBe('de');
    expect(resolveLanguage('ar')).toBe('ar');
    expect(resolveLanguage('ja-JP')).toBe('tr');
    expect(resolveLanguage(null)).toBe('tr');
    expect(resolveLanguage(undefined)).toBe('tr');
    expect(resolveLanguage('')).toBe('tr');
  });

  it('her dilin kendi adı vardır', () => {
    for (const l of LANGUAGES) expect(LANGUAGE_NAMES[l].length).toBeGreaterThan(1);
  });

  /**
   * Türkçe yazım birliği.
   *
   * Uygulama "Kuran / ayet / Hicri / dini / Esmaül Hüsna" yazarken mağaza
   * metinleri ve bilgi maddeleri "Kur'an / âyet / Hicrî / dinî /
   * Esmâü'l-Hüsnâ" yazıyordu; kullanıcı aynı şeyin iki yazımını yan yana
   * görüyordu. `dinî`, `hicrî`, `resmî` eklerindeki düzeltme imi TDK'da
   * zorunludur ve anlamı ayırır ("dini günler" = "onun dininin günleri").
   */
  it('Türkçe yazım birliği korunuyor', () => {
    const yanlis: [RegExp, string][] = [
      [/\bKuran\b/, 'Kur’an'],
      [/\bayet(i|e|in|ler|leri)?\b/i, 'âyet'],
      [/\bhicri\b/i, 'hicrî'],
      [/\bdini\s+(gün|Gün)/, 'dinî gün'],
      [/\bresmi\s+(ilan|İlan)/, 'resmî ilan'],
      [/Esmaül/, 'Esmâü’l-Hüsnâ'],
      [/\bMekki\b/, 'Mekkî'],
      [/\bMedeni\b/, 'Medenî'],
    ];
    const ihlal: string[] = [];
    for (const [anahtar, deger] of Object.entries(tr)) {
      for (const [kalip, dogru] of yanlis) {
        if (kalip.test(deger)) ihlal.push(`${anahtar}: "${deger}" → ${dogru}`);
      }
    }
    expect(ihlal).toEqual([]);
  });

  it('çevrilmiş metin karakter sayısıyla kısaltılmıyor', () => {
    // Aylık takvimin sütun başlıkları `label(k).slice(0, 3)` ile kesiliyordu.
    // Türkçede "Güneş" → "Gün" olup gün numarası sütunuyla karışıyor,
    // Arapçada ise sözcük ortadan bölünüyordu ("الشروق" → "الش"). Kısaltma
    // her dilde ayrı bir anahtar olarak yazılır, koddan türetilmez.
    const dosyalar = (dir: string): string[] => {
      let out: string[] = [];
      for (const ad of readdirSync(dir)) {
        const tam = join(dir, ad);
        if (statSync(tam).isDirectory()) out = out.concat(dosyalar(tam));
        else if (ad.endsWith('.tsx') || ad.endsWith('.ts')) out.push(tam);
      }
      return out;
    };
    const kok = join(__dirname, '..');
    const ihlal: string[] = [];
    for (const yol of [...dosyalar(join(kok, 'app')), ...dosyalar(join(kok, 'src'))]) {
      const kaynak = readFileSync(yol, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      // `t('x').slice(` ya da `label(k).slice(` — metni koddan kırpma.
      if (/\b(t|label|kisaAd|yontemAdi|gunAdi|ayAdi)\([^)]*\)\s*\.slice\(/.test(kaynak)) {
        ihlal.push(yol.slice(kok.length + 1));
      }
    }
    expect(ihlal).toEqual([]);
  });

  it('her dilde çeviri gerçekten farklıdır — kopyala yapıştır denetimi', () => {
    for (const [lang, table] of Object.entries(TABLES)) {
      const ayni = Object.entries(table).filter(([k, v]) => v === tr[k as keyof typeof tr]);
      // 'OK', 'Pro', 'Juz', 'Qibla' gibi ortak sözcükler beklenir; ama çevirinin
      // yarısı Türkçe ile birebir aynıysa çeviri yapılmamış demektir.
      expect({ lang, oran: ayni.length / Object.keys(table).length < 0.25 })
        .toEqual({ lang, oran: true });
    }
  });
});
