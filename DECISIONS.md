# DECISIONS

Kalıcı mimari kararlar. Her karar: **ne**, **neden**, **alternatif neden seçilmedi**.

---

## D1 — Yeni ürün ayrı klasörde kurulur, `seher/` silinmez

**Karar:** Yeni uygulama `sukun/` klasöründe sıfırdan kurulur. Mevcut `seher/`
olduğu gibi kalır ve yayına çıkabilir.

**Neden:** `seher/` çalışıyor, testleri yeşil, CI'da hem Android hem iOS
derleniyor ve mağazaya gönderilmeye hazır. Onu silmek doğrulanmış işi çöpe
atmak olurdu. İki ürün bir süre yan yana yaşar; yeni ürün olgunlaşınca
`seher/` arşivlenebilir.

**Alternatif:** `seher/` üzerine yazmak. Reddedildi: geri dönüşü olmayan kayıp,
kazancı yok.

---

## D2 — Expo SDK 57 + React Native 0.87 + TypeScript + expo-router

**Karar:** Uygulama Expo (managed → development build) üzerinde TypeScript ile
yazılır, yönlendirme `expo-router` ile dosya tabanlıdır.

**Neden:** Şartname widget, Live Activity, arka planda ses, indirilebilir ses
yönetimi ve 6.000+ âyetlik sanal listeler istiyor. Bunların hiçbiri tek dosyalık
bir WebView uygulamasında düzgün yapılamaz. Expo, native modül gerektiğinde
development build ile native koda açılır; saf RN'e göre kurulum, OTA güncelleme
ve CI tarafı çok daha az bakım ister.

**Alternatif:** Capacitor üzerinde devam. Reddedildi: Live Activities, widget ve
arka plan ses oynatıcısı için zaten native uzantı yazmak gerekecekti; o noktada
Capacitor'un tek avantajı kalmıyor.

---

## D3 — Depo kökündeki "tek dosya" kuralına belgelenmiş istisna

**Karar:** Kök `CLAUDE.md` madde 1 ("Ürün mantığı tek dosyada kalır") bu ürün
için geçerli değildir. Kural, `slot/latch/orbita/lull/seher` için aynen durur.

**Neden:** O kural, kullanıcının yazılımcı olmaması ve tek dosyayı kopyalayarak
güncelleyebilmesi için konmuştu. Bu şartnamedeki kapsam (Supabase, RLS, admin
paneli, native uzantılar, test piramidi) tek dosyaya sığmaz. Kuralın amacı
—kullanıcının ürünü tek başına sürdürebilmesi— burada **belgelenmiş kurulum ve
sürüm akışıyla** karşılanır.

**Sonuç:** Kök `CLAUDE.md` bu istisnayı yazacak şekilde güncellenir.

---

## D4 — Telifli dinî içerik lisans gelmeden yayınlanmaz

**Karar:** Kur'an-ı Kerim **Arapça metni** Tanzil Project'ten (verbatim
kopyalama izinli, atıf şartlı) içe aktarılır. **Meal, tefsir, hadis metinleri ve
kıraat kayıtları** lisans alınmadan depoya konmaz; şema, içe aktarma boruhattı,
doğrulama ve arayüz hazır edilir, veri yuvası boş kalır.

**Neden:** Şartnamenin kendi maddeleri bunu emrediyor (§73, §74, §75, §107):
kaynağı olmayan dinî içerik yayınlanamaz, AI âyet/hadis üretemez. Telifli
metni izinsiz taşımak ayrıca App Store 5.2 ve Play IP politikasında doğrudan
kaldırma sebebi ve geliştirici hesabının tamamını riske atar.

**Sonuç:** Bu, §103'teki "yayına hazır" kriterini **insan eylemine bağlı**
kılar. `KNOWN_ISSUES.md` ve `RELEASE_CHECKLIST.md` içinde açıkça izlenir.

---

## D5 — Durum yönetimi

**Karar:** İstemci durumu **Zustand**, sunucu durumu/önbellek **TanStack Query**,
kalıcı yerel depo **expo-sqlite** (Kur'an ve büyük veri) + **AsyncStorage**
(tercihler) + **expo-secure-store** (oturum anahtarları).

**Neden:** Kur'an metni ve arama indeksi ilişkisel ve büyüktür; AsyncStorage'a
sığdırmak hem yavaş hem bellek düşmanıdır. SQLite tam metin aramayı (FTS5) da
çözer (§78).

---

## D6 — Offline-first, Supabase ikincil

**Karar:** Uygulamanın çekirdeği (namaz vakti hesabı, Kur'an, dualar, zikir,
takipler) **internetsiz** çalışır. Supabase yalnız hesap, bulut yedeği, çoklu
cihaz eşitleme, topluluk ve admin içeriği için kullanılır.

**Neden:** Bu ürünün en güçlü farkı çevrimdışı çalışması. Namaz vaktini
sunucuya bağlamak, kategorinin en sık şikâyetini (vakit gelmiyor/yanlış) satın
almak demektir.

---

## D7 — Namaz vakti: hesap birincil, sağlayıcı ikincil

**Karar:** `PrayerTimesProvider` soyutlaması kurulur. **Birincil**: cihazda
astronomik hesap (güneş deklinasyonu + zaman denklemi), yöntem seçilebilir.
**İkincil**: ağ sağlayıcısı, yalnız kullanıcı isterse ve önbellekli.

**Neden:** `seher/` içinde bu hesap yazıldı, üç ayrı saat diliminde doğrulandı
ve bilinen değerlerle karşılaştırıldı. Çalışan ve sınanmış kod taşınır.

---

## D8 — Marka adı

> ⚠️ **BU KARAR GEÇERSİZ (deprecated).** Yerini D15 aldı: marka **BEŞ**.
> Aşağıdaki gerekçe tarihsel kayıt olarak duruyor.

**Karar:** Geçici marka **Sükûn**. Mağaza adı `Sükûn: Namaz Vakti ve Kur'an`.
Tümü `src/config/brand.ts` içinde tek noktadan yönetilir.

**Neden:** Ürün felsefesi "çok özellik, az karmaşa, huzurlu". "Sükûn" bunu
karşılıyor, Türkçede kolay okunuyor ve mağaza aramasında tekil. Mağaza adı ayrıca
aranan kelimeleri taşıyor.

---

## D9 — Yazı tipi: Latin sistem, Arapça Amiri

**Karar:** Türkçe/Latin arayüz **sistem yazı tipini** kullanır (iOS: San
Francisco, Android: Roboto). Arapça metin için **Amiri** ve **Amiri Quran**
paketle birlikte dağıtılır (`sukun/assets/fonts/`).

**Neden:** Sistem yazı tipi Dynamic Type ile tam uyumludur, Türkçe'ye özgü
harfleri eksiksiz taşır ve paket boyutunu büyütmez. Arapça'da ise sistem yüzü
yeterli değil: mushaf metninde hareke yerleşimi ve durak işaretleri özel
tasarım ister. Amiri her ikisini de karşılıyor ve **SIL Open Font License
1.1** altında; lisans metni OFL'nin şartı gereği
`assets/fonts/Amiri-OFL.txt` olarak birlikte dağıtılıyor.

**Sonuç:** Arapça metin `ArabicText` bileşeninden geçer; satır aralığı oranı
sabittir (harekeler üst satıra değmesin diye) ve sistem yazı ölçeği kapatılıp
kullanıcı ölçeği tek çarpan olarak uygulanır.

---

## D10 — Şema: içerik, kullanıcı, topluluk, AI ayrı katmanlar

**Karar:** Supabase şeması dört ayrı migration katmanında kurulur: içerik
(`0002`), kullanıcı (`0003`), topluluk (`0004`), AI (`0005`). Her tabloda RLS
açıktır ve politikası olmayan tablo kimseye görünmez.

**Neden:** İzinlerin karışması bu tür bir üründe en pahalı hatadır: bir dua
talebinin yazarını sızdırmak ya da bir kullanıcının yer imlerini başkasına
göstermek geri alınamaz. "Varsayılan reddet" bunu yapısal olarak engeller.

**Sonuç:** Şu üç kural şemada zorlanır, kod nezaketine bırakılmaz:
- Kaynağı olmayan dinî içerik giremez (`source_id` not null).
- Taslak metin son kullanıcıya görünmez (okuma politikasında `published` şartı).
- İstemci asistan yanıtı yazamaz (`ai_messages` insert politikası `role = 'user'`).

Akış anonimliği de görünüm düzeyinde korunur: uygulama `prayer_feed`
görünümünü okur, o görünümde `author_id` sütunu yoktur.

---

## D11 — Veritabanı doğrulaması yerelde çalışır

**Karar:** `bash sukun/tools/verify-db.sh` geçici bir PostgreSQL kümesi kurup
tüm migration'ları uygular, RLS davranış sınamalarını çalıştırır, sonra kümeyi
siler. Kalite kapısının (`npm run gate`) parçası değildir; PostgreSQL her
ortamda bulunmadığı için ayrı komuttur ve sunucu yoksa hata vermeden atlar.

**Neden:** RLS politikası "yazıldı" ile "çalışıyor" arasındaki fark, bu üründe
veri sızıntısı demek. Politikalar mutasyon sınamasıyla denetlendi: `bookmarks`
sahiplik politikası gevşetildiğinde ve taslak meal herkese açıldığında
sınamalar ikisini de yakaladı. Yakalamayan sınama, sınama değildir.

---

## D12 — v1 için Supabase'e gerek yok; içerik GitHub Pages'ten gelir

**Karar:** Yayınlanacak ilk sürüm **hesapsız ve sunucusuz** çalışır. Supabase
kurulmaz. İçerik güncellemeleri (dua, bilgi maddesi, dinî gün düzeltmesi)
GitHub Pages üzerinde yayınlanan statik bir JSON dosyasından alınır.
Şema, RLS ve eşitleme motoru silinmez — v2 için hazır bekler.

**Neden:** Sorulması gereken soru "Supabase iyi mi" değil, "v1'de hangi
özellik gerçekten sunucu istiyor" idi. Cevap:

| Özellik | Sunucu gerekir mi | v1'de var mı |
|---|---|---|
| Namaz vakti, kıble, Kur'an, meal, zikir, kaza, zekât, takvim | **Hayır** — hepsi cihazda hesaplanıyor | Var |
| Kıraat sesi | Hayır — CDN'den akıyor, hesap istemiyor | Var |
| İçerik güncellemesi (metin yenileme) | Hayır — statik dosya yeter | Var (GitHub Pages) |
| Çoklu cihaz eşitleme | Evet | Yok (v2) |
| Dua kardeşliği (topluluk) | Evet | Yok (v2) |
| AI asistan | Evet | Yok (v2) |
| Admin paneli | Evet | Yok (v2) |

Yani v1'in **tek bir özelliği bile** Supabase'e muhtaç değil.

**Supabase'i v1'den çıkarmanın somut kazançları:**

1. **Kişisel veri cihazdan çıkmıyor.** İbadet defteri, kaza sayacı, notlar,
   konum — hiçbiri sunucuya gitmiyor. KVKK/GDPR yükü, veri ihlali riski ve
   mağaza gizlilik formundaki soru sayısı buharlaşıyor. App Review'da
   "hesap açmadan kullanılabiliyor mu" sorusu kendiliğinden çözülüyor.
2. **Bakılacak sunucu yok.** Kullanıcı yazılımcı değil; gece 3'te düşen bir
   veritabanını kimse kaldıramaz. Supabase ücretsiz katmanı 7 gün hareketsiz
   kalınca projeyi duraklatır — uygulamanın kritik yolunda olsaydı, kimse
   kullanmadığı bir hafta sonunda uygulama ölürdü.
3. **Aylık gider yok.**
4. **Çevrimdışı tartışması bitiyor.** Ürünün en güçlü farkı zaten internetsiz
   çalışması; sunucuyu kritik yola koymak bu farkı kendi elimizle bozardı (D6).

**GitHub Pages neyi çözer, neyi çözmez:**

- **Çözer:** statik dosya yayını (ücretsiz CDN), uygulama güncellemesi
  beklemeden metin yenileme, sürüm numarasıyla geri alma.
- **Çözmez:** hesap, kimlik doğrulama, kullanıcıya özel kayıt, uygulamadan
  yazma, sunucu tarafı sır (AI anahtarı), moderasyon. Bunların hiçbiri statik
  dosyayla yapılamaz — GitHub Pages bir veritabanı değildir.

**Sonuç:** B5 (Supabase projesi) artık **yayını engelleyen bir madde değil**.
v2'de eşitleme/topluluk/AI istenirse `supabase/migrations/` olduğu gibi
uygulanır; eşitleme birleştirme motoru (FAZ 10) zaten yazılmış ve sınanmış
durumdadır.

---

## D13 — Elmalılı meali: kamu malı, paketle birlikte gelir

**Karar:** Türkçe meal olarak **Elmalılı Hamdi Yazır** (Hak Dini Kur'an Dili)
kullanılır, uygulama paketiyle birlikte dağıtılır ve çevrimdışı çalışır.

**Neden:** Mütercim 1942'de vefat etti. 5846 sayılı FSEK m.27 uyarınca koruma
süresi, ölümü izleyen yıldan itibaren 70 yıldır; süre 31.12.2012'de doldu.
Eser kamu malıdır ve lisans pazarlığı gerektirmez.

**Dikkat edilen nokta:** Kamu malı olan **eserin kendisidir**. Sonradan
yapılmış bir *sadeleştirme* ya da *yeniden düzenleme*, FSEK m.6 anlamında
işlenme eser sayılır ve kendi koruma süresine tabidir. Bu yüzden metin
Tanzil'in `tr.yazir` baskısından alındı, künyesi (mütercim adı, vefat yılı,
kaynak) uygulamada görünür tutuldu ve bir hak sahibi itirazı gelirse metnin
tek dosyadan değiştirilebilmesi için içe aktarma boruhattı ayrı yazıldı.

**Sonuç:** B1 kalktı. Meal modları, meal araması ve Günün Âyeti açıldı.

---

## D14 — Kıraat: akış ve isteğe bağlı indirme, paketle dağıtılmaz

**Karar:** Kıraat kayıtları **Islamic Network** CDN'inden akar
(`cdn.islamic.network`). Uygulama paketinde ses dosyası yoktur; kullanıcı
dilediği sureyi indirip çevrimdışı dinleyebilir.

**Neden:**

- Bir kıraatin 6236 âyeti 500 MB'ın üzerindedir; paketlenemez.
- Islamic Network şartları (Bölüm IV): kıraatler okuyucular ya da mirasçıları
  tarafından lisanslanmıştır; **akış, gömme ve indirme serbesttir**; ticari
  üründe kullanılabilir, telif okuyucularda kalır ve kaldırma talebi gelirse
  kaldırılır. Bölüm III ayrıca "kendi ucunuzda agresif önbellekleyin" diyor —
  cihaz indirmesi tam olarak bunu yapıyor.
- **QuranicAudio.com kullanılmadı:** şartlarında ticari kullanım açıkça
  yasak ("you may not use these files for commercial purposes"). Uygulama
  abonelikli olacağı için o kaynak elenmiştir.

**Okuyucu listesi ölçülerek üretildi.** `tools/probe-reciters.js` her
okuyucunun hangi bit hızında gerçekten dosya verdiğini sınar; elle yazılmış
bir liste bayatlar ve kullanıcı "ses gelmiyor" der. Sonuç: 18 okuyucu,
mükerrer baskılar ayıklanmış, hepsinin Türkçe adı yazılmış.

**Sonuç:** B4 kalktı.

---

## D15 — Marka: BEŞ, sembol: 5

**Karar:** Marka adı **BEŞ**, sembol özel çizilmiş bir **5**. Mağaza adı
`BEŞ – Ezan & Namaz Vakitleri`. Slogan *5 Vakit, Daima Yanında.* D10'daki
geçici "Sükûn" markası geçersizdir.

| | |
|---|---|
| Marka adı | BEŞ |
| Sembol | 5 (kâsesinde kubbe, iki minare, hilal) |
| Koyu tema ana rengi | Deep Emerald `#04211B` – `#004A3B` |
| Açık tema ana rengi | Warm Ivory `#F4EFE3` – `#FDFBF6` |
| Vurgu | Muted Gold `#C9A65A` |
| Motif | Rub'ül hizb — sekiz köşeli yıldız örgüsü, %5–6 opaklık |

**Neden BEŞ:** ilk çağrışım beş vakit namaz. Ad kısa, Türkçe, akılda kalıcı ve
**sahiplenilebilir** — "ezan vakti" jenerik bir arama terimidir, kimse onu
marka olarak sahiplenemez. Sembolün çift katmanlı okunması (önce rakam, sonra
siluet) markayı taklit edilebilir bir klişeden ayırır.

**Paket kimliği neden değişmedi:** `com.kusgrup.sukun` olduğu gibi kaldı.
Kimliği değiştirmek imzayı, App Store Connect kaydını ve kurulu uygulamaları
kırar; buna karşılık kazanç sıfırdır, çünkü paket kimliği kullanıcıya hiçbir
yerde görünmez. Yalnız kullanıcıya görünen alanlar değişti.

**Tek kaynak:** `sukun/tools/brand/mark.js` işaretin geometrisini, `tokens.ts`
paleti tutar. Rasterlar `node tools/gen-brand.js` ile üretilir; hiçbir görsel
elle çizilip depoya konmaz. Ayrıntı: `sukun/BRAND_GUIDELINES.md`.

---

## D16 — Marka varlıkları dışarıdan verilen pakettir

> **GEÇERSİZ — yerine D17 geçti.** Bu karar paketin **SVG** dosyalarını kaynak
> ilan ediyordu. Marka sahibi o SVG'lerin onaylanan logonun elle yapılmış
> yaklaşık rekonstrüksiyonları olduğunu ve marka tasarımını bozduğunu
> bildirdi. Kayıt olarak duruyor; uygulanan kural D17'dir.

**Karar:** BEŞ logosu, sembolü, deseni ve renkleri `sukun/assets/brand/`
altındaki **verilen paketten** gelir. Depo bu logoyu çizmez, izlemez, yeniden
üretmez, bir görüntü üretecine vermez. Paketin kendi kuralları
`assets/brand/docs/CLAUDE_HANDOFF.md` içindedir ve `BRAND_GUIDELINES.md`'den
önce gelir.

**Neden:** D15'te işareti bu depoda çizmiştik (`tools/brand/mark.js`). Marka
sahibi kendi tasarımını gönderdi; bir markanın iki kaynağı olamaz. Üretilen
çizim kaldırıldı, `gen-brand.js` artık yalnız verilen SVG'leri platformun
beklediği adlara **rasterler**.

**İki teknik uyarlama** (ikisi de paketin kendi maddesi):

1. iOS ikonunda zemin dikdörtgeninin `rx="220"` köşe yarıçapı üretim anında
   sıfırlanır (kural 3). Apple kendi maskesini uyguluyor; iki yuvarlama üst
   üste binince köşelerde açık renk bir hâle kalıyor. Sembole dokunulmaz,
   kaynak dosya değişmez.
2. Android ön katmanının arkası paketin Deep Emerald'ıyla doldurulur (kural 4).

**Paketteki PNG'ler ikon üretiminde kullanılmadı.** İki sebeple: SVG'lerden
farklı bir çizim taşıyorlar ve etraflarında pişmiş beyaz kenar boşluğu ile
gölge var — uygulama ikonu tam kanar olmalıdır. Paketin kendi belgesi de
SVG'leri kaynak ilan ediyor. PNG'ler referans olarak depoda duruyor.

**Yan etki — `accent` ikiye ayrıldı.** Paketin Deep Emerald'ı (`#003F32`) koyu
tema zemini olunca hero kartı nane yeşiline dönüştü: tek `accent` token'ı hem
dolgu yüzeyi hem ön plan vurgusu olarak kullanılıyordu ve koyu temada bu ikisi
ters yön ister. `accentSurface` eklendi; kontrast sınaması ikisini ayrı ayrı
ölçüyor.

## D17 — Logonun tek kaynağı bitmiş master PNG'dir

**Karar:** BEŞ logosu yalnız iki dosyadan gelir:

```
sukun/assets/brand/png/BES_AppIcon_Dark_1024.png
sukun/assets/brand/png/BES_AppIcon_Light_1024.png
```

Bu depoda logo **çizilmez**: vektör yolu üretilmez, yazı tipiyle "5" yazılmaz,
cami/minare/hilal kurulmaz, logo CSS ya da React Native/SVG ile yeniden
yaratılmaz. Logonun geometrisi hiçbir koşulda değişmez; ölçeklerken yalnız
en-boy oranı korunur.

**Neden:** D16 paketin SVG'lerini kaynak seçmişti ve üretilen ikonlar marka
tasarımını bozdu — o SVG'ler onaylanan logonun **yaklaşık
rekonstrüksiyonlarıydı**. Bir markanın tek bir doğrusu olur; o doğru, marka
sahibinin teslim ettiği bitmiş rasterdir. Elle çizilmiş `assets/brand/svg/`
klasörü (on dosya) ve ondan türeyen desen PNG'leri depodan kaldırıldı.

**`tools/gen-brand.js`'in yaptığı iş üçle sınırlı, üçü de geometriye dokunmaz:**

1. **Kırpma.** Master, logoyu kâğıt üzerinde sunan bir kompozisyon: kutucuğun
   çevresinde ince açık zemin ve yumuşak gölge var. Launcher ikonu tam kare ve
   taşmalı olmak zorunda olduğundan kutucuğun kenarı ölçülür, sunum çerçevesi
   atılır.
2. **Ölçekleme.** Yalnız en-boy oranı korunarak; kısa kenar doldurulur, uzun
   kenardan simetrik kırpılır. Hiçbir yönde esnetme yok — `brand.test.ts` bunu
   masterın oranıyla karşılaştırarak ölçüyor.
3. **Alfa ayıklama.** Şeffaf sembol, tek renk siluet ve Android ön planı
   masterın kendi piksellerinden parlaklık eşiğiyle ayrılır. Şekil masterın
   şeklidir.

**Üç teknik uyarlama, üçü de platformun dayattığı şey:**

- **iOS ikonunda köşe yuvarlaması giderilir.** Master kutucuğu yuvarlak köşeli;
  Apple kendi maskesini uyguluyor ve iki yuvarlama üst üste binince köşede açık
  renk bir hâle kalıyor. Köşe, kutucuğun kenar piksellerinin ışınsal
  uzatılmasıyla doldurulur; logoya değmez. Çıktı alfasız (colorType 2) yazılır,
  çünkü Apple saydam ikon kabul etmiyor.
- **Android tek renk yüzeyleri** (bildirim küçük ikonu, Android 13 temalı ikon)
  işletim sisteminin zorunlu kıldığı **tek istisnadır**: oraya renk taşınamaz,
  masterdan çıkarılan siluet konur.
- **Android uyarlanabilir ikon** güvenli daireye göre ölçeklenir. Sınırlayıcı
  dikdörtgeni %66'ya oturtmak yetmedi: "5"in üst kanadı ile alt kâsesi köşelere
  uzandığı için piksellerin %1,5'i dairenin dışında kalıyordu. Ölçü artık
  merkezden en uzak opak piksel; sonuç görünen dairenin %85'i kadar bir logo.

**Arayüzdeki geometrik motif logo değildir.** `src/ui/motif/patterns.ts`
içindeki sekiz köşeli yıldız ve örgü, İslam sanatının ortak dilinden gelen bir
yüzey dokusudur; marka işareti taşımaz ve logo yerine geçmez.

## D18 — Uygulamanın renkleri logodan ölçülür

**Karar:** Bütün marka renkleri, paketin "önerilen değerleri" yerine
`sukun/assets/brand/png/BES_AppIcon_{Dark,Light}_1024.png` masterlarının
**piksellerinden ölçülerek** alınır. Ekran zemini ve marka kartı düz renk
değil, logonun kendi inişini taşıyan birer gradyandır.

**Neden:** Kullanıcı bildirdi: *"logonun arka fondaki yeşil rengi çok güzel
fakat uygulamadaki o kadar iyi değil, daha basit duruyor. Ayrıca logodaki 5
sayısının rengi de uygulama içindeki arka fon rengi ile uyuşmuyor."* Ölçünce
ikisi de doğru çıktı:

- Paketin `deepEmerald`i `#003F32`. Masterın zemini ise `#000D08`–`#042B21`
  arasında bir gradyan, ortancası `#011D13`. Yani uygulama, zengin bir
  gradyanın **en açık dilimini** alıp bütün ekrana düz sürüyordu.
- Paketin `mutedGold`u `#D6B46A`; masterın altını `#A88652`–`#F6E5C8`
  rampası, ortancası `#D3B685`. Uygulamanınki daha sarı ve daha doygundu,
  logonun şampanya altınıyla yan yana durmuyordu.

**Ne değişti:**

1. Palet ölçülen değerlerle yeniden kuruldu (zümrüt, altın, fildişi, metin).
   `ink900` bile artık açık masterdaki figürün rengi: gövde metni nötr bir
   gri-siyah değil, markanın koyu yeşili.
2. `backgroundGradient` ve `accentGradient` rolleri eklendi; `Screen` ve
   `Card accent` arkalarına `react-native-svg` ile o inişi çiziyor.
   (`expo-linear-gradient` yalnız bunun için eklenmedi — motif katmanı zaten
   aynı motoru kullanıyor.)
3. **Hero kartı iki temada da ikonun koyu zümrüdü.** Açık temada bile:
   fildişi sayfa + koyu zümrüt kart + altın sayı = logonun kendisi.
4. `onAccentHighlight` ve `onAccentBorder` rolleri eklendi. Altın, zümrüdün
   üstünde iki temada da aynıdır; açık temanın fildişi zemine göre
   koyulaştırılmış altını (`highlight`) zümrüt kartta 2,25:1'e düşüyor ve
   geri sayım halkası kayboluyordu.
5. Üç geri sayım halkası (ana sayfa, zikirmatik, Ramazan) bu rollere geçti.
   Zikirmatikte ilerleme de yatak da fildişiydi; sayaç ilerlemiyormuş gibi
   duruyordu.
6. `app.config.ts` açılış ve Android maske renkleri paletten gelir; sınama
   ikisinin ayrışmasını yakalıyor (ayrışırlarsa açılıştan ana ekrana geçerken
   renk sıçraması görünür).

**Yol boyunca çıkan gerçek hata:** Yirmi beş ekran kendi başlığını açıyor
(`headerShown: true`) ve kök yığın başlığı temalamıyordu. React Navigation
kendi varsayılanını kullandığı için **koyu temada sayfanın üstünde bembeyaz
bir şerit** duruyordu. Başlık artık gradyanın üst durağını alıyor;
`finalAudit.test.ts` hem kökün temalamasını hem de hiçbir ekranın kendi
başlık rengini yazmamasını denetliyor.

**Sınama:** `brand.test.ts` masterı her çalıştığında yeniden ölçüp on bir
palet değerini kanal başına 2 birim toleransla karşılaştırıyor ve paketin
önerdiği düz değerlerin geri dönmediğini denetliyor. `contrast.test.ts` artık
gradyanın **iki ucunu da** ölçüyor: yalnız ortalama renge bakmak sayfanın
altındaki koyu/açık ucu gözden kaçırıyordu.

## D19 — "Eşitleme" yerine yerel yedek dosyası

**Karar:** Cihazlar arası eşitleme v1'de yok ve v2'ye erteleniyor (D12). Onun
yerine kullanıcıya **yedek dosyası** verildi: Hesap ekranından bütün kişisel
kaydı tek bir JSON dosyasına aktarabiliyor ve başka bir cihazda geri
yükleyebiliyor. Dosya hiçbir yere gönderilmiyor; sistemin paylaşım tepsisine
veriliyor, nereye koyacağına kullanıcı karar veriyor.

**Neden:** "Eşitleme istiyorum" cümlesinin arkasındaki gerçek ihtiyaç ikisi —
*kayıtlarımı kaybetmeyeyim* ve *yeni telefona taşıyayım*. İkisi de sunucu
istemez. Sunucu istemek ise hesap, kimlik doğrulama ve kişisel verinin
cihazdan çıkması demek; ürünün en güçlü tarafını (hiçbir şeyin cihazdan
çıkmaması, "Veri Toplanmıyor" gizlilik etiketi) kendi elimizle bozardık.
Gerçek çok cihazlı eşitleme — iki telefonu sürekli aynı tutmak — hâlâ v2'de ve
hâlâ Supabase istiyor.

**Birleştirme kuralları** (`src/features/backup/backup.ts`, saf ve Node'da
sınanabilir; dosya işleri `file.ts` içinde):

| Veri | Kural | Neden |
|---|---|---|
| Konum, yer imi, zikir oturumu, hatırlatıcı | kimlik birliği, daha yeni kazanır | hiçbir kayıt kaybolmaz |
| Favori | kimlik birliği, **ilk** eklenme anı korunur | "3 yıldır favorimde" bilgisi değerlidir |
| Hatim | okunan cüzler **birleşir** | son yazan kazanırsa okunmuş cüz silinir |
| İbadet defteri | gün gün birleşir; namaz kaydı korunur, Kur'an dakikası ikisinin büyüğü, boş not yedekten dolar | bir cihazdaki kayıt yutulmaz |
| Kaza sayacı, ayarlar, ana sayfa düzeni | cihaz **boşsa** yedekten, doluysa cihazınki | aşağıda |

**Sayaçlar neden birleştirilmiyor.** Kaza sayacının ortak atası yok: iki
telefonda da kaza kılınmışsa "topla" da "en büyüğü al" da yanlış sonuç verir.
`qadaHistory` bir günlük ama 200 kayıtla sınırlı ve `setQada` oraya yazmıyor,
yani sayacı geçmişten yeniden hesaplamak da güvenli değil. Bu yüzden kural
açık tutuldu: cihaz hiç kullanılmamışsa (sayaçlar sıfır, geçmiş boş, oturum
yok, defter boş, yer imi yok) yedekten alınır — *yeni telefon* durumu budur.
Cihazda veri varsa cihazınki korunur ve kullanıcıya ekranda böyle söylenir.
Tam kontrol isteyen için ikinci kip var: **"Yedeği yerine koy"** her şeyi
yedekten yazar.

**Reddedilen dosyalar ayrı ayrı anlatılır:** bozuk JSON, başka uygulamanın
dosyası, şemaya uymayan içerik ve **daha yeni bir sürümden gelen yedek**.
Sonuncusu önemli: bilmediğimiz alanları olan bir yedeği yarım uygulamak
sessiz veri kaybıdır; kullanıcıya "önce uygulamayı güncelle" denir.

**Yol boyunca çıkan hata:** `profile.guestBody` metni "hesap açarsan
favorilerin ve ilerlemen cihazlar arasında eşitlenir" diyordu. Hesap da
eşitleme de yok; olmayan bir özelliği vaat etmek hem yanlış hem de mağaza
incelemesinde ret sebebi. Metin gerçeği söyleyecek biçimde düzeltildi.
