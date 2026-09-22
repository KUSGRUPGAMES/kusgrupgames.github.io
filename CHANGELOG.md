# CHANGELOG

Semantic versioning. Yayınlanan ilk üretim sürümü hedefi: **1.0.0**.

## [1.0.0] — ilk yayın adayı

İlk mağaza sürümü. Hesapsız, sunucusuz, **tamamen ücretsiz ve reklamsız**
çalışan bir namaz vakti ve Kur'an uygulaması.

**Kapsam:** altı vakit ve aylık takvim (yedi hesaplama yöntemi, vakit başına
dakika düzeltmesi), kıble pusulası, Kur'an-ı Kerim'in tamamı (Tanzil metni +
Elmalılı meali, 18 okuyucunun kıraati, çevrimdışı indirme), zikirmatik,
kaza takibi, ibadet defteri, oruç ve hatim takibi, zekât ve fitre hesabı,
Ramazan modu, hicrî takvim ve dinî günler, Esmâü'l-Hüsnâ, 14 kategoride dua,
namaz rehberi, Hac ve Umre rehberi, 43 maddelik bilgi kütüphanesi, arama,
paylaşım kartı ve yerel yedek.

**Beş dil:** arayüzün tamamı Türkçe, İngilizce, Arapça, Almanca ve
Fransızca (573 anahtar × 5). Kur'an meali ve bilgi yazıları Türkçedir.

**Gizlilik:** hesap yok, sunucu yok, reklam yok, izleyici yok, analitik yok.
Kişisel veri cihazdan çıkmıyor. İki mağaza formunda da "veri toplanmıyor".

### Bu sürümde kapatılan yayın engelleri

- Mağaza metinleri ve yasal sayfalar uygulamada bulunmayan reklam ve Pro
  aboneliğini anlatıyordu — hepsi gerçeğe göre yeniden yazıldı.
- Dört dilde çeviri kapsamı %12'ydi (573 anahtardan 63'ü); %100'e çıkarıldı ve
  sınamaya bağlandı — yeni bir anahtar dört dile de yazılmadan kapı geçmiyor.
- İbadet defterindeki seçici dar ekranda üst üste biniyordu.
- Koyu temada gezinme başlığı bembeyaz kalıyordu.
- Mağaza ekran görüntüleri ve öne çıkan görsel üretildi (`npm run store:shots`).

### Son gözden geçirmede bulunan ve düzeltilenler

Yayın öncesi 128 denetim karesi tek tek büyütülerek bakıldı; bulunanlar:

- **Girdi kutuları koyu temada kayboluyordu.** Denetim sınırı kart kenarıyla
  aynı token'ı kullanıyordu: açık temada 1.30:1, koyu temada 1.43:1. WCAG
  1.4.11 3:1 ister. Ayrı bir `controlBorder` rolü açıldı ve ölçülerek
  seçilen iki ton bağlandı (D20). Girdi, çip ve ikincil düğme etkilendi.
- **Seçili okuyucu "Seç" rozetiyle işaretleniyordu** — zaten seçili olan
  satır kullanıcıya "seç" diyordu. Uygulamanın geri kalanındaki onay imine
  çevrildi; ekran okuyucuya da `selected` olarak gidiyor.
- **Ana sayfa düzeninde sıralama okları yanlıştı.** Yukarı taşıyan düğme
  **sağ** ok çiziyor ve ekran okuyucuya "Geri" diye okunuyordu; aşağı taşıyan
  "İleri" diyordu. `chevronUp`/`chevronDown` ve kendi adları eklendi.
- **Zekât ekranında nisap ölçüsü seçicisinin başlığı yoktu**; gören kullanıcı
  "Altın / Gümüş" yazan bir çubuğun neyi seçtiğini bilmiyordu. `Segmented`
  artık görünen başlık alabiliyor; beş yerde bağlandı.
- **Hatim ekranının boş durumu** "Boş bırakabilirsin" diyordu — hedef tarih
  alanının ipucu metni yanlışlıkla açıklama olarak kullanılmıştı.
- **İndirme düğmeleri paylaşım ikonu kullanıyordu** (ok yukarı bakıyordu);
  `download` ve `trash` ikonları eklendi, üç yerde düzeltildi.

Hepsi sınamaya bağlandı: `Segmented` başlıksız kalamıyor, seçili satır emir
kipiyle işaretlenemiyor, denetim sınırı 3:1'in altına düşemiyor.

**Türkçe yazım birliği.** Uygulama "Kuran", "ayet", "Hicri", "Dini günler",
"Esmaül Hüsna" yazarken mağaza metinleri ve bilgi maddeleri "Kur'an", "âyet",
"Hicrî", "dinî günler", "Esmâü'l-Hüsnâ" yazıyordu. Kullanıcı aynı şeyin iki
yazımını yan yana görüyordu. Uygulama, doğru olan biçime çekildi:
`dini` → `dinî`, `hicri` → `hicrî`, `resmi` → `resmî` (TDK'da bu ekler
düzeltme imiyle yazılır ve anlam ayırt eder), `Kuran` → `Kur'an`,
`ayet` → `âyet`, `Esmaül Hüsna` → `Esmâü'l-Hüsnâ`.

**Aylık takvimin sütun başlıkları koddan kesiliyordu.** Uzun vakit adı
`slice(0, 3)` ile kırpılıyordu: Türkçede "Güneş" → "Gün" olup soldaki gün
numarası sütunuyla karışıyor, Arapçada sözcük ortadan bölünüyordu
("الشروق" → "الش"). Her dile kendi kısaltması yazıldı; 320 pikselde bile
tam ad sığıyor. Sınama artık çevrilmiş metnin karakter sayısıyla
kısaltılmasını yasaklıyor.

**Ramazan imsakiyesinin gün sütunu "Bugün" başlığını taşıyordu** — sütun
otuz günü listeliyor. "Gün" oldu.

**Zikir istatistiği ekranının boş durumu** "Saymak için dokun" diyordu; o
ekranda dokunulacak sayaç yok, sayaç zikirmatikte. Metin gerçeği söylüyor.

**Hatırlatıcı ekranında hafta Pazar'la başlıyordu.** Çipler JavaScript'in
`getDay()` sırasıyla diziliyordu (0 = Pazar); Türkiye'de takvim Pazartesi'yle
başlar ve ilk sıradaki "Paz" kısaltması Pazartesi sanılıyordu. Gösterim sırası
Pazartesi'den başlayacak biçimde düzeltildi — kayıtta duran sayı değişmedi,
eski hatırlatıcılar olduğu gibi çalışır.

**Kaza ekranının boş durumu**, hemen altındaki "Toplu giriş" bölümünün alt
başlığıyla birebir aynı cümleyi yazıyordu; kullanıcı aynı metni iki kez
okuyordu. Boş duruma kendi açıklaması yazıldı.

**Hicrî tarih çeviricisinin alan etiketi** bölüm başlığının aynısıydı
("Tarih çevirici") ve hangi tarihin hangi sırayla beklendiğini söylemiyordu.
Artık yöne göre "Miladi tarih" / "Hicrî tarih" yazıyor ve altında biçim
örneği duruyor.

---

## [Yayınlanmadı] — 0.1.0

### Yerel yedek: dışa aktar ve geri yükle (D19)

Cihazlar arası eşitlemenin arkasındaki gerçek ihtiyaç — kaydı kaybetmemek ve
yeni telefona taşımak — sunucu istemiyor. Hesap ekranına yedek dosyası eklendi.

- Konumlar, yer imleri, favoriler, zikir oturumları, kaza sayaçları ve
  geçmişi, ibadet defteri, oruç kaydı, hatimler, hatırlatıcılar ve ayarlar
  tek bir JSON dosyasına yazılıyor; dosya sistemin paylaşım tepsisine
  veriliyor, uygulama hiçbir yere göndermiyor.
- Geri yüklemede iki kip: **Birleştir** (hiçbir kayıt silinmez) ve
  **Yedeği yerine koy**. Hatimde okunan cüzler birleşir, ibadet defteri gün
  gün birleşir, favorinin ilk eklenme anı korunur.
- Kaza sayaçları ve ayarlar ancak cihaz boşken yedekten alınır; doluysa
  cihazınki korunur ve bu ekranda söylenir. Sebebi D19'da yazılı: sayaçların
  ortak atası yok, birleştirmek sessizce yanlış sonuç verir.
- Bozuk dosya, başka uygulamanın dosyası ve **daha yeni sürümden gelen yedek**
  ayrı ayrı reddediliyor; sonuncusunda kullanıcıya uygulamayı güncellemesi
  söyleniyor.
- **Olmayan özelliği vaat eden metin düzeltildi:** `profile.guestBody`
  "hesap açarsan cihazlar arasında eşitlenir" diyordu; hesap da eşitleme de
  yok.

### Uygulamanın renkleri logodan ölçüldü (D18)

Kullanıcı bildirdi: logonun yeşili güzel, uygulamanınki yavan; altın da
uygulamanın zeminiyle uyuşmuyor. Ölçünce ikisi de doğru çıktı — paketin
"önerilen değerleri" logonun kendi pikselleriyle aynı değil.

- Bütün marka renkleri masterdan **ölçülerek** alındı: zemin `#011D13`
  (paket `#003F32` diyordu), altın `#D3B685` (paket `#D6B46A`), fildişi
  `#F6F1E4`, metin `#011E17`.
- Ekran zemini ve marka kartı artık düz değil, logonun kendi inişini taşıyan
  birer gradyan (`Gradient` bileşeni, `react-native-svg`).
- Hero kartı iki temada da ikonun koyu zümrüdü; üstündeki altın
  (`onAccentHighlight`) iki temada da aynı — logodaki eşleşmenin kendisi.
- Üç geri sayım halkası bu rollere geçti. Zikirmatikte ilerleme de yatak da
  fildişiydi, sayaç ilerlemiyormuş gibi duruyordu.
- **Koyu temada başlık çubuğu bembeyazdı.** Yirmi beş ekran kendi başlığını
  açıyor ve kök yığın başlığı temalamıyordu; React Navigation varsayılanı
  devreye giriyordu. Düzeltildi ve sınamaya bağlandı.
- `contrast.test.ts` artık gradyanın iki ucunu da ölçüyor; `brand.test.ts`
  masterı her çalıştığında yeniden ölçüp paletle karşılaştırıyor.

### Logonun kaynağı bitmiş master PNG oldu (D17)

Marka sahibi, pakette gelen `BES_AppIcon_*.svg` / `BES_Symbol_*.svg`
dosyalarının onaylanan logonun **elle yapılmış yaklaşık rekonstrüksiyonları**
olduğunu ve marka tasarımını bozduğunu bildirdi. Logo artık yalnız
`assets/brand/png/BES_AppIcon_{Dark,Light}_1024.png` dosyalarından gelir.

- On SVG dosyası ve onlardan türeyen desen PNG'leri depodan kaldırıldı.
- `tools/gen-brand.js` yeniden yazıldı: Playwright yerine piksel işi
  (`pngjs`). Yaptığı üç şey — sunum çerçevesini kırpmak, en-boy oranını
  koruyarak ölçeklemek, alfa ayıklamak — logonun geometrisine dokunmaz.
- iOS ikonu artık **alfasız** (PNG colorType 2) yazılıyor; köşe yuvarlaması
  kutucuğun kenar piksellerinin ışınsal uzatılmasıyla gideriliyor. Master'ın
  çevresindeki beyaz kâğıt kenarı ve gölge ikona hiç girmiyor.
- Android uyarlanabilir ikon güvenli daireye **merkezden en uzak opak piksele
  göre** ölçekleniyor: sınırlayıcı dikdörtgeni %66'ya oturtmak yetmiyordu,
  piksellerin %1,5'i dairenin dışında kalıyor ve yuvarlak maskeli
  başlatıcılarda kırpılıyordu.
- `brand.test.ts` yeniden yazıldı: master oranı ile üretilenin oranı
  karşılaştırılıyor (esnetme yakalanıyor), iOS ikonunun alfasızlığı ve köşe
  rengi, güvenli daire, tek renk yüzeylerin gerçekten tek renk olduğu, `.svg`
  dönmediği ve üreticide yol verisi/`font-family` bulunmadığı denetleniyor.
  Üçü de mutasyonla sınandı.
- Arayüzdeki `rubElHizb` motifinin **logo olmadığı** belgelendi; marka işareti
  taşımayan genel bir yüzey dokusudur.

### Marka varlıkları verilen pakete geçirildi (D16, yerine D17 geçti)

Marka sahibi kendi tasarımını gönderdi. Depoda çizilen işaret
(`tools/brand/mark.js`) kaldırıldı; artık tek kaynak `assets/brand/`.

- Paket olduğu gibi depoya alındı: 10 SVG, 12 PNG, `brand.tokens.json`,
  `CLAUDE_HANDOFF.md`, referans panosu.
- `tools/gen-brand.js` yeniden yazıldı: hiçbir şey çizmez, yalnız verilen
  SVG'leri Expo'nun beklediği adlara rasterler.
- iOS ikonunda zemin köşe yarıçapı üretim anında sıfırlanıyor (paket kuralı 3):
  verilen master `rx="220"` taşıyor, Apple kendi maskesini uyguladığı için iki
  yuvarlama üst üste binince köşelerde açık bir hâle kalıyordu.
- Android bildirim rozeti bağlandı (`expo-notifications`, paket kuralı 5);
  prebuild beş yoğunlukta `notification_icon.png` yerleştiriyor.
- Açılış ekranı iki temada ayrı: koyu `#003F32` + altın sembol, açık `#F7F3E8`
  + zümrüt sembol.
- Palet `brand.tokens.json`'a bağlandı; `brand.test.ts` altı marka rengini
  paketle karşılaştırıyor. Altın rampasının açık uçları ikonun gradyan
  duraklarından alındı.
- Uygulama içi `rubElHizb` motifi paketin karosunun birebir aynısı oldu —
  arayüzde iki üst üste kare, ikonda sekiz köşeli yıldız vardı, tutmuyordu.
- **`accent` ikiye ayrıldı.** Deep Emerald zemin olunca koyu temada hero kartı
  nane yeşiline dönüştü: tek token hem dolgu yüzeyi hem ön plan vurgusuydu ve
  koyu temada bu ikisi ters yön ister. `accentSurface` eklendi, kontrast
  sınaması ikisini ayrı ölçüyor.
- `brand.test.ts` yeniden yazıldı: koyu ve açık ikonun **yol verileri eşit
  olmalı** (paketin pazarlıksız kuralı), on dosyanın hepsi aynı geometriyi
  taşımalı, depoda logoyu çizen bir üretici bulunmamalı, renkler paketle
  aynı olmalı.

Kapı: tsc + eslint + 569 test + Metro paketi + Android prebuild yeşil;
42 ekran yeni palette çizdirilip bakıldı.

### Yeniden markalama: Sükûn → BEŞ

Marka adı **BEŞ**, sembol özel çizilmiş bir **5** (D15). Geçici "Sükûn"
markası geçersiz işaretlendi.

- `tools/brand/mark.js`: işaretin **tek kaynağı**. Rakamın alt kâsesinin iç
  boşluğunda kubbe, iki minare ve alem hilali durur — ilk bakışta `5`, ikinci
  bakışta siluet. Cami yapıştırılmış bir klip-art değil: tabanı kâsenin iç alt
  kenarının altına taşarak geometriye kaynaşır.
- Koyu ve açık varyant **birebir aynı yolları** kullanır; yalnız renk değişir.
  İkisinde de aynı rub'ül hizb deseni bulunur. `mark.js` tema bilmez.
- Duyarlı işaret: `tamYol` (≥128px) · `ortaYol` (48–128px) · `mikroYol` (≤48px).
  Ölçüldü: 24 piksel ve altında cami detayı çamura dönüşüyor, mikro kademe
  bu yüzden var.
- Palet direktife göre yenilendi: emerald `#003F32`–`#005343`, ivory
  `#F4EFE3`–`#FDFBF6`, muted gold `#C9A65A`. Açık temada **saf beyaz
  kaldırıldı** — steril beyaz ürünü jenerik bir mobil uygulamaya çeviriyordu.
- `assets/brand/`: SVG kaynak + koyu/açık/mikro/monokrom rasterlar. Android
  13+ temalı ikon için `adaptive-icon-mono.png` eklendi.
- Mağaza adı `BEŞ – Ezan & Namaz Vakitleri` (28 karakter): "ezan" ve "namaz
  vakitleri" artık tek başlıkta. Alt başlık, anahtar kelimeler ve iki mağaza
  açıklaması yeniden yazıldı.
- Yayın sayfaları (TR + EN), `account.guestOnly` metni ve sınamalar geçirildi.
  Marka adı hiçbir metne gömülü değil; `brand.json` tek kaynak.
- `BRAND_GUIDELINES.md`: ad, sembol geometrisi (birim ölçülerle), duyarlı
  kademeler, renk tabloları, desen kuralları, yanlış kullanımlar ve henüz
  native hedefi olmayan yüzeylerin (widget, Live Activity, Watch) tasarımı.
- **Paket kimliği değişmedi** (`com.kusgrup.sukun`): kimliği değiştirmek imzayı,
  App Store Connect kaydını ve kurulu uygulamaları kırar, kazancı sıfırdır —
  kullanıcıya hiçbir yerde görünmez.

Kapı: tsc + eslint + 550 test yeşil; 42 ekran yeni palette çizdirilip bakıldı.

### Mağaza adı ve mağaza metinleri

- Mağaza adı `Sükûn: Namaz Vakti ve Kur’an` → **`Sükûn: Ezan Vakti ve Kur’an`**.
  Türkiye'de en çok aranan iki ifade "ezan vakti" ve "namaz vakti"; başlıkta
  yalnız ikincisi vardı. Şimdi "Ezan Vakti" başlıkta, "Namaz vakti" alt
  başlıkta — ikisi de görünür alanda. Marka önde kalıyor çünkü "Sükûn" bize
  ait, "ezan vakti" değil.
- `store/app-store.md` ve `store/play-store.md` yazıldı: ad, alt başlık,
  anahtar kelimeler, tanıtım metni ve 4000 karakterlik açıklamalar. Sükûn'un
  `store/` klasörü hiç yoktu (FAZ 19).
- `storeTexts.test.ts`: her alanın karakter sınırına sığdığını, anahtar
  kelimelerin başlıkta geçen sözcükleri tekrar etmediğini (üç alan birlikte
  tarandığı için boşa yer demek), iki mağazada ve `brand.json` içinde aynı
  adın yazdığını ve adda "Pro"/"Diyanet" gibi yanıltıcı ya da başkasına ait
  sözcük bulunmadığını denetler.

### Görsel geçiş — ekran görüntüsü ve video turuyla yakalanan hatalar

Uygulamanın 42 ekranı web hedefinde gerçekten çizdirilip tek tek incelendi;
üstüne 85 saniyelik bir gezinme videosu kaydedildi. Bakarak bulunan hatalar:

- **İlk açılış bomboş beyaz ekrandı.** Kök düzen `onboardingDone` yanlışken
  `<Stack>` yerine yalnız `<Redirect>` döndürüyordu; gezinme kabı hiç
  çizilmediği için yönlendirme de çalışmıyordu. Kapı artık kök yığının bir
  ekranı olan `(tabs)/_layout.tsx` içinde. Kök düzenin erken dönmediğini
  doğrulayan sınama eklendi.
- **Onboarding'de konum adımı atlanabiliyordu.** "Geç" düğmesi doğrudan
  `setAdim` çağırdığı için konum kontrolünü deliyordu; kullanıcı konumsuz
  ana sayfaya düşüyordu. Düğme artık 2. adımda çizilmiyor.
- **Geri sayım halkanın dışına taşıyordu.** 40 puntoluk sayaç 168 birimlik
  halkaya sığmıyordu; ana sayfada halka 208'e çıkarıldı.
- **Ramazan dışında "İftara kalan" sayılıyordu.** Geri sayım yalnız Ramazan
  ayında çizilir; dışında tahmini başlangıç tarihi gösterilir.
- **Hatırlatıcı saati "+21" görünüyordu.** `Stepper` her pozitif değere artı
  koyuyordu; işaret artık yalnız `signed` verilen düzeltme alanlarında.
- **Pusula okunmuyorken başlık alttaki etiketi tekrar ediyordu** ("Kıble yönü"
  iki kez). Ayrı bir yönlendirme metni eklendi (`qibla.noHeading`).
- **Paylaşım kartı boş durumu alakasız metin gösteriyordu** ("Eklediklerin
  burada görünecek"). Ekranın nereden açıldığını anlatan metin yazıldı.
- **Yedi ekranda bölüm başlığı ekran başlığını tekrar ediyordu.** Hepsi
  düzeltildi; tekrarı yakalayan sınama eklendi.
- **Tarihler her dilde Türkçe çiziliyordu.** `Intl.DateTimeFormat('tr-TR', …)`
  yedi yerde gömülüydü; `useDateFormat` ile seçili dile bağlandı, sabit dil
  yazımını yasaklayan sınama eklendi.
- **Yer aramasında ülke eşleşmesi şehir eşleşmesiyle aynı puandaydı.** "İs"
  yazınca İstanbul'un yanında Kahire (Mısır) ve Karaçi (Pakistan) çıkıyordu;
  şehir adı eşleşmeleri artık her zaman üstte.
- **Pusula aboneliği sızabiliyordu.** Abonelik kurulurken ekran kapanırsa
  bırakılmıyordu ve `AppState` tekrarı eski aboneliği kaybettiriyordu;
  ikisi de düzeltildi, `remove()` hatası artık unmount'u kırmıyor.
- Tespih ikonu 24 pikselde "C" gibi okunuyordu; kapalı boncuk halkası ve
  püskül olarak yeniden çizildi. Ramazan, zekât ve hac için ayrı ikonlar
  eklendi (hilal-yıldız, para, Kâbe) — eskiden esmâ ve dinî günlerle aynı
  ikonu paylaşıyorlardı.
- Keşfet'teki "Günün Hadisi" bölümü, lisans (B3) çözülene kadar hiç
  çizilmiyor; kullanıcıya boş bir bölüm ve özür metni gösterilmiyor.

Kalite kapısı: 524 sınama, `tsc` + `eslint` + Android paketi yeşil.

### Yayın sayfaları — kırık bağlantılar

- `brand.json` içindeki `termsUrl` olmayan bir sayfayı gösteriyordu
  (`docs/sukun/terms.html` yazılmamıştı). App Review hem gizlilik hem
  koşul adresini açtığı için bu doğrudan ret sebebiydi.
- İngilizce gizlilik sayfasının menüsü de olmayan `terms.html` ve
  `support.html` sayfalarına bağlanıyordu.
- İngilizce **Terms of Use** ve **Support** sayfaları yazıldı (çeviri değil,
  Türkçesiyle aynı özü taşıyan ayrı metin); Türkçe sayfalara "English"
  bağlantısı, `docs/index.html` kartına doğru adresler eklendi.
- `docsLinks.test.ts`: her yerel bağlantının bir dosyaya gittiğini,
  `brand.json` adreslerinin var olan sayfalara karşılık geldiğini ve her
  sayfanın diğer dildeki karşılığının bulunduğunu denetler.

### Durum dosyalarında bayat kayıt

- `MASTER_CHECKLIST.md` iki maddeyi hâlâ B1/B4 engeline bağlı gösteriyordu;
  ikisi de çözülmüştü. Âyet aksiyonları satırı güncellendi; namaz rehberinde
  okunan sûrelerin Arapça metni artık "engelli" değil, **eksik** olarak
  işaretlendi.


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

### FAZ 18-19 — Test matrisi ve yayın hazırlığı

- Sınamalar iki projeye ayrıldı: `mantik` (saf hesaplar, düğüm ortamı, ~2 sn)
  ve `bilesen` (jest-expo ile gerçek render). Toplam 496 sınama.
- Bileşen sınamaları tasarım sisteminin sözleşmesini koruyor: düğme devre
  dışıyken dokunmayı iletmiyor mu, Arapça metin gerçekten sağdan sola mı
  akıyor, Pro kilidi içeriği gizlemeden mi kilitliyor.
  (RTL 14'te `render` promise döndürüyor — beklenmediğinde sorgular boş
  nesneden okunuyor; bu yakalanıp düzeltildi.)
- **Son denetim sınaması** (§101): üretim kodunda yarım iş işareti kalmadı,
  her ekran kök düzende kayıtlı, kodda geçen her yönlendirme hedefi gerçekten
  var, kullanılan her çeviri anahtarı tanımlı, sürüm numaraları tutarlı,
  içerik paketleri kaynak künyesi taşıyor.
- README, ARCHITECTURE ve RELEASE_CHECKLIST yazıldı. Yayın listesi beş
  kullanıcı yolculuğunu adım adım tarif ediyor ve hepsini bir kez de uçak
  modunda tekrarlatıyor.
- Mağaza sayfaları: `docs/sukun/` altında tanıtım, gizlilik (Türkçe ve
  İngilizce ayrı yazıldı), kullanım koşulları ve destek sayfası. Gizlilik
  metni "hesap yok, sunucu yok" gerçeğini olduğu gibi anlatıyor ve reklam
  sınırlarını tek tek sayıyor.

### Engelsiz kalan maddeler kapatıldı

- **Sanal listeler** (§80): 114 sure, 99 esmâ, arama sonuçları ve bildirim
  listesi artık görünen kadarı çiziliyor. Bir ekran yüzlerce satırı `.map()`
  ile çizmeye başlarsa sınama uyarıyor.
- **Bildirim merkezi** (§65): vakit bildirimleri ve özel hatırlatıcılar tek
  listede, zaman sırasında; "yeniden kur" düğmesiyle plan tazeleniyor.
- **Çökme kaydı** (§85): rapor **bir servise gönderilmiyor**. Son 20 hata
  cihazda tutuluyor, kişisel veri maskeleniyor ve kullanıcı isterse destek
  e-postasına kendisi ekliyor — ne gönderdiğini görerek.
- **Hesap ekranı** (§57, §59): "giriş yap" ekranı yok çünkü hesap yok. Ekran
  asıl sorulan soruyu yanıtlıyor: hangi veri nerede duruyor, kaç kayıt var,
  nasıl silinir.
- **Ezan sesi** (§17) dürüstçe kısmi işaretlendi: bildirim sistem sesini
  kullanıyor; ezan kaydı bundan ayrı bir lisans meselesi.
