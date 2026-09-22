/**
 * Hazır zikirler — şartname §37.
 *
 * İçerik durumu: okunuş ve Türkçe anlam bu ürün için yazıldı. Arapça yazım,
 * Esmâ listesinde olduğu gibi, doğrulanmış kaynaktan gelene kadar boş
 * bırakıldı (CONTENT_SOURCES kuralı 1, KNOWN_ISSUES T4).
 */

export interface DhikrPreset {
  id: string;
  title: string;
  transliteration: string;
  meaning: string;
  /** Yaygın çekiliş sayısı. Kullanıcı değiştirebilir. */
  target: number;
}

export const DHIKR_PRESETS: readonly DhikrPreset[] = [
  { id: 'subhanallah', title: 'Sübhânallah', transliteration: 'Sübhânallah', meaning: 'Allah her türlü eksiklikten uzaktır', target: 33 },
  { id: 'elhamdulillah', title: 'Elhamdülillah', transliteration: 'Elhamdülillâh', meaning: 'Hamd Allah’a mahsustur', target: 33 },
  { id: 'allahuekber', title: 'Allahü ekber', transliteration: 'Allâhü ekber', meaning: 'Allah en büyüktür', target: 33 },
  { id: 'lailaheillallah', title: 'Lâ ilâhe illallah', transliteration: 'Lâ ilâhe illallâh', meaning: 'Allah’tan başka ilah yoktur', target: 100 },
  { id: 'estagfirullah', title: 'Estağfirullah', transliteration: 'Estağfirullâh', meaning: 'Allah’tan bağışlanma dilerim', target: 100 },
  { id: 'salavat', title: 'Salavât', transliteration: 'Allâhümme salli alâ seyyidinâ Muhammed', meaning: 'Peygamber’e salât ve selam', target: 100 },
  { id: 'hasbunallah', title: 'Hasbünallah', transliteration: 'Hasbünallâhü ve ni’mel vekîl', meaning: 'Allah bize yeter, O ne güzel vekildir', target: 100 },
  { id: 'lahavle', title: 'Lâ havle velâ kuvvete', transliteration: 'Lâ havle velâ kuvvete illâ billâh', meaning: 'Güç ve kuvvet ancak Allah iledir', target: 100 },
];

/** Sayaç için hazır hedefler (§37). */
export const DHIKR_TARGETS: readonly number[] = [33, 99, 100, 300, 500, 1000];
