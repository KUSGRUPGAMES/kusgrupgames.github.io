/**
 * Günün Bilgisi — şartname §25, §53.
 *
 * İçerik durumu: bu maddeler **bu uygulama için yazıldı**. Hepsi genel,
 * tartışmasız ve doğrulanabilir bilgidir; hüküm (fetva) içermez, mezhep
 * tartışmasına girmez. İhtilaflı konularda "görüşler farklıdır" denir ve
 * kullanıcı bir din görevlisine yönlendirilir (§56 ile aynı çizgi).
 */

export type KnowledgeTopic = 'takvim' | 'ibadet' | 'kavram' | 'tarih' | 'kuran' | 'ahlak';

export interface KnowledgeItem {
  id: string;
  topic: KnowledgeTopic;
  title: string;
  body: string;
}

export const KNOWLEDGE_TOPICS: readonly { id: KnowledgeTopic; label: string }[] = [
  { id: 'takvim', label: 'Takvim ve zaman' },
  { id: 'ibadet', label: 'İbadet' },
  { id: 'kavram', label: 'Kavramlar' },
  { id: 'tarih', label: 'Tarih' },
  { id: 'kuran', label: 'Kur’an bilgisi' },
  { id: 'ahlak', label: 'Ahlak' },
];

export const KNOWLEDGE: readonly KnowledgeItem[] = [
  { id: 'k-hicri', topic: 'takvim', title: 'Hicrî takvim neden kayar', body: 'Hicrî takvim ay yılına dayanır ve bir yılı yaklaşık 354 gündür. Güneş yılından her yıl 10-11 gün kısa olduğu için Ramazan ve bayramlar miladi takvimde her yıl biraz daha geriye kayar. Otuz üç yılda bir tam tur atar; yani bir insan ömründe Ramazan yılın her mevsimine denk gelir.' },
  { id: 'k-hicret', topic: 'takvim', title: 'Takvimin başlangıcı', body: 'Hicrî takvimin başlangıcı, Hz. Muhammed’in Mekke’den Medine’ye hicretidir. Takvim olarak düzenlenmesi ise hicretten yıllar sonra, Hz. Ömer döneminde olmuştur.' },
  { id: 'k-aylar', topic: 'takvim', title: 'Hicrî ayların adları', body: 'Muharrem, Safer, Rebiülevvel, Rebiülahir, Cemaziyelevvel, Cemaziyelahir, Recep, Şaban, Ramazan, Şevval, Zilkade, Zilhicce. Recep, Zilkade, Zilhicce ve Muharrem "haram aylar" diye anılır.' },
  { id: 'k-ucaylar', topic: 'takvim', title: 'Üç aylar', body: 'Recep, Şaban ve Ramazan birlikte "üç aylar" diye anılır. Bu aylarda nafile ibadete ve hayra ağırlık vermek yaygın bir gelenektir.' },
  { id: 'k-gun', topic: 'takvim', title: 'Gün ne zaman başlar', body: 'Hicrî takvimde gün, güneşin batışıyla başlar. Bu yüzden bir kandil gecesi, miladi takvimdeki günün akşamına denk gelir: örneğin "pazartesiyi salıya bağlayan gece" denmesinin sebebi budur.' },
  { id: 'k-rüyet', topic: 'takvim', title: 'Hilal ve hesap', body: 'Ay başlarının belirlenmesinde iki yaklaşım vardır: hilali gözle görmek (rüyet) ve astronomik hesap. Ülkeler farklı yöntem kullandığı için bayram tarihleri bazen bir gün kayabilir. Bu uygulamadaki hicrî tarih aritmetik hesaba dayanır ve bir gün sapabilir; ayar ekranından düzeltilebilir.' },

  { id: 'k-vakit', topic: 'ibadet', title: 'Namaz vakitleri nasıl hesaplanır', body: 'Vakitler güneşin ufka göre konumundan çıkar. Öğle, güneşin gökyüzündeki en yüksek noktadan batıya kaymasıyla; ikindi, cismin gölgesinin belli bir orana ulaşmasıyla; akşam güneşin batışıyla başlar. İmsak ve yatsı ise güneşin ufkun altında belli bir açıya inmesiyle belirlenir. Kullanılan açı, hesaplama yöntemine göre değişir.' },
  { id: 'k-ikindi', topic: 'ibadet', title: 'İkindide iki hesap', body: 'İkindi vakti için iki ölçü kullanılır: cismin gölgesi kendi boyunun bir katına ulaştığında (Şâfiî, Mâlikî, Hanbelî ve Diyanet uygulaması) ya da iki katına ulaştığında (Hanefî). Aradaki fark mevsime ve enleme göre yarım saati bulabilir.' },
  { id: 'k-temkin', topic: 'ibadet', title: 'Temkin nedir', body: 'Temkin, hesapla bulunan vakte ihtiyaten eklenen birkaç dakikalık paydır. Rakım, ufkun kapalılığı ve hesap hassasiyeti gibi etkenleri karşılamak için kullanılır. Bu uygulamada her vakit için ayrı dakika düzeltmesi yapılabilir.' },
  { id: 'k-kutup', topic: 'ibadet', title: 'Kutuplarda vakit sorunu', body: 'Yüksek enlemlerde yılın bir bölümünde güneş yeterince batmaz; imsak ve yatsı astronomik olarak oluşmaz. Böyle yerlerde en yakın normal enlemin vakitlerine ya da gecenin bölünmesine dayanan çözümler kullanılır. Bu uygulama oluşmayan vakti uydurmaz, açıkça belirtir.' },
  { id: 'k-abdest', topic: 'ibadet', title: 'Abdestin farzları', body: 'Abdestin farzları dört tanedir: yüzü yıkamak, kolları dirseklerle birlikte yıkamak, başın bir kısmını mesh etmek, ayakları topuklarla birlikte yıkamak. Sıraya ve aralıksızlığa riayet mezheplere göre farz veya sünnet sayılır.' },
  { id: 'k-namazsayi', topic: 'ibadet', title: 'Beş vakit, kaç rekât', body: 'Farz rekât sayıları: sabah 2, öğle 4, ikindi 4, akşam 3, yatsı 4. Sünnetlerle birlikte günlük toplam değişir. Yolculukta dört rekâtlı farzlar ikiye indirilebilir.' },
  { id: 'k-kaza', topic: 'ibadet', title: 'Kaza namazı', body: 'Vaktinde kılınamayan farz namaz, sonradan kaza edilir. Kaza borcu olan kişinin bunları düzenli olarak, bir program içinde eda etmesi tavsiye edilir. Bu uygulamadaki kaza sayacı bunun takibi içindir.' },
  { id: 'k-oruc', topic: 'ibadet', title: 'Orucun vakti', body: 'Oruç, imsak vaktiyle başlar ve akşam (güneşin batışı) ile açılır. Sahur sünnettir ve imsaktan önce biter; iftarda acele etmek tavsiye edilmiştir.' },
  { id: 'k-zekat', topic: 'ibadet', title: 'Zekâtın nisabı', body: 'Zekât, temel ihtiyaçlar ve borçlar düşüldükten sonra nisap miktarına ulaşan ve üzerinden bir yıl geçen mal için verilir. Nisap, 80.18 gram altın veya 561 gram gümüş değerine denk gelir. Oran kırkta birdir, yani yüzde 2,5.' },
  { id: 'k-fitre', topic: 'ibadet', title: 'Fitre', body: 'Fitre (sadaka-i fıtır), Ramazan bayramı namazından önce verilen bir sadakadır. Kişinin kendisi ve bakmakla yükümlü olduğu kişiler için verilir. Miktarı, bir kişinin bir günlük yiyecek ihtiyacına göre belirlenir.' },
  { id: 'k-kurban', topic: 'ibadet', title: 'Kurban vakti', body: 'Kurban, Kurban Bayramı’nın ilk günü bayram namazından sonra başlar ve bayramın üçüncü günü akşamına kadar sürer. Etinin üçe bölünüp bir bölümünün ihtiyaç sahiplerine verilmesi yaygın uygulamadır.' },

  { id: 'k-kible', topic: 'kavram', title: 'Kıble nasıl bulunur', body: 'Kıble, bulunduğun noktadan Kâbe’ye giden en kısa yolun yönüdür. Dünya küre olduğu için bu yön, düz haritadaki çizgiyle aynı değildir; büyük daire hesabıyla bulunur. Bu yüzden Kuzey Amerika’nın bazı bölgelerinde kıble kuzeydoğuyu gösterir.' },
  { id: 'k-mihrap', topic: 'kavram', title: 'Mihrap', body: 'Mihrap, camide kıble yönünü gösteren girintidir. İmam namazı mihrabın önünde kıldırır. Mimaride mihrap, caminin yönünü belirleyen ana öğedir.' },
  { id: 'k-ezan', topic: 'kavram', title: 'Ezan ve kamet', body: 'Ezan, namaz vaktinin girdiğini duyurur; kamet ise cemaatle namaza başlanacağını bildirir. Ezan okunduktan sonra namaza durmadan önce kısa bir süre beklenmesi âdettendir.' },
  { id: 'k-cemaat', topic: 'kavram', title: 'Cemaat', body: 'Namazın cemaatle kılınması teşvik edilmiştir. En az iki kişi, biri imam biri cemaat olmak üzere cemaat sayılır.' },
  { id: 'k-zikir', topic: 'kavram', title: 'Zikir ve tesbih', body: 'Zikir, Allah’ı anmaktır. Namaz sonrası yapılan tesbihat yaygın bir uygulamadır. Tesbih tanelerinin 33’lü bölünmesi bu sayımdan gelir.' },
  { id: 'k-esma', topic: 'kavram', title: 'Esmâü’l-Hüsnâ', body: 'Esmâü’l-Hüsnâ, "en güzel isimler" demektir ve Allah’ın isim ve sıfatlarını anlatır. Yaygın listede 99 isim sayılır; farklı rivayetlerde liste kısmen değişebilir.' },
  { id: 'k-salavat', topic: 'kavram', title: 'Salavat', body: 'Salavat, Hz. Peygamber’e selam ve dua göndermektir. Cuma günü çokça salavat getirmek yaygın bir gelenektir.' },
  { id: 'k-kandil', topic: 'kavram', title: 'Kandil geceleri', body: 'Regaib, Miraç, Berat, Kadir ve Mevlid geceleri halk arasında "kandil" diye anılır. Adlandırma, Osmanlı döneminde bu gecelerde minarelerde kandil yakılması geleneğinden gelir.' },

  { id: 'k-mekke', topic: 'tarih', title: 'Kâbe', body: 'Kâbe, Mekke’de bulunan ve müslümanların kıblesi olan yapıdır. Tarih boyunca birkaç kez onarılmış ve yeniden inşa edilmiştir. Çevresindeki alan Mescid-i Haram’dır.' },
  { id: 'k-medine', topic: 'tarih', title: 'Mescid-i Nebevî', body: 'Medine’deki Mescid-i Nebevî, hicretten sonra inşa edilmiş ve İslam tarihinin ilk toplum merkezlerinden biri olmuştur. İbadetin yanı sıra eğitim ve yönetim işleri de burada görülürdü.' },
  { id: 'k-kudus', topic: 'tarih', title: 'Mescid-i Aksâ', body: 'Kudüs’teki Mescid-i Aksâ, müslümanların ilk kıblesidir. Kıblenin Kâbe’ye çevrilmesi hicretten sonra gerçekleşmiştir.' },
  { id: 'k-ilkvahiy', topic: 'tarih', title: 'İlk vahiy', body: 'İlk vahiy, Mekke yakınlarındaki Hira mağarasında gelmiştir. Gelen ilk emir "oku" anlamındadır; İslam geleneğinde okumanın ve öğrenmenin değeri buradan da anlaşılır.' },
  { id: 'k-hicretyolu', topic: 'tarih', title: 'Hicret', body: 'Hicret, Mekke’den Medine’ye yapılan göçtür. Bir kaçış değil, yeni bir toplum kurma girişimi olarak görülür; takvimin başlangıcı sayılmasının sebebi de budur.' },
  { id: 'k-veda', topic: 'tarih', title: 'Veda Hutbesi', body: 'Hz. Muhammed’in son haccında yaptığı konuşma "Veda Hutbesi" diye bilinir. Can ve mal dokunulmazlığı, kadın hakları ve insanlar arasında üstünlüğün takvayla olduğu gibi konular burada vurgulanmıştır.' },

  { id: 'k-sure', topic: 'kuran', title: 'Sure ve âyet', body: 'Kur’an 114 sureden oluşur. Sureler Mekke ve Medine dönemine göre "mekkî" ve "medenî" diye ayrılır. En uzun sure Bakara, en kısası Kevser’dir.' },
  { id: 'k-cuz', topic: 'kuran', title: 'Cüz ve hizb', body: 'Kur’an, okumayı kolaylaştırmak için 30 cüze bölünmüştür. Ramazan’da her gün bir cüz okunarak ay sonunda hatim tamamlanır. Her cüz dört hizbe ayrılır.' },
  { id: 'k-mushaf', topic: 'kuran', title: 'Mushaf sayfa düzeni', body: 'Yaygın mushaf düzeninde metin 604 sayfadır ve her sayfa bir âyetin ortasında değil, sayfa sonunda biter. Bu düzen ezber ve takip kolaylığı sağlar.' },
  { id: 'k-tecvid', topic: 'kuran', title: 'Tecvid nedir', body: 'Tecvid, Kur’an’ı harflerin hakkını vererek okuma ilmidir. Harflerin çıkış yerleri, uzatmalar ve durak işaretleri bu ilmin konusudur.' },
  { id: 'k-secde', topic: 'kuran', title: 'Tilâvet secdesi', body: 'Kur’an’da secde âyetleri vardır; bu âyetler okunduğunda veya işitildiğinde tilâvet secdesi yapılır. Mushaflarda bu yerler kenar işaretiyle gösterilir.' },
  { id: 'k-meal', topic: 'kuran', title: 'Meal ile tefsir farkı', body: 'Meal, âyetin başka bir dildeki yaklaşık karşılığıdır. Tefsir ise âyetin iniş sebebini, bağlamını ve anlam derinliğini açıklar. Meal okumak tefsir okumanın yerini tutmaz.' },

  { id: 'k-emanet', topic: 'ahlak', title: 'Emanet', body: 'Kendisine bırakılan şeyi korumak ve sahibine eksiksiz teslim etmek İslam ahlakının temel ilkelerindendir. Emanet yalnız eşya değil; söz, sır ve görev de olabilir.' },
  { id: 'k-komsu', topic: 'ahlak', title: 'Komşu hakkı', body: 'Komşuya iyi davranmak, rahatsız etmemek ve ihtiyaç anında yardım etmek üzerinde çokça durulan bir konudur. Komşuluk, din farkı gözetmeksizin bir hak olarak görülür.' },
  { id: 'k-gybet', topic: 'ahlak', title: 'Gıybet', body: 'Gıybet, bir kişinin arkasından, hoşlanmayacağı bir şeyi söylemektir. Söylenen doğru olsa bile gıybet sayılır; doğru değilse iftira olur.' },
  { id: 'k-israf', topic: 'ahlak', title: 'İsraf', body: 'İsraf, ihtiyaç ölçüsünü aşan kullanımdır. Yeme içmede, giyimde ve suda ölçülü olmak öğütlenir; cimrilik ise ayrı bir aşırılık olarak görülür.' },
  { id: 'k-sabir', topic: 'ahlak', title: 'Sabır', body: 'Sabır, yalnız beklemek değil; doğru olanda direnmek ve zorluk karşısında dağılmamaktır. Şükürle birlikte anılır: biri darlıkta, diğeri bollukta olgunluk ister.' },
  { id: 'k-adalet', topic: 'ahlak', title: 'Adalet', body: 'Adalet, kendi aleyhine bile olsa doğruyu söylemek ve hakkı gözetmektir. Sevgi veya öfkenin hükmü değiştirmemesi istenir.' },
];
