/**
 * Hazır paylaşım kartları — şartname §62.
 *
 * İki tür içerik var ve karıştırılmaz:
 *
 * 1. **Tebrik mesajları** (cuma, bayram, kandil, Ramazan, gün selamı): bu
 *    uygulama için yazıldı; âyet ya da hadis değildir, öyle sunulmaz. Kartta
 *    künye "Tebrik mesajı" olarak yazılır. Arapça satırlar yalnız yaygın,
 *    anlamı açık kalıplardır (جمعة مباركة, عيد مبارك, رمضان كريم).
 * 2. **Âyet kartları:** metin burada **yazılmaz**, yalnız sure:âyet
 *    referansı durur. Arapça metin Tanzil paketinden, meal Elmalılı
 *    mealinden çalışma anında okunur (`features/share/templates.ts`);
 *    referansların paket içinde var olduğu sınamayla doğrulanır.
 */

export type TemplateCategory = 'friday' | 'eid' | 'kandil' | 'ramadan' | 'dua' | 'verse' | 'daily';

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = ['friday', 'eid', 'kandil', 'ramadan', 'dua', 'verse', 'daily'];

/**
 * `eyebrow` yalnız seçicide görünür, kartın üstüne yazılmaz (kullanıcı
 * isteği: "Cuma mesajı" gibi ibare kartta olmasın).
 */
export type CardTemplate =
  | { id: string; category: TemplateCategory; kind: 'greeting'; eyebrow: string; arabic?: string; body: string }
  | { id: string; category: TemplateCategory; kind: 'verse'; eyebrow: string; surah: number; ayah: number };

type G = Omit<Extract<CardTemplate, { kind: 'greeting' }>, 'kind' | 'category' | 'id'>;
const g = (category: TemplateCategory, id: string, t: G): CardTemplate => ({ id, category, kind: 'greeting', ...t });
const v = (category: TemplateCategory, id: string, eyebrow: string, surah: number, ayah: number): CardTemplate =>
  ({ id, category, kind: 'verse', eyebrow, surah, ayah });

const JUMUA = 'جُمُعَة مُبَارَكَة';
const EID = 'عِيد مُبَارَك';
const TAQABBAL = 'تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ';
const LAYLA = 'لَيْلَة مُبَارَكَة';
const RAMADAN = 'رَمَضَان كَرِيم';

export const CARD_TEMPLATES: readonly CardTemplate[] = [
  // --- Cuma
  g('friday', 'cuma-1', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Hayırlı cumalar. Dualarınız kabul, gönlünüz huzurlu olsun.' }),
  g('friday', 'cuma-2', { eyebrow: 'Cuma', body: 'Cumanız mübarek olsun. Rabbim bu mübarek günün hürmetine dualarımızı kabul eylesin.' }),
  g('friday', 'cuma-3', { eyebrow: 'Cuma', body: 'Bu mübarek cuma günü sevdiklerinle birlikte huzur ve bereket dolu olsun. Hayırlı cumalar.' }),
  g('friday', 'cuma-4', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Haftanın en güzel gününde kalbin ferah, sofran bereketli, duaların makbul olsun.' }),
  g('friday', 'cuma-5', { eyebrow: 'Cuma', body: 'Rabbim bu cumayı hayırlara vesile kılsın; hastalarımıza şifa, dertlilerimize deva versin.' }),
  g('friday', 'cuma-6', { eyebrow: 'Cuma', body: 'Cuma namazına giderken dualarında bizi de unutma. Hayırlı cumalar.' }),
  g('friday', 'cuma-7', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Rahmetin, huzurun ve bereketin günü mübarek olsun.' }),
  v('friday', 'cuma-ayet-9', 'Cuma 9', 62, 9),
  v('friday', 'cuma-ayet-10', 'Cuma 10', 62, 10),

  // --- Bayram
  g('eid', 'ramazan-bayrami-1', { eyebrow: 'Ramazan Bayramı', arabic: EID, body: 'Ramazan Bayramınız mübarek olsun. Tutulan oruçlar, edilen dualar kabul olsun.' }),
  g('eid', 'ramazan-bayrami-2', { eyebrow: 'Ramazan Bayramı', body: 'Nice huzurlu, sağlıklı ve bereketli bayramlara. İyi bayramlar.' }),
  g('eid', 'ramazan-bayrami-3', { eyebrow: 'Ramazan Bayramı', arabic: TAQABBAL, body: 'Allah bizden de sizden de kabul etsin. Bayramınız mübarek olsun.' }),
  g('eid', 'ramazan-bayrami-4', { eyebrow: 'Ramazan Bayramı', body: 'Küslüklerin bittiği, gönüllerin birleştiği bir bayram dileğiyle. Bayramınız kutlu olsun.' }),
  g('eid', 'kurban-bayrami-1', { eyebrow: 'Kurban Bayramı', arabic: EID, body: 'Kurban Bayramınız mübarek olsun. Kesilen kurbanlar, yapılan ibadetler kabul olsun.' }),
  g('eid', 'kurban-bayrami-2', { eyebrow: 'Kurban Bayramı', body: 'Paylaştıkça çoğalan bir bayram dileğiyle. İyi bayramlar.' }),
  g('eid', 'kurban-bayrami-3', { eyebrow: 'Kurban Bayramı', arabic: TAQABBAL, body: 'Kurbanlarınız ve dualarınız kabul olsun. Nice sağlıklı bayramlara.' }),
  g('eid', 'kurban-bayrami-4', { eyebrow: 'Kurban Bayramı', body: 'Sofraların bereketlendiği, kapıların açıldığı bir bayram olsun. Bayramınız mübarek olsun.' }),
  v('eid', 'kurban-ayet', 'Kevser 2', 108, 2),
  v('eid', 'kurban-ayet-hac', 'Hac 37', 22, 37),

  // --- Kandil
  g('kandil', 'kandil-1', { eyebrow: 'Kandil', arabic: LAYLA, body: 'Kandiliniz mübarek olsun. Bu gecenin hürmetine dualarınız kabul olsun.' }),
  g('kandil', 'kandil-2', { eyebrow: 'Kandil', body: 'Rahmetin, bereketin ve bağışlanmanın gecesi hayırlara vesile olsun. Hayırlı kandiller.' }),
  g('kandil', 'mevlid', { eyebrow: 'Mevlid Kandili', arabic: LAYLA, body: 'Âlemlere rahmet olarak gönderilen Peygamberimizin doğum gecesi mübarek olsun.' }),
  g('kandil', 'regaib', { eyebrow: 'Regaib Kandili', body: 'Üç ayların ilk kandili Regaib Kandiliniz mübarek olsun.' }),
  g('kandil', 'mirac', { eyebrow: 'Miraç Kandili', arabic: LAYLA, body: 'Miraç Kandiliniz mübarek olsun. Namazın hediye edildiği bu gece dualarınız kabul olsun.' }),
  g('kandil', 'berat', { eyebrow: 'Berat Kandili', body: 'Berat Kandiliniz mübarek olsun. Rabbim bu geceyi günahlarımızdan beraatimize vesile kılsın.' }),
  g('kandil', 'kadir', { eyebrow: 'Kadir Gecesi', arabic: LAYLA, body: 'Bin aydan hayırlı Kadir Gecemiz mübarek olsun. Dualarınız kabul olsun.' }),
  v('kandil', 'kadir-ayet-1', 'Kadir 1', 97, 1),
  v('kandil', 'kadir-ayet', 'Kadir 3', 97, 3),
  v('kandil', 'mevlid-ayet', 'Enbiyâ 107', 21, 107),
  v('kandil', 'salavat-ayet', 'Ahzâb 56', 33, 56),
  v('kandil', 'mirac-ayet', 'İsrâ 1', 17, 1),

  // --- Ramazan
  g('ramadan', 'ramazan-1', { eyebrow: 'Ramazan', arabic: RAMADAN, body: 'Hoş geldin on bir ayın sultanı. Hayırlı Ramazanlar.' }),
  g('ramadan', 'ramazan-2', { eyebrow: 'Ramazan', body: 'Oruçlarınız, sahurlarınız ve iftarlarınız bereketli olsun. Hayırlı Ramazanlar.' }),
  g('ramadan', 'ramazan-3', { eyebrow: 'Ramazan', arabic: RAMADAN, body: 'Rahmet, mağfiret ve bereket ayı hepimize hayırlar getirsin.' }),
  g('ramadan', 'iftar', { eyebrow: 'İftar', body: 'İftarınız bereketli, oruçlarınız kabul olsun. Hayırlı iftarlar.' }),
  g('ramadan', 'sahur', { eyebrow: 'Sahur', body: 'Sahurunuz bereketli olsun. Rabbim tutacağımız orucu kabul eylesin.' }),
  g('ramadan', 'son-on-gun', { eyebrow: 'Son on gün', body: 'Ramazan’ın son on gününe eriştik. Kadir Gecesini arayan gönüllere selam olsun.' }),
  v('ramadan', 'ramazan-ayet', 'Bakara 183', 2, 183),

  // --- Dua (Kur'an'daki dualar)
  v('dua', 'dua-dunya-ahiret', 'Bakara 201', 2, 201),
  v('dua', 'dua-kalp', 'Âl-i İmrân 8', 3, 8),
  v('dua', 'dua-adem', 'A’râf 23', 7, 23),
  v('dua', 'dua-anababa', 'İbrâhîm 41', 14, 41),
  v('dua', 'dua-merhamet', 'İsrâ 24', 17, 24),
  v('dua', 'dua-magara', 'Kehf 10', 18, 10),
  v('dua', 'dua-sadr', 'Tâhâ 25', 20, 25),
  v('dua', 'dua-ilim', 'Tâhâ 114', 20, 114),
  v('dua', 'dua-yunus', 'Enbiyâ 87', 21, 87),
  v('dua', 'dua-magfiret', 'Mü’minûn 118', 23, 118),
  v('dua', 'dua-aile', 'Furkân 74', 25, 74),
  v('dua', 'dua-musa', 'Kasas 24', 28, 24),

  // --- Âyet
  v('verse', 'ayet-inşirah', 'İnşirâh 5', 94, 5),
  v('verse', 'ayet-inşirah-6', 'İnşirâh 6', 94, 6),
  v('verse', 'ayet-rad', 'Ra’d 28', 13, 28),
  v('verse', 'ayet-bakara-152', 'Bakara 152', 2, 152),
  v('verse', 'ayet-bakara-153', 'Bakara 153', 2, 153),
  v('verse', 'ayet-bakara-186', 'Bakara 186', 2, 186),
  v('verse', 'ayet-zumer', 'Zümer 53', 39, 53),
  v('verse', 'ayet-imran-139', 'Âl-i İmrân 139', 3, 139),
  v('verse', 'ayet-talak-3', 'Talâk 3', 65, 3),
  v('verse', 'ayet-kaf-16', 'Kâf 16', 50, 16),
  v('verse', 'ayet-duha-5', 'Duhâ 5', 93, 5),
  v('verse', 'ayet-nahl-128', 'Nahl 128', 16, 128),
  v('verse', 'ayet-hucurat-10', 'Hucurât 10', 49, 10),
  v('verse', 'ayet-mumin-60', 'Mü’min 60', 40, 60),
  v('verse', 'ayet-taha-46', 'Tâhâ 46', 20, 46),
  v('verse', 'ayet-tevbe-51', 'Tevbe 51', 9, 51),

  // --- Gün
  g('daily', 'sabah-1', { eyebrow: 'Hayırlı sabahlar', arabic: 'صَبَاح الْخَيْر', body: 'Güne besmeleyle başla, şükürle bitir. Hayırlı sabahlar.' }),
  g('daily', 'sabah-2', { eyebrow: 'Hayırlı sabahlar', body: 'Yeni bir güne uyandıran Rabbimize şükürler olsun. Günün hayırlı geçsin.' }),
  g('daily', 'aksam-1', { eyebrow: 'Hayırlı akşamlar', arabic: 'مَسَاء الْخَيْر', body: 'Günün yorgunluğu duayla hafiflesin. Hayırlı akşamlar.' }),
  g('daily', 'gece-1', { eyebrow: 'Hayırlı geceler', body: 'Gecen huzurlu, uykun deliksiz, sabahın aydınlık olsun. Hayırlı geceler.' }),
  g('daily', 'dua-1', { eyebrow: 'Dua', body: 'Dualarında beni de unutma. Rabbim hepimizin dualarını kabul eylesin.' }),
  g('daily', 'sukur-1', { eyebrow: 'Şükür', body: 'Elhamdülillah. Verilen her nimet için şükür, esirgenen her şeyde hikmet vardır.' }),
  g('daily', 'sabir-1', { eyebrow: 'Sabır', body: 'Her zorluğun ardında bir kolaylık, her gecenin ardında bir sabah vardır.' }),
  g('daily', 'namaz-1', { eyebrow: 'Namaz', body: 'Namaz vakti; dünyanın telaşına kısa bir ara, Rabbine en yakın an.' }),
];
