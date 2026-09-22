# Lull — yayına çıkış listesi

Sırayla git. Solundaki kutu senin yapman gerekeni gösterir.
Yazılım tarafı bitti; kalan her şey hesap, imza ve gönderim işi — bunlar senin kimliğinle yapılır.

---

## AŞAMA 0 — İki karar (10 dakika)

### 0.1 · Depo ve isim
Uygulama şu an `kusgrupgames.github.io` deposunda `lull/` klasöründe. Kendi deposuna taşı:

```bash
bash tools/extract-repo.sh ~/lull-game
```

Sonra GitHub'da **`lull-game`** deposunu aç (public), uzak adresi ekle ve gönder.
Mağaza adı **`Lull: Breathe Yourself Down`** olsun; tek başına "Lull" aramada kaybolur.
Göndermeden önce her iki mağazada "lull" aratıp çakışma var mı bak. İsim değişimi
tek yerden yapılır: `app.config.json` + `bash tools/set-identity.sh`.

### 0.2 · Hesap türü: **ŞAHIS** (karar verildi)

Kayıt gerçek kişi olarak yapılacak. Bu kararın dört somut sonucu var, üçü
lehine, biri takvimi belirliyor:

- **Türkiye dağıtıma DAHİL.** Kurumsal yolun KVK 10/1-g "münhasıran yurt dışına
  hizmet" şartı artık geçerli değil, dolayısıyla Türkiye'yi çıkarmak için bir
  sebep kalmadı. `store/*.md` bu karara göre güncellendi.
- **D-U-N-S numarası gerekmiyor** → Apple kaydı 1-3 hafta yerine 1-3 günde açılır.
- **Ad ve adres mağaza sayfasında görünür.** Play, gerçek kişi geliştiriciden
  herkese açık bir adres istiyor. Ev adresini yazmak istemiyorsan kayıttan
  **önce** bir sanal ofis/PTT kutusu adresi ayarla; sonradan değiştirmek
  doğrulamayı baştan tetikliyor.
- **Play'de 12 testçi × 14 gün kapalı test şartı var** (yeni gerçek kişi
  hesapları için, hesap başına tek sefer). Üretime çıkmadan önce 12 kişinin
  kapalı teste katılıp 14 gün **kesintisiz** kalması gerekiyor. Takvimi belirleyen
  madde budur → AŞAMA 1'de testçi toplamaya bugün başla.

> **Vergi:** GVK mük. 20/B ile %15 banka stopajı nihai vergi olur, 2026 sınırı
> 5.300.000 TL — aşarsan istisna geriye dönük tamamen kalkar. İstisnadan
> yararlanmak için uygulama gelirinin elektronik uygulama mağazaları üzerinden
> elde edilmesi ve kazancın istisna kapsamında beyan edilmesi gerekir.
> **Bu bir vergi tavsiyesi değil; ilk gelir gelmeden muhasebecinle teyit et.**

- Karar verildiği için **1-3 arası adımların hepsi yapılabilir**; hiçbiri beklemede değil.

---

## AŞAMA 0.3 · SAĞLIK UYGULAMASI OLMANIN GETİRDİKLERİ

Lull oyun değil; **Sağlık ve Fitness** kategorisinde. Bu üç şeyi değiştirir:

- [ ] **Kategori**: Play → Sağlık ve Fitness · App Store → Health & Fitness
- [ ] **Tıbbi sorumluluk reddi** mağaza açıklamasının içinde olmalı — yalnızca
      gizlilik sayfasında olması yetmez. Metinler `store/*.md` içinde hazır.
- [ ] **Sağlık iddiası yapma.** "Uykusuzluğu tedavi eder", "anksiyeteyi geçirir"
      gibi cümleler mağaza reddi sebebidir. "Gevşemene yardımcı olur" de.
- [ ] Apple, sağlık kategorisinde **App Review notunda** ne olduğunu açıkça
      sorabiliyor; not `store/app-store.md` içinde yazılı.
- [ ] Abonelik ürünlerini (`lull_plus_*`) **henüz oluşturma** — karşılığındaki
      özellikler yazılmadı. Boş abonelik satmak hem yanlış hem reddedilir.


## AŞAMA 1 — Hesaplar (paralel yürüt, bekleme süresi burada)

- [ ] Apple Developer Program kaydı (99 $/yıl) · organization ise D-U-N-S numarası
- [ ] Google Play Console kaydı (25 $ tek sefer)
- [ ] ~~AdMob~~ — **Lull için gerekmiyor.** Uygulama reklamsız; AdMob hesabı
      açmana, ödeme profili doldurmana veya doğrulama PIN'i beklemene gerek yok.
      (Diğer üç oyun için gerekli, Lull için değil.)
- [ ] Apple: Agreements, Tax and Banking → Paid Apps sözleşmesi + banka + vergi formları (**W-8BEN-E** kurumsal / **W-8BEN** şahıs)
- [ ] Google Play: Ödemeler profili + vergi bilgileri
- [ ] `bash tools/extract-repo.sh ~/lull-game` ile kendi deposuna taşı, GitHub'a gönder
- [ ] GitHub → Settings → Pages → Source: `main` / `docs` → gizlilik sayfaları yayına girer
- [ ] Yayına giren adresi doğrula: `https://kusgrupgames.github.io/lull/privacy.html` açılıyor mu?
- [ ] Aynı sayfa **stilli** mi görünüyor? (Depoda `docs/.nojekyll` var; olmazsa Jekyll `_style.css` dosyasını yayınlamaz ve sayfalar çıplak HTML olarak açılır.)

### 1b · Play kapalı test grubu (ŞAHIS hesabın zorunlu şartı)

- [ ] **12 testçi bul** — arkadaş, aile, iş arkadaşı olabilir; hepsinin ayrı bir
      **Google hesabı** olması ve testi **kabul etmesi** gerekiyor
- [ ] Play Console → Test → Kapalı test → e-posta listesi oluştur (12+ kişi)
- [ ] Testçilere opt-in bağlantısını gönder, katıldıklarını **teyit et**
      (katılmayan sayılmıyor; sayı 12'nin altına düşerse 14 gün baştan başlar)
- [ ] 14 günü başlat ve **kesintisiz** tamamla
- [ ] **Takvimi belirleyen madde budur** — başka beklenecek hiçbir şey yok

> **Sayılan şey kayıtlı kişi sayısı, oynama sayısı değil** — kimsenin her gün
> oynaması gerekmiyor, 14 gün listede kalması yeterli. Hazır davet mesajları ve
> pratik ayrıntılar: depo kökündeki `TESTCI-DAVETI.md`.

> Üç uygulama için ayrı ayrı değil, **hesap başına bir kez**. İlk oyunda tamamlarsan
> diğer ikisi doğrudan üretime çıkabilir.

---

## AŞAMA 2 — ~~Reklam ve satın alma kimlikleri~~ → **bu aşama Lull'da YOK**

Lull v1 **reklamsız ve tamamen ücretsizdir.** Yapılacak hiçbir şey yok; bu bir
eksiklik değil, bilinçli bir ürün kararı:

- Amacı seni uyutmak olan bir uygulamada seans sonunda reklam göstermek ürünü yok eder.
- Reklam olmayınca **ATT izin istemi** çıkmaz, **AD_ID izni** istenmez → Veri
  Güvenliği formunda dürüstçe "hiçbir veri toplanmıyor" denebilir. Play, AD_ID
  izniyle "veri toplamıyorum" beyanını doğrudan **çelişki** olarak işaretliyor.
- İnceleme daha hızlı geçer, gizlilik metni kısalır, kullanıcı yorumu iyileşir.

`app.config.json` içinde `admob.enabled: false` ve `iap.enabled: false` yazılı;
native hazırlık betikleri bu bayrakları okuyup izinleri ve SDK anahtarlarını
**hiç eklemiyor**. Tek yapman gereken:

- [ ] `node tools/check.js` → "Hata yok, 0 uyarı" görmeden devam etme
- [ ] Abonelik (`lull_plus_*`) ürünlerini **oluşturma** — karşılığı henüz yazılmadı

---

## AŞAMA 3 — Derleme

- [ ] `npm install`
- [ ] `npx cap add android && npx cap add ios && npx cap sync`
- [ ] `native/android.md` adımlarını uygula (simgeler, Manifest, imza anahtarı, versionCode)
- [ ] **İmza anahtarını (`lull-release.jks`) ve parolasını yedekle.** Kaybedersen uygulamayı bir daha güncelleyemezsin.
- [ ] `native/ios.md` adımlarını uygula (Info.plist, In-App Purchase capability, sadece iPhone, portrait)
- [ ] Gerçek Android cihazda test: **hiçbir reklam ve hiçbir izin istemi çıkmamalı**
- [ ] Gerçek iPhone'da test: **ATT istemi ÇIKMAMALI** (çıkıyorsa reklam kodu sızmış demektir)
- [ ] Tam bir 9 dakikalık seans yap: ekran seans boyunca **kapanmamalı** (keepAwake)
- [ ] Uçak modunda aç: uygulama tam çalışmalı (offline vaadi mağaza metninde yazıyor)
- [ ] Küçük ekranda (SE) ve büyük ekranda (Pro Max) halka ve yazılar üst üste binmiyor mu?
- [ ] Sesi kapat/aç, uygulamadan çıkıp geri gel: ikinci seansta **ses geliyor mu?**

---

## AŞAMA 4 — Mağaza gönderimi

### Google Play
- [ ] Uygulama oluştur → ad: `Lull: Breathe Yourself Down`
- [ ] Mağaza girişi: `store/google-play.md` içindeki metinleri yapıştır
- [ ] Grafikler: `assets/icon-512.png`, `assets/feature-graphic-1024x500.png`, `assets/screenshots/android-*.png`
- [ ] Veri güvenliği formu: `store/data-safety.md`
- [ ] İçerik derecelendirme: `store/content-rating.md`
- [ ] Hedef kitle: **13+** (13 yaş altını seçme)
- [ ] Reklam içeriyor: **Hayır** · Uygulama içi satın alma: **Hayır**
- [ ] Kategori: Health & Fitness
- [ ] Ülkeler: **Türkiye dahil tüm ülkeler** (şahıs hesabında kısıt yok)
- [ ] AAB yükle → Kapalı test → sonra Üretim

### App Store
- [ ] App Store Connect → Yeni uygulama → bundle id `com.kusgrupgames.lull`
- [ ] Metinler: `store/app-store.md`
- [ ] Ekran görüntüleri: `assets/screenshots/ios69-*.png` (6.9") veya `ios65-*.png` (6.5") — App Store Connect hangi slotu gösteriyorsa
- [ ] App Privacy: `store/app-privacy.md`
- [ ] IDFA beyanı: **No** (uygulama IDFA'ya hiç dokunmuyor)
- [ ] App Review notlarını yapıştır (`store/app-store.md`) — kontrol şeması ilk paragrafta
- [ ] GitHub → Actions → **iOS yayin** → uygulamayı seç → Run workflow
      (Mac gerekmez; imzalar, IPA üretir, App Store Connect'e yükler.
      Önce dört Apple secret'ı girilmiş olmalı — `native/ios.md` bölüm 6)
- [ ] Build işlendikten sonra (5-30 dk) sürüme ekle → Gönder

---

## AŞAMA 5 — İçerik (onay beklerken yap, boşa bekleme)

- [ ] Telefonda tam bir seans yap, ekran kaydı al (`marketing/tiktok-reels.md` adım listesi)
- [ ] 15 videoyu CapCut'ta kes
- [ ] TikTok + Instagram hesaplarını aç, bio'ya link koy
- [ ] İlk gün 2 TikTok + 1 Reels + 2 story (takvim `marketing/tiktok-reels.md` sonunda)
- [ ] Her videoya kendi sabit yorumunu at


---

## AŞAMA 6 — Yayın sonrası ilk 14 gün

- [ ] Gün 1-3: yorumların hepsine cevap ver (ilk saat en kritik)
- [ ] Gün 7: Play Console → İstatistikler → **1. gün elde tutma** oranına bak
- [ ] Gün 14 kararı:
  - D1 > **%30** ve ortalama oturum > 3 dk → **büyüt** (yeni şekil, günlük hedef, içerik dalgası)
  - D1 < **%20** → **dur**, içerik üretmeyi kes, sıradaki oyuna geç (uygulama mağazada kalsın)
- [ ] Bir video 100 bin izlenmeyi geçerse 72 saat içinde güncelleme çıkar

---

## Yayından önce son kontrol

```bash
node tools/check.js
```

| Kontrol | Neden önemli |
|---|---|
| Kodda reklam köprüsü yok | Reklamsız beyan ettik; kod sızarsa mağaza beyanı yalan olur (`check.js` denetler) |
| `AD_ID` izni Manifest'te yok | Play, "veri toplamıyorum" beyanıyla bu izni **çelişki** sayıp reddediyor |
| Gizlilik URL'si açılıyor | Her iki mağaza da erişilemeyen URL'yi reddeder |
| `versionCode` artırıldı | Aynı numarayla ikinci kez yükleme yapılamaz |
| İmza anahtarı yedeklendi | Kaybı geri dönüşü olmayan tek hatadır |
| Self-test 3 sürede de yeşil | Tempo **inmeli** (artmamalı), veriş/alış oranı 1'in altına düşmemeli, seans tam süresinde bitmeli |

## Bilinen riskler (dürüst liste)

1. **İsim.** "Lull" yaygın bir İngilizce kelime (dinginlik, uyutmak). Kumar çağrışımı
   yok ama **mağaza aramasında kaybolabilir** ve aynı adla yayınlanmış başka bir
   uygulama olabilir. Çözüm: mağaza adı `Lull: Breathe Yourself Down`. Gönderimden
   önce her iki mağazada "lull" aramasını kendin yap.
2. **İlk uygulama incelemesi uzun sürer.** Apple'da ilk gönderim 1-3 gün, bazen daha fazla.
3. **v1'de gelir yok.** Reklamsız ve ücretsiz çıkıyor; ilk sürümün işi kullanıcı
   ve yorum toplamak. Gelir `lull_plus_*` aboneliğiyle, karşılığı yazıldıktan sonra gelir.
4. **Sağlık kategorisi incelemeyi sıkılaştırır.** Tıbbi iddia içermediğinden emin ol;
   metinler `store/*.md` içinde buna göre yazıldı.
5. **Abonelik ürünleri henüz boş.** `lull_plus_*` karşılığındaki özellikler yazılmadan
   mağazada oluşturulmamalı.
