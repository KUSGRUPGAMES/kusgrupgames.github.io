/**
 * Namaz rehberi — şartname §40.
 *
 * İçerik durumu: bu metinler **bu uygulama için yazıldı**. Anlatım genel ve
 * yaygın uygulamayı tarif eder; mezhepler arasında fark bulunan yerlerde fark
 * **belirtilir**, taraf tutulmaz ve hüküm verilmez. Okunan sûre ve duaların
 * Arapça metni burada yoktur: onlar mushaf/me'sûr metindir ve ezberden
 * dizilmez (CONTENT_SOURCES kuralı 1, ⛔B1/B3).
 */

export interface GuideStep {
  title: string;
  body: string;
}

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  steps: GuideStep[];
}

export const PRAYER_GUIDE: readonly GuideSection[] = [
  {
    id: 'abdest',
    title: 'Abdest',
    summary: 'Namazın ön şartı. Dört farzı ve yaygın uygulanan sünnetleri.',
    steps: [
      { title: 'Niyet ve besmele', body: 'Abdest almaya niyet edilir ve besmele çekilir. Niyet kalbin işidir; dille söylemek şart değildir.' },
      { title: 'Eller', body: 'Eller bileklere kadar üç kez yıkanır. Parmak araları ovulur, yüzük varsa oynatılır.' },
      { title: 'Ağız ve burun', body: 'Ağza üç kez su alınıp çalkalanır, burna üç kez su çekilip temizlenir.' },
      { title: 'Yüz (farz)', body: 'Yüz, saç bitiminden çene altına, iki kulak arasına kadar üç kez yıkanır.' },
      { title: 'Kollar (farz)', body: 'Önce sağ, sonra sol kol dirseklerle birlikte üç kez yıkanır. Dirsekler kuru kalmamalıdır.' },
      { title: 'Başı mesh (farz)', body: 'Islak elle başın bir kısmı mesh edilir. Ne kadarının farz olduğu mezheplere göre değişir; yaygın uygulama başın dörtte birini mesh etmektir.' },
      { title: 'Kulak ve boyun', body: 'Aynı ıslaklıkla kulaklar içten ve dıştan mesh edilir; boyun arkası da mesh edilir.' },
      { title: 'Ayaklar (farz)', body: 'Sağdan başlayarak ayaklar topuklarla birlikte üç kez yıkanır. Parmak araları ovulur. Mest üzerine mesh edilen durumlar ayrıdır.' },
      { title: 'Abdesti bozanlar', body: 'Tuvalete gitmek, yellenmek, uyumak, bayılmak ve kan gibi akıntılar abdesti bozar. Ayrıntıda mezhepler arasında farklar vardır.' },
    ],
  },
  {
    id: 'hazirlik',
    title: 'Namaza hazırlık',
    summary: 'Namazdan önce sağlanması gereken şartlar.',
    steps: [
      { title: 'Vaktin girmesi', body: 'Her namaz kendi vaktinde kılınır. Vakit girmeden kılınan namaz geçerli değildir; bu yüzden vakit takibi önemlidir.' },
      { title: 'Temizlik', body: 'Beden, elbise ve namaz kılınan yer temiz olmalıdır. Abdest ya da gerekiyorsa gusül alınır.' },
      { title: 'Örtünme', body: 'Örtülmesi gereken yerler kapatılır. Erkek ve kadın için sınırlar farklıdır; giysinin bedeni belli etmeyecek şekilde olması gözetilir.' },
      { title: 'Kıbleye yönelme', body: 'Kâbe yönüne dönülür. Yön bilinmiyorsa araştırılır; bu uygulamanın Kıble ekranı bunun içindir. Araştırmaya rağmen yanılmak namazı bozmaz.' },
      { title: 'Niyet', body: 'Hangi namazın kılınacağına niyet edilir. Niyet kalple olur.' },
    ],
  },
  {
    id: 'kilinis',
    title: 'Namazın kılınışı',
    summary: 'Bir rekâtın sırası ve namazın bölümleri.',
    steps: [
      { title: 'İftitah tekbiri', body: 'Eller kaldırılarak tekbir alınır ve namaza girilir. Bu tekbirden sonra namaz dışı konuşma ve hareket namazı bozar.' },
      { title: 'Kıyam', body: 'Ayakta durulur. Sübhâneke okunur, ardından Fâtiha ve ardından bir miktar Kur’an okunur. Farzların üçüncü ve dördüncü rekâtlarında yalnız Fâtiha okunur.' },
      { title: 'Rükû', body: 'Tekbirle eğilinir, sırt ve baş aynı hizaya gelir. Rükû tesbihleri okunur, sonra doğrulunur.' },
      { title: 'Secde', body: 'Tekbirle secdeye gidilir; alın, burun, eller, dizler ve ayak parmakları yere değer. Tesbih okunur, oturulur, ikinci secde yapılır.' },
      { title: 'Ka’de (oturuş)', body: 'İki rekâtta bir oturulur. Ettehiyyâtü okunur; son oturuşta salli-bârik ve dua eklenir.' },
      { title: 'Selam', body: 'Önce sağa, sonra sola selam verilerek namaz tamamlanır.' },
    ],
  },
  {
    id: 'rekatlar',
    title: 'Rekât sayıları',
    summary: 'Beş vaktin farz ve yaygın kılınan sünnet rekâtları.',
    steps: [
      { title: 'Sabah', body: 'Farz 2 rekât. Öncesinde 2 rekât sünnet kılınır; bu sünnete çok önem verilmiştir.' },
      { title: 'Öğle', body: 'Farz 4 rekât. Öncesinde 4, sonrasında 2 rekât sünnet yaygın uygulamadır.' },
      { title: 'İkindi', body: 'Farz 4 rekât. Öncesinde 4 rekât sünnet kılınabilir.' },
      { title: 'Akşam', body: 'Farz 3 rekât. Sonrasında 2 rekât sünnet kılınır.' },
      { title: 'Yatsı', body: 'Farz 4 rekât. Sonrasında 2 rekât sünnet ve ardından vitir namazı kılınır. Vitrin hükmü ve rekât sayısı mezheplere göre değişir.' },
      { title: 'Cuma', body: 'Cuma günü öğle yerine cemaatle 2 rekât farz kılınır. Öncesinde ve sonrasında sünnetler vardır.' },
    ],
  },
  {
    id: 'seferilik',
    title: 'Yolculukta namaz',
    summary: 'Seferîlik ve kısaltma.',
    steps: [
      { title: 'Seferî sayılmak', body: 'Belli bir mesafeden uzağa yolculuk eden kişi seferî sayılır. Mesafe ölçüsünde mezhepler arasında fark vardır; yaygın ölçü yaklaşık 90 kilometredir.' },
      { title: 'Kısaltma', body: 'Seferî olan kişi dört rekâtlı farzları iki rekât kılar. Sabahın iki ve akşamın üç rekâtı kısaltılmaz.' },
      { title: 'Sünnetler', body: 'Yolculukta sünnetlerin kılınıp kılınmayacağı duruma göre değerlendirilir; acele ve yorgunluk hâlinde terk edilebileceği söylenmiştir.' },
    ],
  },
  {
    id: 'ozur',
    title: 'Özür durumları',
    summary: 'Hastalık ve zorluk hâlinde namaz.',
    steps: [
      { title: 'Oturarak kılmak', body: 'Ayakta duramayan kişi oturarak kılar. Oturamayan, imkânına göre ima ile kılar. Namaz hiçbir durumda terk edilmez.' },
      { title: 'Abdest alamayınca', body: 'Su bulunmadığında ya da kullanmak sağlığa zarar verdiğinde teyemmüm yapılır.' },
      { title: 'Vakti kaçırınca', body: 'Uyuma ya da unutma sebebiyle kaçan namaz, hatırlandığında kaza edilir. Kaza takibi için bu uygulamanın Kaza Namazı bölümü kullanılabilir.' },
    ],
  },
];

export const GUIDE_NOTE =
  'Bu rehber genel ve yaygın uygulamayı anlatır; hüküm (fetva) vermez. ' +
  'Mezhepler arasında fark bulunan konularda fark belirtilmiştir. ' +
  'Kendi durumuna özel bir soru için bir din görevlisine danışman uygun olur.';
