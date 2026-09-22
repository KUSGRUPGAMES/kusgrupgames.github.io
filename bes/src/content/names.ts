/**
 * Esmâü'l-Hüsnâ — şartname §26.
 *
 * İçerik durumu: okunuş ve Türkçe anlam bu ürün için yazıldı (`seher/`
 * içinde yazılmış, doğrulanmış ve buraya taşındı). **Arapça yazım bilerek
 * boş bırakıldı**: tek bir harekenin yanlış olması kabul edilemez bir hatadır
 * ve bu satırlar ezberden dizilmez (CONTENT_SOURCES kuralı 1). Doğrulanmış
 * bir kaynaktan içe aktarılınca `nameAr` alanı doldurulacak (KNOWN_ISSUES T4).
 *
 * Kanonik sayı 99'dur; lafza-i celâl bu listeye dahil değildir. Bu, bir kez
 * yapılmış bir hataydı: liste 100 satırla yazılmış, sonra düzeltilmişti.
 */

export interface DivineName {
  ordinal: number;
  transliteration: string;
  meaning: string;
  /** Arapça yazım — doğrulanmış kaynaktan gelene kadar tanımsız. */
  nameAr?: string;
}

export const DIVINE_NAMES: readonly DivineName[] = [
  { ordinal: 1, transliteration: 'Er-Rahmân', meaning: 'Dünyada bütün yarattıklarına merhamet eden' },
  { ordinal: 2, transliteration: 'Er-Rahîm', meaning: 'Âhirette yalnız mü’minlere merhamet eden' },
  { ordinal: 3, transliteration: 'El-Melik', meaning: 'Mülkün gerçek sahibi' },
  { ordinal: 4, transliteration: 'El-Kuddûs', meaning: 'Her türlü eksiklikten uzak' },
  { ordinal: 5, transliteration: 'Es-Selâm', meaning: 'Esenlik veren' },
  { ordinal: 6, transliteration: 'El-Mü’min', meaning: 'Güven veren, koruyan' },
  { ordinal: 7, transliteration: 'El-Müheymin', meaning: 'Gözetip koruyan' },
  { ordinal: 8, transliteration: 'El-Azîz', meaning: 'Mutlak üstün olan' },
  { ordinal: 9, transliteration: 'El-Cebbâr', meaning: 'İradesini her durumda yürüten' },
  { ordinal: 10, transliteration: 'El-Mütekebbir', meaning: 'Büyüklükte eşi olmayan' },
  { ordinal: 11, transliteration: 'El-Hâlik', meaning: 'Her şeyi yoktan yaratan' },
  { ordinal: 12, transliteration: 'El-Bâri’', meaning: 'Örneksiz var eden' },
  { ordinal: 13, transliteration: 'El-Musavvir', meaning: 'Yarattığına biçim ve görünüm veren' },
  { ordinal: 14, transliteration: 'El-Gaffâr', meaning: 'Çokça bağışlayan' },
  { ordinal: 15, transliteration: 'El-Kahhâr', meaning: 'Her şeye gücü yeten' },
  { ordinal: 16, transliteration: 'El-Vehhâb', meaning: 'Karşılıksız veren' },
  { ordinal: 17, transliteration: 'Er-Rezzâk', meaning: 'Bütün canlıların rızkını veren' },
  { ordinal: 18, transliteration: 'El-Fettâh', meaning: 'Kapıları açan' },
  { ordinal: 19, transliteration: 'El-Alîm', meaning: 'Her şeyi bilen' },
  { ordinal: 20, transliteration: 'El-Kâbıd', meaning: 'Dilediğine darlık veren, tutan' },
  { ordinal: 21, transliteration: 'El-Bâsıt', meaning: 'Dilediğine bolluk veren, açan' },
  { ordinal: 22, transliteration: 'El-Hâfıd', meaning: 'Dilediğini alçaltan' },
  { ordinal: 23, transliteration: 'Er-Râfi’', meaning: 'Dilediğini yücelten' },
  { ordinal: 24, transliteration: 'El-Muiz', meaning: 'Dilediğine değer ve şeref veren' },
  { ordinal: 25, transliteration: 'El-Müzil', meaning: 'Zillete düşüren' },
  { ordinal: 26, transliteration: 'Es-Semî’', meaning: 'Her şeyi işiten' },
  { ordinal: 27, transliteration: 'El-Basîr', meaning: 'Her şeyi gören' },
  { ordinal: 28, transliteration: 'El-Hakem', meaning: 'Hükmü mutlak olan, son sözü söyleyen' },
  { ordinal: 29, transliteration: 'El-Adl', meaning: 'Mutlak adaletli' },
  { ordinal: 30, transliteration: 'El-Latîf', meaning: 'En ince işleri bilen, lütfeden' },
  { ordinal: 31, transliteration: 'El-Habîr', meaning: 'Her şeyden haberdar' },
  { ordinal: 32, transliteration: 'El-Halîm', meaning: 'Acele etmeyen, yumuşak davranan' },
  { ordinal: 33, transliteration: 'El-Azîm', meaning: 'Büyüklüğü sınırsız olan' },
  { ordinal: 34, transliteration: 'El-Gafûr', meaning: 'Bağışlaması bol' },
  { ordinal: 35, transliteration: 'Eş-Şekûr', meaning: 'Az iyiliğe çok karşılık veren' },
  { ordinal: 36, transliteration: 'El-Aliyy', meaning: 'Her şeyin üstünde, pek yüce' },
  { ordinal: 37, transliteration: 'El-Kebîr', meaning: 'Büyüklüğüne sınır konulamayan' },
  { ordinal: 38, transliteration: 'El-Hafîz', meaning: 'Koruyup gözeten' },
  { ordinal: 39, transliteration: 'El-Mukît', meaning: 'Rızık ve güç veren' },
  { ordinal: 40, transliteration: 'El-Hasîb', meaning: 'Hesaba çeken, yeten' },
  { ordinal: 41, transliteration: 'El-Celîl', meaning: 'Ululuk sahibi' },
  { ordinal: 42, transliteration: 'El-Kerîm', meaning: 'Cömertliği sınırsız' },
  { ordinal: 43, transliteration: 'Er-Rakîb', meaning: 'Her şeyi gözeten, hiçbir şeyi kaçırmayan' },
  { ordinal: 44, transliteration: 'El-Mucîb', meaning: 'Duaya karşılık veren' },
  { ordinal: 45, transliteration: 'El-Vâsi’', meaning: 'İlmi ve rahmeti geniş' },
  { ordinal: 46, transliteration: 'El-Hakîm', meaning: 'Hikmet sahibi' },
  { ordinal: 47, transliteration: 'El-Vedûd', meaning: 'Çok seven, sevilen' },
  { ordinal: 48, transliteration: 'El-Mecîd', meaning: 'Şanı yüce ve ihsanı bol' },
  { ordinal: 49, transliteration: 'El-Bâis', meaning: 'Ölümden sonra dirilten' },
  { ordinal: 50, transliteration: 'Eş-Şehîd', meaning: 'Her şeye şahit' },
  { ordinal: 51, transliteration: 'El-Hak', meaning: 'Varlığı gerçek olan' },
  { ordinal: 52, transliteration: 'El-Vekîl', meaning: 'Güvenilip dayanılan' },
  { ordinal: 53, transliteration: 'El-Kaviyy', meaning: 'Kudreti sonsuz' },
  { ordinal: 54, transliteration: 'El-Metîn', meaning: 'Kuvveti hiç eksilmeyen' },
  { ordinal: 55, transliteration: 'El-Veliyy', meaning: 'Dost ve yardımcı' },
  { ordinal: 56, transliteration: 'El-Hamîd', meaning: 'Her türlü övgüye lâyık olan' },
  { ordinal: 57, transliteration: 'El-Muhsî', meaning: 'Tek tek sayan, bilen' },
  { ordinal: 58, transliteration: 'El-Mübdi’', meaning: 'İlk kez yaratan' },
  { ordinal: 59, transliteration: 'El-Muîd', meaning: 'Tekrar yaratan' },
  { ordinal: 60, transliteration: 'El-Muhyî', meaning: 'Can veren, hayat bağışlayan' },
  { ordinal: 61, transliteration: 'El-Mümît', meaning: 'Ölümü yaratan' },
  { ordinal: 62, transliteration: 'El-Hayy', meaning: 'Ezelî ve ebedî diri olan' },
  { ordinal: 63, transliteration: 'El-Kayyûm', meaning: 'Her şeyi ayakta tutan' },
  { ordinal: 64, transliteration: 'El-Vâcid', meaning: 'Dilediğini bulan, hiçbir şeye muhtaç olmayan' },
  { ordinal: 65, transliteration: 'El-Mâcid', meaning: 'Şanı büyük ve cömert' },
  { ordinal: 66, transliteration: 'El-Vâhid', meaning: 'Eşi ve benzeri olmayan tek' },
  { ordinal: 67, transliteration: 'El-Ehad', meaning: 'Bölünmeyen, parçalanmayan bir' },
  { ordinal: 68, transliteration: 'Es-Samed', meaning: 'Her şeyin kendisine muhtaç olduğu' },
  { ordinal: 69, transliteration: 'El-Kâdir', meaning: 'Gücü her şeye yeten' },
  { ordinal: 70, transliteration: 'El-Muktedir', meaning: 'Dilediğini yapan kudret' },
  { ordinal: 71, transliteration: 'El-Mukaddim', meaning: 'Dilediğini öne alan' },
  { ordinal: 72, transliteration: 'El-Muahhir', meaning: 'Geriye bırakan' },
  { ordinal: 73, transliteration: 'El-Evvel', meaning: 'Başlangıcı olmayan' },
  { ordinal: 74, transliteration: 'El-Âhir', meaning: 'Varlığının sonu olmayan' },
  { ordinal: 75, transliteration: 'Ez-Zâhir', meaning: 'Varlığı apaçık' },
  { ordinal: 76, transliteration: 'El-Bâtın', meaning: 'Gizliliklerin bilicisi' },
  { ordinal: 77, transliteration: 'El-Vâlî', meaning: 'Kâinatı yöneten' },
  { ordinal: 78, transliteration: 'El-Müteâlî', meaning: 'Her şeyden yüce' },
  { ordinal: 79, transliteration: 'El-Berr', meaning: 'İyiliği ve lütfu bol olan' },
  { ordinal: 80, transliteration: 'Et-Tevvâb', meaning: 'Tövbeleri kabul eden' },
  { ordinal: 81, transliteration: 'El-Müntekim', meaning: 'Kötülüğü cezasız bırakmayan' },
  { ordinal: 82, transliteration: 'El-Afüvv', meaning: 'Çokça affeden' },
  { ordinal: 83, transliteration: 'Er-Raûf', meaning: 'Kullarına çok şefkat gösteren' },
  { ordinal: 84, transliteration: 'Mâlikü’l-Mülk', meaning: 'Mülkün gerçek sahibi' },
  { ordinal: 85, transliteration: 'Zü’l-Celâli ve’l-İkrâm', meaning: 'Ululuk ve ikram sahibi' },
  { ordinal: 86, transliteration: 'El-Muksit', meaning: 'Adaletle hükmeden' },
  { ordinal: 87, transliteration: 'El-Câmi’', meaning: 'Dağınık olanı bir araya getiren' },
  { ordinal: 88, transliteration: 'El-Ganiyy', meaning: 'Hiçbir şeye muhtaç olmayan' },
  { ordinal: 89, transliteration: 'El-Mugnî', meaning: 'Dilediğini zenginleştiren' },
  { ordinal: 90, transliteration: 'El-Mâni’', meaning: 'Dilemediğine engel olan' },
  { ordinal: 91, transliteration: 'Ed-Dârr', meaning: 'Zarar veren şeyleri yaratan' },
  { ordinal: 92, transliteration: 'En-Nâfi’', meaning: 'Fayda veren şeyleri yaratan' },
  { ordinal: 93, transliteration: 'En-Nûr', meaning: 'Nur veren, aydınlatan' },
  { ordinal: 94, transliteration: 'El-Hâdî', meaning: 'Doğru yola ileten' },
  { ordinal: 95, transliteration: 'El-Bedî’', meaning: 'Eşsiz yaratan' },
  { ordinal: 96, transliteration: 'El-Bâkî', meaning: 'Varlığı sürekli' },
  { ordinal: 97, transliteration: 'El-Vâris', meaning: 'Her şeyin gerçek sahibi' },
  { ordinal: 98, transliteration: 'Er-Reşîd', meaning: 'Doğruya ulaştıran' },
  { ordinal: 99, transliteration: 'Es-Sabûr', meaning: 'Cezada acele etmeyen, çok sabırlı' },
];

export const DIVINE_NAME_COUNT = 99;
