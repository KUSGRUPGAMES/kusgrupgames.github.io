# CHANGELOG

Semantic versioning. Yayınlanan ilk üretim sürümü hedefi: **1.0.0**.

## [Yayınlanmadı] — 0.1.0

### FAZ 0 — Repository audit, mimari, durum dosyaları

- Repository denetlendi: 5 mevcut Capacitor ürünü, tek dosya mimarisi.
- Mimari kararlar alındı ve `DECISIONS.md` içinde gerekçelendirildi (D1–D8).
- `PROJECT_STATE.md`, `MASTER_CHECKLIST.md`, `DECISIONS.md`,
  `KNOWN_ISSUES.md`, `CHANGELOG.md` oluşturuldu.

### FAZ 0 — Design system, bileşen kütüphanesi, veritabanı

- Expo SDK 54 + React Native 0.76.5 + TypeScript (strict) iskeleti.
- `BrandConfig`, design token'ları, açık/koyu tema, reduced-motion desteği.
- 29 yeniden kullanılabilir bileşen (`src/ui/`), dış ikon paketi olmadan
  32 ikonluk kendi SVG seti.
- Geometrik motif dili: 5 desen (rub'ül hizb, girih, sekizgen petek, kemer,
  yıldız kafes), düşük opaklıkta, figüratif öge yok.
- Arapça tipografi: Amiri + Amiri Quran (SIL OFL 1.1), sabit satır aralığı
  oranı; yön katmanı saf mantık (`direction.ts`) ve platform köprüsü
  (`rtl.ts`) olarak ayrıldı.
- Supabase şeması: 10 migration, 39 tablo, tümünde RLS.
- RLS davranış sınaması + kapsama denetimi (`tools/verify-db.sh`).
- Kalite kapısı: `tsc` + `eslint` + 6 test paketi / 43 test.

### FAZ 1 — Çekirdek altyapı

- expo-router sekme düzeni: Ana Sayfa, Kuran, İbadet, Keşfet, Profil;
  bulunamayan yol için kendi ekranı.
- Yerelleştirme: Türkçe kaynak dil (169 anahtar), EN/AR/DE/FR temel arayüz
  (85 anahtar). Eksik çeviri Türkçeye düşer, anahtar adı hiç gösterilmez.
- Gömülü metin yasağı sınamayla denetleniyor: ekran dosyalarında düz metin
  bırakılırsa test kırmızı olur.
- Kalıcılık: SQLite migration çalıştırıcısı (her sürüm kendi işleminde),
  AsyncStorage anahtar-değer katmanı, SecureStore sır deposu.
- Ağ katmanı: kısa zaman aşımı, sınırlı yeniden deneme, üstel geri çekilme,
  başarısızlıkta bayat önbellek yedeği. Bozuk yanıt önbelleğe yazılmaz.
- Üretim güvenli günlükleme: konum, e-posta, telefon, jeton ve JWT her
  derinlikte maskelenir; üretimde debug/info hiç yazılmaz.
- Hata sınırı ve çevrimdışı şeridi.
- Bağımlılıklar Expo SDK 54'ün beklediği sürümlere hizalandı
  (React 19, React Native 0.81.5, expo-router 6) ve `expo export` ile
  paketlemenin çalıştığı doğrulandı.

### Düzeltilen

- `app.config.ts` marka bilgisini `.ts` dosyasından okuyordu; Expo'nun
  yapılandırma değerlendiricisi bunu çözemiyor ve `expo export` patlıyordu.
  Marka değerleri `brand.json` içine alındı, tek kaynak korundu.
- `src/app/` klasörü expo-router tarafından yönlendirme kökü sanılıyordu;
  `src/boot/` olarak yeniden adlandırıldı.
- `migrate()` kendisine verilen migration listesini yok sayıyordu
  (`pendingMigrations` her zaman genel listeyi okuyordu). Sınama yakaladı.

### FAZ 2 — Onboarding, konum, namaz vakitleri

- Beş aşamalı onboarding; konum dışındaki her aşama atlanabilir.
- Konum: tek seferlik GPS okuması (sürekli izleme yok — pil kuralı §81),
  bulunan nokta çevrimdışı olarak en yakın şehre eşlenir. 81 il + 36 dünya
  şehri; hepsinin IANA saat dilimi doğrulandı.
- Türkçe arama normalizasyonu: "ISTANBUL", "istanbul", "İstanbul" ve
  "sanliurfa" aynı sonucu verir. Türkçe'nin I/İ tuzağı `toLowerCase`
  kullanılmadan, harf harf eşlemeyle çözüldü.
- Yedi hesaplama yöntemi, Hanefî/Şâfiî ikindi seçimi, vakit başına dakika
  düzeltmesi.
- `PrayerTimesProvider` soyutlaması: birincil kaynak cihazdaki hesap. Ağ
  kaynağı seçilse bile çökerse sessizce hesaba düşer — ekran boş kalmaz.
- Ana sayfa: sıradaki vakit halkası, canlı geri sayım, günün altı vakti.
  Sayaç uygulama arka plana geçince durur; astronomik hesap saniyede bir
  değil, gün dönünce yapılır.
- Aylık vakit takvimi ekranı.
- Bildirimler: vakit bazlı açma/kapama, erken uyarı dakikası, ses. Plan saf
  mantık olarak yazıldı ve sınandı: geçmiş an kurulmaz, oluşmayan vakit
  (kutup) için bildirim üretilmez, iOS'un 64 bekleyen bildirim sınırı aşılmaz.
- Çoklu kayıtlı konum: birincil konum kuralı ("her zaman tam bir birincil")
  sınamayla güvence altına alındı.

### FAZ 3 — Ana sayfa ve günlük içerik

- Ana sayfa sekiz karttan oluşuyor ve kullanıcı kartları gizleyip
  sıralayabiliyor. "Sıradaki vakit" kartı kapatılamaz. Yeni sürümde eklenen
  kart, eski kullanıcının düzenini bozmadan listenin sonuna geliyor.
- Günün içeriği seçimi: aynı gün hep aynı içerik, **herhangi** N ardışık günde
  tekrar yok. İlk çözüm tur sınırında tekrar üretiyordu (34 günlük pencerede
  34 yerine 26 farklı madde); liste uzunluğuyla aralarında asal bir adım
  kullanılarak tekrar yapısal olarak imkânsız hâle getirildi.
- 34 özgün Türkçe dua (14 kategori) ve 43 özgün bilgi maddesi (6 konu).
  Hiçbiri âyet veya hadis alıntısı değil; arayüzde de böyle belirtiliyor.
- Esmâü'l-Hüsnâ: 99 isim, arama, favori, günün esması. Arapça yazım bilerek
  boş: doğrulanmış kaynaktan gelecek.
- Hicrî takvim: bugünün tarihi, çift yönlü çevirici, ±2 gün düzeltme,
  13 dinî gün için geri sayım.
- Ay durumu: evre, aydınlanma oranı, ay yaşı, sonraki yeni ay ve dolunay.
  Model dört bilinen yeni ay anıyla karşılaştırıldı; sapma yarım günün altında.
  Arayüzde bunun rüyet yerine geçmediği yazılı.
- Birleşik favoriler: dua, esmâ ve ileride âyet/hadis aynı listede.

### FAZ 4 — Kur'an

- Tanzil Project'ten Arapça mushaf metni (Uthmani) içe aktarıldı. İçe aktarma
  betiği ile uygulama **aynı doğrulama modülünü** kullanıyor; kopya mantık yok.
  Doğrulama geçmezse dosya yazılmıyor.
- Doğrulanan değişmezler: 114 sure, 6236 âyet, sure başına âyet sayısı meta
  veriyle birebir, âyet numaraları boşluksuz, her âyet metni dolu ve Arapça,
  604 sayfa, 30 cüz, 15 secde âyeti, sağlama kararlı.
  Bilinen sayılarla ayrıca karşılaştırıldı (Fâtiha 7, Bakara 286, Kevser 3,
  Nâs 6) ve cüz başlangıçları doğrulandı (2. cüz Bakara 142, 30. cüz Nebe' 1).
- Kur'an ana ekranı: kaldığın yerden devam, sure listesi, cüz listesi,
  yer imleri.
- Okuyucu: Amiri Quran yüzüyle Arapça metin, kullanıcı yazı boyutu,
  âyet seçimi, yer imi (renk + not), favori, paylaşım. Paylaşılan metne
  kaynak künyesi otomatik ekleniyor.
- Arapça arama: kullanıcı harekesiz yazar, harekeli metinde eşleşir. Elif
  çeşitleri, tâ merbûta, elif maksûra ve tatvîl normalize ediliyor — ama
  yalnız aramada; ekranda gösterilen metin kaynaktaki hâliyle kalıyor.
- Meal, tefsir ve kıraat bölümleri arayüzde duruyor; içerik yerine neden boş
  olduğu yazılı. Lisans gelince yalnız veri yüklenecek.

### FAZ 5 — Kur'an sesi (altyapı)

- Kıraat lisansı olmadığı için ses dosyası yok (⛔B4). Lisans geldiğinde
  değişmeyecek kısım şimdiden yazıldı ve sınandı: oynatma kuyruğu, dört tekrar
  kipi (kapalı / âyet / aralık / sure), aralık tekrar sayacı, hız sınırı ve
  uyku zamanlayıcısı; indirme/depolama hesabı ve silince açılacak yer.

### FAZ 6 — Kıble

- Büyük daire hesabıyla kıble açısı ve Kâbe uzaklığı.
- Geometrik pusula kadranı: daire, derece çentikleri, yıldız iğne. Kâbe
  fotoğrafı ya da figüratif öge yok (§9).
- Doğruluk seviyesi, kalibrasyon yönergesi ve manyetik girişim uyarısı.
  Girişim, son okumaların yayılımından sezilir.
- Hizalanınca bir kez titreşim; "hareketi azalt" açıkken titreşim yok.
- Pusula yalnız kıble ekranı öndeyken açılır; ekran arka plana geçince
  dinleyici kapanır. Bu, kategorinin en sık pil şikâyetinin sebebidir.

### FAZ 7 ve 8 — Zikir, rehber, takip

- Zikirmatik: 8 hazır zikir, 6 hazır hedef, özel zikir, hedef halkası. Her
  dokunuşta hafif titreşim, hedefe varınca farklı bir geri bildirim — kullanıcı
  ekrana bakmadan anlar. "Hareketi azalt" açıkken titreşim yok.
- Zikir istatistiği: kesintisiz gün serisi, 14 günlük grafik, günlük/haftalık/
  aylık toplam ve ortalama, en çok çekilen zikir. Gün sınırı **kullanıcının
  konumunun** takvimine göre çizilir; yatsıdan sonra çekilen zikir yarına
  yazılmaz.
- Namaz rehberi: abdest, hazırlık, kılınış, rekât sayıları, seferîlik ve özür
  durumları — 6 bölüm, 33 adım. Hüküm vermez; mezhep farkı olan yerlerde fark
  belirtilir. Okunan sûrelerin Arapça metni yok (⛔B1) ve bu yazılı.
- Kaza namazı: beş farz + vitir için sayaç, toplu giriş, tek tek azaltma,
  geçmiş ve son işlemi geri alma. Sayaç asla eksiye düşmez.
- İbadet defteri: gün gün namaz durumu (tek başına / cemaatle / kaza),
  Kur'an okuma dakikası, günün notu; geçmiş günlere gidilebilir.
- Oruç takibi: Ramazan, kaza ve nafile.
- Bu kayıtların cihazda kaldığı her ekranda yazılı.

### FAZ 9 — Zekât, Ramazan, mukabele, cuma, hac

- Zekât hesaplama: nakit, döviz, altın, gümüş, yatırım, ticari mal ve
  alacaklar; borç ve temel ihtiyaçlar düşülür. Nisap ölçüsü altın (80,18 g)
  veya gümüş (561 g) olarak seçilebilir. Metal fiyatı girilmemişse
  **yükümlülük iddia edilmez** — eksik veriyle "şu kadar ver" denmez.
  Kullanılan yöntem ekranda yazılı; canlı piyasa verisi bilerek çekilmiyor.
- Fitre hesabı.
- Ramazan modu: iftar ve imsak geri sayımı, ayın 30 günü için imsak/akşam
  tablosu, ana sayfada Ramazan kartı. Ramazan dışında kart hiç görünmez.
- Mukabele: 30 cüz takibi, hedef tarihe göre günlük tempo, gecikme uyarısı;
  bir cüze uzun basınca okuyucuda o cüzün başı açılır.
- Cuma modu: yalnız cuma günü görünen kart ve Kehf sûresi kısayolu.
- Hac ve Umre rehberi: hazırlık, umre, hac günleri ve uyarılar (4 bölüm,
  17 adım) + 18 maddelik hazırlık listesi. Tamamen çevrimdışı — hac sırasında
  şebeke çoğu zaman tıkalıdır.

### FAZ 10-11 — Eşitleme motoru, arama, hatırlatıcılar

- Eşitleme birleştirme motoru yazıldı ve sınandı. Supabase projesi henüz yok
  (⛔B5) ama eşitlemenin zor kısmı ağ değil, iki cihazın aynı kaydı farklı
  değiştirmesidir:
  - silme "silindi" işaretiyle taşınır, çevrimdışı cihaz silineni diriltmez;
  - eşit zaman damgasında kararlı bir ayraç kullanılır, yoksa iki cihaz
    birbirini sonsuza kadar ezer;
  - kaza sayacı gibi biriken değerlerde "son yazan kazanır" yanlıştır, iki
    cihazın değişimi toplanır — yoksa bir cihazda kılınan namaz kaybolur.
  Birleştirme idempotent ve yön bağımsız; ikisi de sınanıyor.
- Global arama: "2:255", "bakara 255", "kehf", "bağışlayan", "yolculuk",
  "nisap" ve Arapça kelime aynı kutuda çalışıyor. Latin sorguda mushaf metni
  hiç taranmıyor — 6236 âyeti boşuna gezmemek için.
- Özel hatırlatıcılar: sabit saatte ya da vakte göre (ör. akşamdan 30 dk önce),
  hafta günü seçimiyle. Kutupta oluşmayan vakte bağlı hatırlatıcı kurulmuyor.

### Engeller kalktı — meal, kıraat, sunucu

- **Türkçe meal geldi.** Elmalılı Hamdi Yazır'ın *Hak Dini Kur'an Dili* meali
  kamu malı (mütercim 1942'de vefat etti; FSEK m.27 koruma süresi 2012 sonunda
  doldu). 6236 satır içe aktarıldı, Arapça metinle aynı titizlikte doğrulandı
  (sure başına satır sayısı, boş satır yok, sağlama). Okuyucuda üç mod
  (Arapça / Arapça+Meal / Meal), meal araması, Günün Âyeti ve paylaşımda
  kaynak künyesi açıldı.
- **Kıraat geldi.** 18 okuyucu, Islamic Network CDN'inden akış; istenen sure
  indirilip çevrimdışı dinlenebiliyor. Okuyucu listesi **ölçülerek** üretildi:
  her okuyucunun hangi bit hızında gerçekten dosya verdiği sınandı, mükerrer
  baskılar ayıklandı, hepsine Türkçe ad yazıldı. Arka planda çalma açık.
  QuranicAudio.com **kullanılmadı**: şartlarında ticari kullanım açıkça yasak.
- **Supabase v1'den çıkarıldı.** v1'in tek bir özelliği bile sunucuya muhtaç
  değil. Kişisel veri cihazdan çıkmıyor, bakılacak sunucu ve aylık gider yok,
  App Review'daki hesap/gizlilik soruları kendiliğinden çözülüyor. İçerik
  güncellemeleri GitHub Pages üzerinde statik bir JSON'dan geliyor: sürüm
  artmadan değişmiyor, şemaya uymayan paket yok sayılıyor ve kanal hiçbir şeyi
  silemiyor. Şema, RLS ve eşitleme motoru v2 için duruyor.

### FAZ 16 — Freemium ve reklam kuralları

- Freemium çizgisi kod düzeyinde çekildi: **ibadetin kendisi hiçbir zaman
  kilitlenmez.** Namaz vakti, kıble, Kur'an, meal, zikir, kaza, dua, esmâ,
  hicri takvim, zekât, rehber ve bildirimler ücretsiz ve öyle kalacak —
  biri kilitlenmeye kalkarsa sınama kırılıyor. Pro yalnız çoğaltıcı olanı
  açıyor: sınırsız konum, bütün okuyucular, sınırsız indirme, reklamsızlık.
- Ödeme sorunu sırasında (mağaza yeniden denerken) erişim kesilmiyor.
- Reklam kuralları koda gömüldü: vaktin girmesine 15 dakika kala ve vakit
  girdikten sonra 30 dakika reklam durur; okuyucu, kıble, zikir ve namaz
  rehberi ekranlarında hiç reklam yoktur; tam ekran reklamlar arasında en az
  üç dakika geçer; 11 uygunsuz kategori engellenir ve yaş derecesi G'ye
  sabitlenir.

### FAZ 11 ve 17 — Paylaşım kartı, erişilebilirlik, güvenlik

- **Paylaşım kartı**: hikâye (9:16), kare (1:1) ve dikey (4:5) boyutlarda,
  açık/koyu tema, geometrik motif. Kart SVG olarak üretilip tam çözünürlükte
  PNG'ye alınıyor. **Kaynak künyesi karttan kaldırılamıyor** — kaynaksız kart
  üretmeye çalışmak hata veriyor; metni bağlamından kopuk dolaştırmamak için.
- Kart örnekleri üretilip **gerçekten çizdirildi**: Arapça satır sağ kenardan
  taşıyordu (`text-anchor="end"` RTL metinde ters çalışıyor), düzeltildi.
  Dikey ortalama da künyenin üstündeki alana göre yeniden hesaplandı.
- **Erişilebilirlik denetimi sınamaya çevrildi** (§79): her `IconButton`
  etiketli mi, her `Pressable` erişilebilirlik bilgisi veriyor mu, ekranlarda
  ham `Text` kullanılmış mı — hepsi otomatik denetleniyor.
- **Kontrast ölçüldü, bir kusur bulundu ve düzeltildi**: üçüncül metin
  (kaynak künyesi, ipucu satırları) ivory zeminde 2.54:1 kontrastla
  okunmuyordu. Açık temada `#8FA29B` → `#6E817A` (3.89:1), koyu temada alfa
  0.44 → 0.56. Sınama, eski değer geri konduğunda kırılıyor.
- **Güvenlik ve gizlilik denetimi** (§69, §84, §89): kaynakta gömülü anahtar
  taraması, sırların yalnız SecureStore'dan geçmesi, `console` kullanımının
  günlük katmanıyla sınırlı olması, analitiğin kapalı başlaması ve ağ
  katmanının **yalnız içerik kanalında** kullanılması — yani kişisel verinin
  sunucuya gitmediği — sınamayla korunuyor.
- **Pil kuralları sınamaya bağlandı**: tek seferlik GPS okuması
  (`watchPositionAsync` kullanımı yasak), pusula yalnız kıble ekranında,
  geri sayım arka planda durur.
