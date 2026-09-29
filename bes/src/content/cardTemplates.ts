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

import { QURAN_DUAS } from './quranDuas';
import { getAyah, getSurah, getTranslation } from '@/features/quran/data';
import { MAX_ARABIC_CHARS, MAX_BODY_CHARS } from '@/features/share/card';

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

const TEMEL: readonly CardTemplate[] = [
  // --- Cuma
  g('friday', 'cuma-1', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Hayırlı cumalar. Dualarınız kabul, gönlünüz huzurlu olsun.' }),
  g('friday', 'cuma-2', { eyebrow: 'Cuma', body: 'Cumanız mübarek olsun. Rabbim bu mübarek günün hürmetine dualarımızı kabul eylesin.' }),
  g('friday', 'cuma-3', { eyebrow: 'Cuma', body: 'Bu mübarek cuma günü sevdiklerinle birlikte huzur ve bereket dolu olsun. Hayırlı cumalar.' }),
  g('friday', 'cuma-4', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Haftanın en güzel gününde kalbin ferah, sofran bereketli, duaların makbul olsun.' }),
  g('friday', 'cuma-5', { eyebrow: 'Cuma', body: 'Rabbim bu cumayı hayırlara vesile kılsın; hastalarımıza şifa, dertlilerimize deva versin.' }),
  g('friday', 'cuma-6', { eyebrow: 'Cuma', body: 'Cuma namazına giderken dualarında bizi de unutma. Hayırlı cumalar.' }),
  g('friday', 'cuma-7', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Rahmetin, huzurun ve bereketin günü mübarek olsun.' }),
  g('friday', 'cuma-8', { eyebrow: 'Cuma', body: 'Cuma, haftanın bayramı. Bugün bir selam, bir tebessüm, bir dua eksik olmasın. Hayırlı cumalar.' }),
  g('friday', 'cuma-9', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Bu cuma kalplerimiz birbirine, ellerimiz duaya daha yakın olsun.' }),
  g('friday', 'cuma-10', { eyebrow: 'Cuma', body: 'Hayırlı cumalar. Sevdiklerinle geçen, huzurla dolan, şükürle biten bir gün dilerim.' }),
  g('friday', 'cuma-11', { eyebrow: 'Cuma', body: 'Cumanın bereketi evine, huzuru gönlüne, rahmeti tüm ailene olsun.' }),
  g('friday', 'cuma-12', { eyebrow: 'Cuma', arabic: JUMUA, body: 'Rabbim bu cuma günü dualarımızı kabul, günahlarımızı af, gönüllerimizi ferah eylesin.' }),
  g('friday', 'cuma-13', { eyebrow: 'Cuma', body: 'Bugün cuma; kırgınlıkları bırakıp gönülleri onarmak için güzel bir gün. Hayırlı cumalar.' }),
  g('friday', 'cuma-14', { eyebrow: 'Cuma', body: 'Hastalara şifa, dertlilere derman, yolda olanlara selamet dileğiyle. Cumanız mübarek olsun.' }),
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
  g('eid', 'ramazan-bayrami-5', { eyebrow: 'Ramazan Bayramı', arabic: EID, body: 'Bir ay boyunca sabrı, paylaşmayı ve şükrü öğrettin; şimdi bayram sevinci. Bayramınız mübarek olsun.' }),
  g('eid', 'ramazan-bayrami-6', { eyebrow: 'Ramazan Bayramı', body: 'Büyüklerin elinden öpülen, küçüklerin sevindirildiği nice bayramlara. İyi bayramlar.' }),
  g('eid', 'ramazan-bayrami-7', { eyebrow: 'Ramazan Bayramı', body: 'Bayram sofralarınız kalabalık, gönülleriniz ferah, evleriniz huzurlu olsun.' }),
  g('eid', 'kurban-bayrami-5', { eyebrow: 'Kurban Bayramı', arabic: EID, body: 'Teslimiyetin ve paylaşmanın bayramı hepimize hayırlar getirsin. Bayramınız mübarek olsun.' }),
  g('eid', 'kurban-bayrami-6', { eyebrow: 'Kurban Bayramı', body: 'Kurbanın bereketi ihtiyaç sahiplerinin sofrasına, sevinci tüm gönüllere ulaşsın. İyi bayramlar.' }),
  g('eid', 'kurban-bayrami-7', { eyebrow: 'Kurban Bayramı', arabic: TAQABBAL, body: 'Hacılarımızın haccı, kurbanlarınız ve dualarınız kabul olsun. Nice bayramlara.' }),
  g('eid', 'bayram-genel-1', { eyebrow: 'Bayram', arabic: EID, body: 'Uzaktakilerin yakınlaştığı, dargınların barıştığı bir bayram olsun. Bayramınız mübarek olsun.' }),
  g('eid', 'bayram-genel-2', { eyebrow: 'Bayram', body: 'Bayramlar sevdiklerimizle güzel. Sağlıkla, huzurla nice bayramlara.' }),
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
  g('kandil', 'kandil-3', { eyebrow: 'Kandil', body: 'Bu mübarek gecede dualarında bizi de unutma. Kandilin mübarek olsun.' }),
  g('kandil', 'kandil-4', { eyebrow: 'Kandil', arabic: LAYLA, body: 'Gecenin sükûnetinde edilen dualar kabul, dökülen gözyaşları rahmete vesile olsun.' }),
  g('kandil', 'kandil-5', { eyebrow: 'Kandil', body: 'Kandil gecesi; affın, şükrün ve yeniden başlamanın gecesi. Hayırlı kandiller.' }),
  g('kandil', 'uc-aylar', { eyebrow: 'Üç Aylar', body: 'Rahmet mevsimi üç aylara eriştik. Rabbim bizi Ramazan’a sağlıkla ulaştırsın.' }),
  g('kandil', 'mevlid-2', { eyebrow: 'Mevlid Kandili', body: 'Peygamber Efendimizin dünyayı şereflendirdiği bu gece, onun güzel ahlakını yaşama gayretimizi artırsın.' }),
  g('kandil', 'mirac-2', { eyebrow: 'Miraç Kandili', body: 'Namaz müminin miracıdır. Miraç Kandiliniz mübarek, namazlarınız huzurlu olsun.' }),
  g('kandil', 'berat-2', { eyebrow: 'Berat Kandili', arabic: LAYLA, body: 'Bu gece af ve bağışlanma kapıları açık. Rabbim hepimizi affettiği kullarından eylesin.' }),
  g('kandil', 'kadir-2', { eyebrow: 'Kadir Gecesi', body: 'Kur’an’ın indirildiği bu gece, kalplerimiz Kur’an’la dirilsin. Kadir Geceniz mübarek olsun.' }),
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
  g('ramadan', 'ramazan-4', { eyebrow: 'Ramazan', body: 'Sofraların paylaşıldığı, kalplerin yumuşadığı Ramazan hepimize bereket getirsin.' }),
  g('ramadan', 'ramazan-5', { eyebrow: 'Ramazan', arabic: RAMADAN, body: 'Rabbim bu Ramazan’da oruçlarımızı, teravihlerimizi ve dualarımızı kabul eylesin.' }),
  g('ramadan', 'ramazan-6', { eyebrow: 'Ramazan', body: 'Oruç sabrı, iftar şükrü, sahur bereketi öğretir. Hayırlı Ramazanlar.' }),
  g('ramadan', 'iftar-2', { eyebrow: 'İftar', body: 'Ezan okundu, sofralar kuruldu. Bu iftar gününüzün yorgunluğunu alsın. Hayırlı iftarlar.' }),
  g('ramadan', 'iftar-3', { eyebrow: 'İftar', body: 'İftar sofranızda bir kişilik yer daha olsun; paylaştıkça bereketlenir. Hayırlı iftarlar.' }),
  g('ramadan', 'sahur-2', { eyebrow: 'Sahur', body: 'Sahur vakti; hem bedene hem ruha azık. Oruçlarınız kolay gelsin.' }),
  g('ramadan', 'teravih', { eyebrow: 'Teravih', body: 'Teravihleriniz kabul, secdeleriniz huzurlu olsun. Hayırlı Ramazan geceleri.' }),
  g('ramadan', 'ramazan-veda', { eyebrow: 'Ramazan’a veda', body: 'Elveda ya şehr-i Ramazan. Rabbim bizi nice Ramazanlara sağlıkla eriştirsin.' }),
  v('ramadan', 'ramazan-ayet', 'Bakara 183', 2, 183),
  v('ramadan', 'ramazan-ayet-186', 'Bakara 186', 2, 186),

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
  v('verse', 'ayet-bakara-45', 'Bakara 45', 2, 45),
  v('verse', 'ayet-bakara-156', 'Bakara 156', 2, 156),
  v('verse', 'ayet-imran-185', 'Âl-i İmrân 185', 3, 185),
  v('verse', 'ayet-imran-200', 'Âl-i İmrân 200', 3, 200),
  v('verse', 'ayet-enam-162', 'En’âm 162', 6, 162),
  v('verse', 'ayet-araf-199', 'A’râf 199', 7, 199),
  v('verse', 'ayet-ibrahim-7', 'İbrâhîm 7', 14, 7),
  v('verse', 'ayet-nahl-90', 'Nahl 90', 16, 90),
  v('verse', 'ayet-nahl-97', 'Nahl 97', 16, 97),
  v('verse', 'ayet-isra-23', 'İsrâ 23', 17, 23),
  v('verse', 'ayet-isra-82', 'İsrâ 82', 17, 82),
  v('verse', 'ayet-kehf-46', 'Kehf 46', 18, 46),
  v('verse', 'ayet-enbiya-35', 'Enbiyâ 35', 21, 35),
  v('verse', 'ayet-ankebut-45', 'Ankebût 45', 29, 45),
  v('verse', 'ayet-ahzab-41', 'Ahzâb 41', 33, 41),
  v('verse', 'ayet-zumer-10', 'Zümer 10', 39, 10),
  v('verse', 'ayet-fussilet-34', 'Fussilet 34', 41, 34),
  v('verse', 'ayet-hucurat-13', 'Hucurât 13', 49, 13),
  v('verse', 'ayet-zariyat-56', 'Zâriyât 56', 51, 56),
  v('verse', 'ayet-rahman-13', 'Rahmân 13', 55, 13),
  v('verse', 'ayet-tegabun-11', 'Tegâbün 11', 64, 11),
  v('verse', 'ayet-mulk-2', 'Mülk 2', 67, 2),
  v('verse', 'ayet-insirah-7', 'İnşirâh 7', 94, 7),
  v('verse', 'ayet-insirah-8', 'İnşirâh 8', 94, 8),
  v('verse', 'ayet-imran-159', 'Âl-i İmrân 159', 3, 159),

  // --- Gün
  g('daily', 'sabah-1', { eyebrow: 'Hayırlı sabahlar', arabic: 'صَبَاح الْخَيْر', body: 'Güne besmeleyle başla, şükürle bitir. Hayırlı sabahlar.' }),
  g('daily', 'sabah-2', { eyebrow: 'Hayırlı sabahlar', body: 'Yeni bir güne uyandıran Rabbimize şükürler olsun. Günün hayırlı geçsin.' }),
  g('daily', 'aksam-1', { eyebrow: 'Hayırlı akşamlar', arabic: 'مَسَاء الْخَيْر', body: 'Günün yorgunluğu duayla hafiflesin. Hayırlı akşamlar.' }),
  g('daily', 'gece-1', { eyebrow: 'Hayırlı geceler', body: 'Gecen huzurlu, uykun deliksiz, sabahın aydınlık olsun. Hayırlı geceler.' }),
  g('daily', 'dua-1', { eyebrow: 'Dua', body: 'Dualarında beni de unutma. Rabbim hepimizin dualarını kabul eylesin.' }),
  g('daily', 'sukur-1', { eyebrow: 'Şükür', body: 'Elhamdülillah. Verilen her nimet için şükür, esirgenen her şeyde hikmet vardır.' }),
  g('daily', 'sabir-1', { eyebrow: 'Sabır', body: 'Her zorluğun ardında bir kolaylık, her gecenin ardında bir sabah vardır.' }),
  g('daily', 'namaz-1', { eyebrow: 'Namaz', body: 'Namaz vakti; dünyanın telaşına kısa bir ara, Rabbine en yakın an.' }),
  g('daily', 'sabah-3', { eyebrow: 'Hayırlı sabahlar', body: 'Bugün bir iyilik yap, bir gönül al, bir dua et. Günün bereketli olsun.' }),
  g('daily', 'sabah-4', { eyebrow: 'Hayırlı sabahlar', arabic: 'صَبَاح الْخَيْر', body: 'Sabah namazıyla aydınlanan bir güne uyanmak ne güzel. Hayırlı sabahlar.' }),
  g('daily', 'sabah-5', { eyebrow: 'Hayırlı sabahlar', body: 'Rızkın bol, yolun açık, kalbin huzurlu olsun. Günaydın.' }),
  g('daily', 'aksam-2', { eyebrow: 'Hayırlı akşamlar', body: 'Günün telaşı bitti, şükür vakti geldi. Akşamın huzurlu olsun.' }),
  g('daily', 'aksam-3', { eyebrow: 'Hayırlı akşamlar', arabic: 'مَسَاء الْخَيْر', body: 'Sofran bereketli, evin huzurlu, sevdiklerin yanında olsun. Hayırlı akşamlar.' }),
  g('daily', 'gece-2', { eyebrow: 'Hayırlı geceler', body: 'Günü affederek kapat, yarına umutla uyan. Hayırlı geceler.' }),
  g('daily', 'gece-3', { eyebrow: 'Hayırlı geceler', body: 'Uyumadan önce kalbinden bir dua geçir; gece de sana emanet olsun. Hayırlı geceler.' }),
  g('daily', 'dua-2', { eyebrow: 'Dua', body: 'Rabbim gönlünden geçen hayırlı dilekleri nasip etsin. Dualarım seninle.' }),
  g('daily', 'dua-3', { eyebrow: 'Dua', body: 'Hasta olanlara şifa, yalnız olanlara dost, darda olanlara ferahlık dileğiyle.' }),
  g('daily', 'sukur-2', { eyebrow: 'Şükür', body: 'Nefes aldığımız her an bir nimet. Elhamdülillah.' }),
  g('daily', 'sukur-3', { eyebrow: 'Şükür', body: 'Az ile yetinmeyi, çok ile şımarmamayı bilene ne mutlu. Şükür dolu bir gün dilerim.' }),
  g('daily', 'sabir-2', { eyebrow: 'Sabır', body: 'Sabır, beklemek değil; beklerken güzel kalabilmektir.' }),
  g('daily', 'sabir-3', { eyebrow: 'Sabır', body: 'Darlık geçer, sabreden kazanır. Kalbini ferah tut.' }),
  g('daily', 'namaz-2', { eyebrow: 'Namaz', body: 'Ne kadar yorgun olursan ol, secde yükünü hafifletir. Namazını ihmal etme.' }),
  g('daily', 'namaz-3', { eyebrow: 'Namaz', body: 'Vakit geldi; beş dakikalık bir mola, bütün günün huzuru.' }),
  g('daily', 'anne-baba', { eyebrow: 'Anne baba', body: 'Anne babanın duası gibi değerli bir hazine yok. Bugün onları ara, gönüllerini al.' }),
  g('daily', 'kardeslik', { eyebrow: 'Kardeşlik', body: 'Bir selam bir gönlü ısıtır. Bugün kimseye selamını esirgeme.' }),
];

/**
 * Dualar ekranındaki tek âyetlik Kur'an duaları da "Dua" kartı olarak
 * sunulur (`content/quranDuas.ts`). Yukarıda elle eklenmiş bir âyet ikinci
 * kez eklenmez. Çok âyetli dualar kart olmaz: kartta tek âyet gösterilir.
 */
const eklenmis = new Set(TEMEL.filter((t) => t.kind === 'verse').map((t) => `${t.surah}:${t.ayah}`));
const KURAN_DUA_KARTLARI: readonly CardTemplate[] = QURAN_DUAS
  .filter((d) => !d.to && !eklenmis.has(`${d.surah}:${d.ayah}`))
  // Kartta kırpılacak uzunluktaki âyet kart olmaz; dualar ekranında tam hâli durur.
  .filter((d) => (getTranslation(d.surah, d.ayah) ?? '').length <= MAX_BODY_CHARS
    && (getAyah(d.surah, d.ayah)?.text ?? '').length <= MAX_ARABIC_CHARS)
  // Seçicideki etiket sure adını paketten alır; elle yazılmaz.
  .map((d) => v('dua', `kart-${d.id}`, `${getSurah(d.surah)?.nameTr ?? ''} ${d.ayah}`, d.surah, d.ayah));

export const CARD_TEMPLATES: readonly CardTemplate[] = [...TEMEL, ...KURAN_DUA_KARTLARI];
