import {
  buildCardSvg, escapeXml, wrapText, truncateBody, bodyFontSize,
  CARD_SIZES, MAX_BODY_CHARS, type CardPalette, type CardContent, type CardFormat,
} from '@/features/share/card';

const palet: CardPalette = {
  background: '#04211B', surface: '#06342A', text: '#FBF8F1',
  muted: '#8FA29B', accent: '#C9A756', motif: '#C9A756',
};

const icerik: CardContent = {
  body: 'Ey iman edenler! Sabır ve namazla yardım isteyin.',
  reference: 'Bakara 153',
  source: 'Elmalılı Hamdi Yazır meali · kamu malı',
  brand: 'BEŞ',
};

describe('XML kaçırma', () => {
  it('kartı bozabilecek karakterler kaçırılır', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b');
    expect(escapeXml('<script>')).toBe('&lt;script&gt;');
    expect(escapeXml('"tırnak"')).toBe('&quot;tırnak&quot;');
  });

  it('Türkçe ve Arapça harfler bozulmaz', () => {
    expect(escapeXml('ığüşöçİĞÜŞÖÇ')).toBe('ığüşöçİĞÜŞÖÇ');
    expect(escapeXml('بسم')).toBe('بسم');
  });
});

describe('metin sarma', () => {
  it('uzun metin satırlara bölünür', () => {
    const s = wrapText('bir iki üç dört beş altı yedi sekiz', 10);
    expect(s.length).toBeGreaterThan(1);
    for (const satir of s) expect(satir.length).toBeLessThanOrEqual(12);
  });

  it('boş metin boş dizi verir', () => {
    expect(wrapText('', 20)).toEqual([]);
    expect(wrapText('   ', 20)).toEqual([]);
  });

  it('tek uzun kelime kendi satırında kalır, kaybolmaz', () => {
    const s = wrapText('cokcokcokuzunbirkelime', 8);
    expect(s).toEqual(['cokcokcokuzunbirkelime']);
  });

  it('hiçbir kelime kaybolmaz', () => {
    const metin = 'bir iki üç dört beş altı yedi sekiz dokuz on';
    expect(wrapText(metin, 12).join(' ').split(/\s+/)).toEqual(metin.split(' '));
  });
});

describe('metin kısaltma', () => {
  it('sınırın altındaki metin dokunulmaz kalır', () => {
    expect(truncateBody('kısa metin')).toBe('kısa metin');
  });

  it('uzun metin kırpılır ve üç nokta eklenir', () => {
    const uzun = 'kelime '.repeat(200);
    const k = truncateBody(uzun);
    expect(k.length).toBeLessThanOrEqual(MAX_BODY_CHARS + 1);
    expect(k.endsWith('…')).toBe(true);
  });

  it('kelime ortadan kesilmez', () => {
    const uzun = `${'a'.repeat(10)} `.repeat(100);
    const k = truncateBody(uzun, 50);
    expect(k.replace('…', '').trimEnd().endsWith('a')).toBe(true);
  });
});

describe('yazı boyutu', () => {
  it('uzun metinde küçülür ama okunaklı kalır', () => {
    expect(bodyFontSize(3, 'story')).toBeGreaterThan(bodyFontSize(14, 'story'));
    expect(bodyFontSize(20, 'square')).toBeGreaterThanOrEqual(24);
  });
});

describe('kart üretimi', () => {
  const bicimler: CardFormat[] = ['story', 'square', 'portrait'];

  it('üç boyut da doğru ölçülerde üretilir', () => {
    for (const f of bicimler) {
      const svg = buildCardSvg({ format: f, content: icerik, palette: palet });
      expect(svg).toContain(`width="${CARD_SIZES[f].width}"`);
      expect(svg).toContain(`height="${CARD_SIZES[f].height}"`);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
    }
  });

  it('kaynak künyesi karttan silinemez', () => {
    const svg = buildCardSvg({ format: 'square', content: icerik, palette: palet });
    expect(svg).toContain('Elmalılı');
    expect(svg).toContain('BEŞ');
  });

  it('kaynaksız kart üretilmez', () => {
    expect(() => buildCardSvg({
      format: 'square', palette: palet,
      content: { ...icerik, source: '' },
    })).toThrow();
    expect(() => buildCardSvg({
      format: 'square', palette: palet,
      content: { ...icerik, source: '   ' },
    })).toThrow();
  });

  it('Arapça metin sağdan sola çizilir', () => {
    const svg = buildCardSvg({
      format: 'portrait', palette: palet,
      content: { ...icerik, arabic: 'بسم الله' },
    });
    expect(svg).toContain('direction="rtl"');
    expect(svg).toContain('Amiri');
  });

  it('metindeki XML karakterleri kartı bozmaz', () => {
    const svg = buildCardSvg({
      format: 'square', palette: palet,
      content: { ...icerik, body: 'a < b & c > d' },
    });
    expect(svg).not.toContain('a < b');
    expect(svg).toContain('&amp;');
    // Etiket sayısı dengeli olmalı: kaçırma başarısızsa açılış/kapanış şaşar.
    expect((svg.match(/<text/g) ?? []).length).toBe((svg.match(/<\/text>/g) ?? []).length);
  });

  it('motif kapatılabilir', () => {
    const acik = buildCardSvg({ format: 'square', content: icerik, palette: palet });
    const kapali = buildCardSvg({ format: 'square', content: icerik, palette: palet, motif: false });
    expect(acik).toContain('pattern');
    expect(kapali).not.toContain('pattern');
  });

  it('çok uzun metinde bile kart sınırları içinde kalır', () => {
    const svg = buildCardSvg({
      format: 'square', palette: palet,
      content: { ...icerik, body: 'kelime '.repeat(300) },
    });
    const yler = [...svg.matchAll(/ y="(\d+)"/g)].map((m) => Number(m[1]));
    for (const y of yler) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThanOrEqual(CARD_SIZES.square.height);
    }
  });
});
