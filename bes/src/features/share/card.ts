/**
 * Paylaşım kartı — şartname §62, §107.
 *
 * Üç boyut: hikâye (9:16), kare (1:1), dikey (4:5). Kart SVG olarak üretilir;
 * böylece her çözünürlükte keskin çıkar ve dış kütüphane gerekmez.
 *
 * Değişmez kural: **kaynak künyesi karttan silinemez.** Âyet ya da meal
 * paylaşılıyorsa mütercim adı ve kaynak kartın üzerindedir; bu, metni
 * bağlamından kopuk dolaştırmamak içindir (CONTENT_SOURCES kuralı 3).
 */

export type CardFormat = 'story' | 'square' | 'portrait';

export interface CardSize { width: number; height: number }

export const CARD_SIZES: Record<CardFormat, CardSize> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

export interface CardPalette {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  motif: string;
}

export interface CardContent {
  /** Arapça metin — varsa üstte, sağdan sola. */
  arabic?: string;
  /** Türkçe metin (meal, dua, bilgi). */
  body: string;
  /** "Bakara 255" gibi künye satırı. */
  reference?: string;
  /** Kaynak künyesi — **zorunlu**, boş verilemez. */
  source: string;
  /** Uygulama adı, kartın altında. */
  brand: string;
}

/** XML'e gömülecek metni kaçırır: `&`, `<`, `>` kartı bozar. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Metni satırlara böler. Ölçüm yapamadığımız için karakter genişliği
 * tahminine dayanır; tahmin **cömert** seçilir ki metin taşmasın.
 */
export function wrapText(text: string, maxCharsPerLine: number): string[] {
  const kelimeler = text.trim().split(/\s+/).filter(Boolean);
  if (kelimeler.length === 0) return [];
  const satirlar: string[] = [];
  let mevcut = '';
  for (const k of kelimeler) {
    const aday = mevcut ? `${mevcut} ${k}` : k;
    if (aday.length > maxCharsPerLine && mevcut) {
      satirlar.push(mevcut);
      mevcut = k;
    } else {
      mevcut = aday;
    }
  }
  if (mevcut) satirlar.push(mevcut);
  return satirlar;
}

/** Satır sayısına göre yazı boyutu: uzun metinde küçülür ama okunaklı kalır. */
export function bodyFontSize(lineCount: number, format: CardFormat): number {
  const taban = format === 'story' ? 52 : 46;
  if (lineCount <= 4) return taban;
  if (lineCount <= 8) return taban - 8;
  if (lineCount <= 12) return taban - 14;
  return taban - 18;
}

/** Kart metninin sığacağı en uzun hâli; aşan metin kısaltılır. */
export const MAX_BODY_CHARS = 600;

export function truncateBody(text: string, max = MAX_BODY_CHARS): string {
  const t = text.trim();
  if (t.length <= max) return t;
  // Kelimeyi ortadan kesmemek için son boşluktan kırp.
  const kirpik = t.slice(0, max);
  const son = kirpik.lastIndexOf(' ');
  return `${(son > max * 0.6 ? kirpik.slice(0, son) : kirpik).trimEnd()}…`;
}

export interface BuildCardOptions {
  format: CardFormat;
  content: CardContent;
  palette: CardPalette;
  /** Arka plan motifi çizilsin mi (§9). */
  motif?: boolean;
}

/**
 * Kartı SVG olarak üretir. Dönen dize doğrudan dosyaya yazılabilir ya da
 * `react-native-svg` ile çizdirilebilir.
 */
export function buildCardSvg(options: BuildCardOptions): string {
  const { format, content, palette } = options;
  const { width, height } = CARD_SIZES[format];
  const kenar = Math.round(width * 0.09);
  const icGenislik = width - kenar * 2;

  if (!content.source.trim()) {
    // Kaynaksız kart üretilmez: metni bağlamından koparmamak için.
    throw new Error('Paylaşım kartında kaynak künyesi zorunludur');
  }

  const govde = truncateBody(content.body);
  const satirBasinaKarakter = Math.floor(icGenislik / (format === 'story' ? 26 : 23));
  const satirlar = wrapText(govde, satirBasinaKarakter);
  const punto = bodyFontSize(satirlar.length, format);
  const satirYuksekligi = Math.round(punto * 1.5);

  const arapcaSatirlar = content.arabic
    ? wrapText(content.arabic, Math.floor(satirBasinaKarakter * 0.85))
    : [];
  const arapcaPunto = Math.round(punto * 1.25);
  const arapcaYukseklik = Math.round(arapcaPunto * 1.9);

  const toplamYukseklik = arapcaSatirlar.length * arapcaYukseklik
    + (arapcaSatirlar.length > 0 ? kenar : 0)
    + satirlar.length * satirYuksekligi;
  // Metin **künyenin üstündeki alana** ortalanır, tuvalin tamamına değil:
  // aksi hâlde alt üçte bir boş kalıp kart dengesiz görünüyor.
  const ustSinir = kenar * 2;
  const altSinir = height - kenar * 4;
  const alanYuksekligi = altSinir - ustSinir;
  let y = ustSinir + Math.round((alanYuksekligi - toplamYukseklik) / 2) + Math.round(punto * 0.8);
  y = Math.max(ustSinir + punto, Math.min(y, altSinir));

  const parcalar: string[] = [];

  for (const satir of arapcaSatirlar) {
    // RTL metinde "start" sağ kenardır. `text-anchor="end"` ile birlikte
    // kullanmak satırı sağa değil sola dayar ve metin tuvalden taşar —
    // bu bir kez böyle çıktı, örnek kart üretilip bakılarak yakalandı.
    parcalar.push(
      `<text x="${width - kenar}" y="${y}" text-anchor="start" direction="rtl" ` +
      `font-family="Amiri, serif" font-size="${arapcaPunto}" fill="${palette.text}">` +
      `${escapeXml(satir)}</text>`,
    );
    y += arapcaYukseklik;
  }
  if (arapcaSatirlar.length > 0) y += kenar;

  for (const satir of satirlar) {
    parcalar.push(
      `<text x="${kenar}" y="${y}" font-size="${punto}" fill="${palette.text}" ` +
      `font-family="system-ui, sans-serif">${escapeXml(satir)}</text>`,
    );
    y += satirYuksekligi;
  }

  const kunyeY = height - kenar * 2;
  if (content.reference) {
    parcalar.push(
      `<text x="${kenar}" y="${kunyeY - 54}" font-size="34" fill="${palette.accent}" ` +
      `font-family="system-ui, sans-serif">${escapeXml(content.reference)}</text>`,
    );
  }
  parcalar.push(
    `<text x="${kenar}" y="${kunyeY}" font-size="26" fill="${palette.muted}" ` +
    `font-family="system-ui, sans-serif">${escapeXml(content.source)}</text>`,
  );
  parcalar.push(
    `<text x="${width - kenar}" y="${kunyeY}" text-anchor="end" font-size="26" ` +
    `fill="${palette.muted}" font-family="system-ui, sans-serif">${escapeXml(content.brand)}</text>`,
  );

  const motif = options.motif === false ? '' : motifTanimi(palette.motif, width, height);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${palette.background}"/>` +
    motif +
    parcalar.join('') +
    '</svg>';
}

/** Düşük opaklıkta sekizli yıldız örgüsü (§9). */
function motifTanimi(renk: string, width: number, height: number): string {
  const karo = 120;
  const c = karo / 2;
  const r = karo * 0.34;
  const kare = (rot: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 4; i++) {
      const a = rot + (Math.PI / 2) * i;
      pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join('L')}Z`;
  };
  return `<defs><pattern id="motif" width="${karo}" height="${karo}" patternUnits="userSpaceOnUse">` +
    `<path d="${kare(0)}" fill="none" stroke="${renk}" stroke-width="1.4"/>` +
    `<path d="${kare(Math.PI / 4)}" fill="none" stroke="${renk}" stroke-width="1.4"/>` +
    `</pattern></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#motif)" opacity="0.07"/>`;
}
