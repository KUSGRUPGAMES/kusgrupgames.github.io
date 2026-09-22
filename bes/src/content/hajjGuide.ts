/**
 * Hac ve Umre rehberi — şartname §54.
 *
 * İçerik durumu: bu metinler **bu uygulama için yazıldı**; genel ve yaygın
 * uygulamayı anlatır, hüküm vermez. Okunacak dua ve telbiyenin Arapça metni
 * burada yoktur (me'sûr metin, ⛔B3). Rehber **çevrimdışı** çalışır: hac
 * sırasında şebeke çoğu zaman tıkalıdır, bu yüzden hiçbir bölüm ağ istemez.
 */

export interface RitualStep {
  title: string;
  body: string;
}

export interface RitualSection {
  id: string;
  title: string;
  summary: string;
  steps: RitualStep[];
}

export const HAJJ_GUIDE: readonly RitualSection[] = [
  {
    id: 'hazirlik',
    title: 'Yola çıkmadan',
    summary: 'Gitmeden önce tamamlanması gerekenler.',
    steps: [
      { title: 'Helalleşme', body: 'Yola çıkmadan önce hak sahipleriyle helalleşmek, borçları ödemek ya da ödeme planına bağlamak yaygın bir uygulamadır.' },
      { title: 'Sağlık', body: 'Gerekli aşılar yaptırılır, sürekli kullanılan ilaçlar yeterli miktarda ve reçeteli olarak yanına alınır. Kalabalık ve sıcak için hazırlık yapılır.' },
      { title: 'Belgeler', body: 'Pasaport, vize, kafile bilgileri ve sağlık belgeleri hem basılı hem dijital olarak bulundurulur.' },
      { title: 'İbadet bilgisi', body: 'Menasik (hac ve umre işlemleri) önceden okunur. Yerinde öğrenmeye çalışmak, kalabalıkta zorlaşır.' },
    ],
  },
  {
    id: 'umre',
    title: 'Umre',
    summary: 'Umrenin dört ana adımı.',
    steps: [
      { title: 'İhram', body: 'Mikat sınırına varmadan ihrama girilir. Gusül ya da abdest alınır, ihram kıyafeti giyilir, umreye niyet edilir ve telbiye getirilir.' },
      { title: 'Tavaf', body: 'Kâbe’nin çevresinde Hacerülesved hizasından başlayarak yedi şavt yapılır. Tavaf sonrası iki rekât tavaf namazı kılınır.' },
      { title: 'Sa’y', body: 'Safâ ile Merve arasında yedi gidiş geliş yapılır. Safâ’dan başlanır, Merve’de bitirilir.' },
      { title: 'Tıraş', body: 'Saç kısaltılır ya da tıraş edilir; böylece ihramdan çıkılır ve umre tamamlanır.' },
    ],
  },
  {
    id: 'hac',
    title: 'Hac günleri',
    summary: 'Zilhicce’nin 8. gününden 13. gününe kadar.',
    steps: [
      { title: '8. gün — Mina', body: 'İhrama girilir ve Mina’ya gidilir. Gün burada geçirilir, namazlar vaktinde kılınır.' },
      { title: '9. gün — Arafat', body: 'Haccın temel şartı olan Arafat vakfesi yapılır. Öğleden güneşin batışına kadar Arafat’ta bulunulur; dua ve zikirle geçirilir.' },
      { title: '9. gece — Müzdelife', body: 'Akşam Müzdelife’ye geçilir, akşam ve yatsı burada kılınır. Müzdelife vakfesi yapılır, şeytan taşlamak için taş toplanır.' },
      { title: '10. gün — Bayram', body: 'Büyük şeytan taşlanır, kurban kesilir, tıraş olunur. Ardından ziyaret tavafı yapılır.' },
      { title: '11-13. gün — Teşrik', body: 'Mina’da kalınır ve her gün üç şeytan taşlanır. Ayrılmadan önce veda tavafı yapılır.' },
    ],
  },
  {
    id: 'uyari',
    title: 'Dikkat edilecekler',
    summary: 'İhramlıyken yasaklar ve pratik uyarılar.',
    steps: [
      { title: 'İhram yasakları', body: 'Saç ve tırnak kesmek, koku sürünmek, dikişli elbise giymek (erkekler için), avlanmak ve eşlerle yakınlaşmak ihramlıyken yasaktır.' },
      { title: 'Kalabalık', body: 'Tavaf ve şeytan taşlamada yoğun saatlerden kaçınmak hem güvenli hem rahattır. Grubundan ayrılma, buluşma noktası belirle.' },
      { title: 'Sıcak ve su', body: 'Sürekli su iç, şapka ve şemsiye kullan. Güneş çarpması hac sırasında en sık görülen sağlık sorunudur.' },
      { title: 'Ayakkabı', body: 'Ayakkabılar kaybolur; ucuz ve tanınır bir çift kullan, torbayla yanında taşı.' },
    ],
  },
];

/** Hazırlık kontrol listesi (§54). */
export const HAJJ_CHECKLIST: readonly { id: string; label: string; group: string }[] = [
  { id: 'pasaport', label: 'Pasaport ve vize', group: 'Belgeler' },
  { id: 'kafile', label: 'Kafile ve otel bilgileri', group: 'Belgeler' },
  { id: 'saglik-belge', label: 'Aşı kartı ve sağlık raporu', group: 'Belgeler' },
  { id: 'kopya', label: 'Belgelerin dijital kopyası', group: 'Belgeler' },
  { id: 'ihram', label: 'İhram takımı (iki yedek)', group: 'Giyim' },
  { id: 'terlik', label: 'Rahat terlik ve ayakkabı', group: 'Giyim' },
  { id: 'kemer', label: 'İhram kemeri ve çanta', group: 'Giyim' },
  { id: 'semsiye', label: 'Şemsiye veya şapka', group: 'Giyim' },
  { id: 'ilac', label: 'Sürekli kullanılan ilaçlar', group: 'Sağlık' },
  { id: 'agri', label: 'Ağrı kesici ve mide ilacı', group: 'Sağlık' },
  { id: 'yara', label: 'Yara bandı ve antiseptik', group: 'Sağlık' },
  { id: 'kokusuz', label: 'Kokusuz sabun ve krem', group: 'Sağlık' },
  { id: 'sise', label: 'Su şişesi', group: 'Eşya' },
  { id: 'powerbank', label: 'Powerbank ve kablo', group: 'Eşya' },
  { id: 'adaptor', label: 'Priz adaptörü', group: 'Eşya' },
  { id: 'kucukcanta', label: 'Boyundan çanta (belge ve para)', group: 'Eşya' },
  { id: 'tesbih', label: 'Tesbih ve dua kitabı', group: 'İbadet' },
  { id: 'seccade', label: 'Küçük seccade', group: 'İbadet' },
];

export const HAJJ_NOTE =
  'Bu rehber genel uygulamayı anlatır ve hüküm vermez. Kafile görevlisinin ' +
  'yönlendirmesi esastır. Bölüm tamamen çevrimdışı çalışır.';
