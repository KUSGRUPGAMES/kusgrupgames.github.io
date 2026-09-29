/**
 * Kur'an'daki dualar — şartname §24, §39.
 *
 * Burada **metin yok, yalnız referans var.** Arapça metin Tanzil paketinden,
 * meal Elmalılı mealinden çalışma anında okunur (`features/duas/pool.ts`);
 * bir referans pakette bulunamazsa dua listeye hiç girmez. Böylece dua
 * metni ezberden ya da elle dizilmez (CONTENT_SOURCES kuralı 1).
 *
 * Her referans eklenirken paketteki meal metni okunarak gerçekten bir dua,
 * sığınma ya da yakarış içerdiği doğrulandı. Âyetin başında anlatım cümlesi
 * varsa ("…diyenler vardır") meal olduğu gibi gösterilir; kırpılmaz, çünkü
 * kırpmak çeviriyi değiştirmek olur.
 *
 * `title` bu uygulama için yazılmış kısa bir başlıktır, âyetin parçası değildir.
 */
import type { DuaCategory } from './duas';

export interface QuranDua {
  id: string;
  category: DuaCategory;
  title: string;
  surah: number;
  ayah: number;
  /** Birden fazla âyete yayılan dualarda son âyet (dahil). */
  to?: number;
}

const q = (id: string, category: DuaCategory, title: string, surah: number, ayah: number, to?: number): QuranDua =>
  ({ id: `kuran-${id}`, category, title, surah, ayah, ...(to ? { to } : {}) });

export const QURAN_DUAS: readonly QuranDua[] = [
  // İman ve hidayet
  q('fatiha', 'iman', 'Doğru yola iletilme', 1, 5, 7),
  q('kabul', 'iman', 'Amellerin kabulü (İbrâhîm ve İsmâil)', 2, 127),
  q('teslimiyet', 'iman', 'Teslimiyet ve tövbe (İbrâhîm ve İsmâil)', 2, 128),
  q('kalp', 'iman', 'Kalbin haktan kaymaması', 3, 8),
  q('sahitler', 'iman', 'Şahitlerle birlikte yazılma', 3, 53),
  q('vaat', 'iman', 'Vaat edilenin verilmesi', 3, 194),
  q('hakki-tanimak', 'iman', 'Hakkı tanıyanların duası', 5, 83),
  q('hikmet', 'iman', 'Hikmet ve iyilerle birlikte olmak (İbrâhîm)', 26, 83, 85),
  q('medyen', 'iman', 'Doğru yola iletilme ümidi (Mûsâ)', 28, 22),

  // Tövbe ve bağışlanma
  q('adem', 'tovbe', 'Âdem ile Havvâ’nın tövbesi', 7, 23),
  q('gufraneke', 'tovbe', 'Bağışlanma dileği', 2, 285),
  q('iman-magfiret', 'tovbe', 'İman ve bağışlanma', 3, 16),
  q('taskinlik', 'tovbe', 'Taşkınlıkların bağışlanması', 3, 147),
  q('iyilerle', 'tovbe', 'İyilerle birlikte can verme', 3, 193),
  q('nuh-siginma', 'tovbe', 'Nûh’un Rabbine sığınması', 11, 47),
  q('merhamet-et', 'tovbe', 'Bağışla ve merhamet et', 23, 109),
  q('merhametlilerin-en-iyisi', 'tovbe', 'Merhametlilerin en iyisi', 23, 118),
  q('musa-tovbe', 'tovbe', 'Mûsâ’nın tövbesi', 28, 16),
  q('kardes', 'tovbe', 'Kardeşi için bağışlanma (Mûsâ)', 7, 151),
  q('ars', 'tovbe', 'Arşı taşıyanların müminler için duası', 40, 7, 9),
  q('kin', 'tovbe', 'Kalpte kin bırakmaması', 59, 10),
  q('nur', 'tovbe', 'Nurun tamamlanması', 66, 8),

  // Korunma
  q('yuk', 'korunma', 'Gücün yetmeyeceği yükten korunma', 2, 286),
  q('yaratilis', 'korunma', 'Yaratılışı düşünenlerin duası', 3, 191),
  q('zalimlerle-degil', 'korunma', 'Zalimlerle bir tutulmamak', 7, 47),
  q('fitne', 'korunma', 'Zalimlerin fitnesinden korunma', 10, 85, 86),
  q('yusuf-tuzak', 'korunma', 'Kötülüğe düşmekten korunma (Yûsuf)', 12, 33),
  q('guvenli-belde', 'korunma', 'Güvenli belde (İbrâhîm)', 14, 35),
  q('seytan', 'korunma', 'Şeytanın kışkırtmasından sığınma', 23, 97, 98),
  q('azap', 'korunma', 'Cehennem azabından korunma', 25, 65, 66),
  q('zalimlerden-kurtulus', 'korunma', 'Zalimlerden kurtuluş (Mûsâ)', 28, 21),
  q('inkarcilara-fitne', 'korunma', 'İnkârcılara imtihan kılınmamak', 60, 5),
  q('asiye', 'korunma', 'Cennette bir ev (Âsiye)', 66, 11),
  q('felak', 'korunma', 'Felak sûresi', 113, 1, 5),
  q('nas', 'korunma', 'Nâs sûresi', 114, 1, 6),

  // Sıkıntı
  q('sabir-sebat', 'sikinti', 'Sabır ve sebat', 2, 250),
  q('hasbunallah', 'sikinti', 'Allah bize yeter', 3, 173),
  q('sabir-yagdir', 'sikinti', 'Sabır yağdır', 7, 126),
  q('hasbiyallah', 'sikinti', 'Bana Allah yeter', 9, 129),
  q('magara', 'sikinti', 'Mağara gençlerinin duası', 18, 10),
  q('yunus', 'sikinti', 'Yûnus’un karanlıklar içindeki duası', 21, 87),
  q('lut', 'sikinti', 'Bozgunculara karşı yardım (Lût)', 29, 30),
  q('nuh-yardim', 'sikinti', 'Yardım dileği (Nûh)', 54, 10),

  // Hastalık
  q('eyyub', 'hastalik', 'Eyyûb’un duası', 21, 83),

  // İlim
  q('sadr', 'ilim', 'Göğsün genişlemesi, işin kolaylaşması (Mûsâ)', 20, 25, 28),
  q('ilim', 'ilim', 'İlmin artması', 20, 114),

  // Aile
  q('zekeriyya-nesil', 'aile', 'Hayırlı nesil (Zekeriyyâ)', 3, 38),
  q('namaz-nesil', 'aile', 'Namaz kılan nesil ve anne baba (İbrâhîm)', 14, 40, 41),
  q('anne-baba', 'aile', 'Anne baba için merhamet', 17, 24),
  q('yalniz-birakma', 'aile', 'Yalnız bırakılmamak (Zekeriyyâ)', 21, 89),
  q('goz-aydinligi', 'aile', 'Göz aydınlığı eşler ve çocuklar', 25, 74),
  q('salih-evlat', 'aile', 'Salih evlat (İbrâhîm)', 37, 100),

  // Şükür
  q('suleyman', 'sukur', 'Nimete şükür (Süleymân)', 27, 19),
  q('kirk-yas', 'sukur', 'Olgunluk çağının duası', 46, 15),

  // Rızık
  q('dunya-ahiret', 'rizik', 'Dünya ve ahiret iyiliği', 2, 201),
  q('mulk', 'rizik', 'Mülkün sahibi', 3, 26, 27),
  q('sofra', 'rizik', 'Gökten sofra (Îsâ)', 5, 114),
  q('muhtacim', 'rizik', 'Her hayra muhtacım (Mûsâ)', 28, 24),

  // Yolculuk
  q('giris-cikis', 'yolculuk', 'Girişin ve çıkışın hayırlı olması', 17, 80),
  q('mubarek-yer', 'yolculuk', 'Mübarek bir yere inmek (Nûh)', 23, 29),

  // Vefat
  q('yusuf-vefat', 'vefat', 'Müslüman olarak can verme (Yûsuf)', 12, 101),
  q('nuh-magfiret', 'vefat', 'Anne baba ve müminler için bağışlanma (Nûh)', 71, 28),
];
