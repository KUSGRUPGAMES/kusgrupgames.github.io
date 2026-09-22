# Hesap açma kiti — tek oturumda bitir

Bu üç kayıt **senin kimliğinle, bizzat** yapılır; devredilemez. Ama hazırlıklı
girersen 40 dakikada biter.

**Takvimi belirleyen tek madde: Play'in 12 testçi × 14 gün kapalı test şartı.**
Diğer her şey onun yanında kısa sürüyor, o yüzden Play Console'u ve testçi
davetlerini mümkün olan en erken günde başlat.

> **AdMob PIN'i hakkında yaygın yanlış:** PIN "istenmez". Google adres doğrulama
> PIN'ini kendiliğinden, ancak **kazancın 10 dolara ulaştığında** postalar — yani
> uygulamalar yayınlanıp para kazanmaya başladıktan sonra. Posta 2-4 hafta sürer,
> ama bu **yayına değil, paranın hesabına geçmesine** engeldir. Yayın öncesi
> yapılacak iş PIN beklemek değil, **ödeme profilini tamamlamaktır**.

## Yayıncı kimliği — her üç konsolda da aynı

| | |
|---|---|
| Yayıncı adı | **KUS GRUP GAMES** |
| Paket kimliği kalıbı | `com.kusgrupgames.<ürün>` |
| E-posta | `kusgrupgames@gmail.com` |
| Site | `https://kusgrupgames.github.io/<ürün>` |

Kısaltma yok: `com.kusgrup.` biçimi bir kez yazıldı, "games" düşüyordu ve
diğer kimliklerle çelişiyordu (DECISIONS D23). Paket kimliği yayından sonra
**değiştirilemez**; konsola girmeden önce bu tablodan kopyala.

> **Şahıs hesabında yayıncı adı kendiliğinden KUS GRUP GAMES olmaz.**
> - **Play Console:** geliştirici adını sen yazıyorsun — kayıt sırasında
>   doğrudan `KUS GRUP GAMES` gir.
> - **App Store:** "Individual" üyelikte Apple **yasal adını** gösterir.
>   `KUS GRUP GAMES` yazması için üyelik onaylandıktan sonra App Store
>   Connect → **Business** → *Legal Entity Name* alanından ad değişikliği
>   talebi açman gerekir. Bunu kayıt gününde başlat; sonradan hatırlamak zor.

---

## Başlamadan önce masada olsun

- [ ] Kimlik (kendin için, kimseye göndermeden — sadece doğrulama ekranına)
- [ ] Kredi/banka kartı (Apple 99 $/yıl, Play 25 $ tek sefer)
- [ ] **IBAN** ve banka adı (AdMob ödemeleri için)
- [ ] Fatura/ikamet adresi — AdMob doğrulama PIN'i ileride **bu adrese**
      postalanacak, doğru yaz
- [x] Hesap türü kararı: **ŞAHIS** (gerçek kişi) — verildi
- [ ] **Mağazada görünecek adres.** Play, gerçek kişi geliştiriciden herkese açık
      bir adres istiyor. Ev adresini yazmak istemiyorsan **kayıttan önce** sanal
      ofis / PTT kutusu ayarla; sonradan değiştirmek doğrulamayı baştan tetikler.

---

## 1) AdMob (10 dk — sonrası bekleme değil)

1. admob.google.com → Google hesabınla giriş
2. Ülke: Türkiye · Saat dilimi · Para birimi seç (**para birimi sonradan değişmez**)
3. Ödemeler → **ödeme profilini tamamla** (ad, adres, IBAN) ← *atlamadan yap:*
   *AdMob ana sayfasındaki kırmızı bant bunu istiyor ve tamamlanmadan uygulamalar*
   *inceleme aşamasında takılı kalıyor.* PIN bu adımda gelmez; kazanç 10 doları
   bulunca kendiliğinden postalanır.
4. Vergi bilgileri: şahıssan **W-8BEN**, şirketse **W-8BEN-E**
5. Uygulama ekle → **Android** ve **iOS** için ayrı ayrı, üç oyun için altı kayıt:

| Oyun | Android app | iOS app | Reklam birimleri |
|---|---|---|---|
| Slot | com.kusgrupgames.slot | com.kusgrupgames.slot | Interstitial + Rewarded |
| Latch | com.kusgrupgames.latch | com.kusgrupgames.latch | Interstitial + Rewarded |
| Orbita | com.kusgrupgames.orbita | com.kusgrupgames.orbita | Interstitial + Rewarded |

> Uygulamalar henüz mağazada olmadığı için "Hayır, yayında değil" seçeneğini işaretle.
> Her uygulama için **App ID** + **Interstitial ID** + **Rewarded ID** üretilecek:
> oyun başına 6, toplam **18 kimlik**. Hepsini bana ver, dosyalara ben yazarım.

## 1b) Play kapalı test grubu — bugün başlat (şahıs hesabının zorunlu şartı)

Gerçek kişi hesaplarında üretime çıkmadan önce **12 testçi × 14 gün kesintisiz**
kapalı test şartı var (hesap başına bir kez; ilk oyunda tamamlarsan diğer ikisi
doğrudan çıkar). **Takvimi belirleyen madde budur** — AdMob tarafında beklenecek
bir şey yok, o yüzden bu 14 günü mümkün olan en erken gün başlat.

- [ ] 12 kişi bul (her birinin ayrı Google hesabı olmalı ve daveti kabul etmeli)
- [ ] Play Console → Test → Kapalı test → e-posta listesi
- [ ] Opt-in bağlantısını gönder, katıldıklarını **teyit et**
      (sayı 12'nin altına düşerse 14 gün baştan başlar)

## 2) Google Play Console (15 dk + 1-2 gün doğrulama)

1. play.google.com/console → **25 $** tek seferlik ödeme
2. Hesap türü: **Kendim (şahıs)**
3. Kimlik doğrulama: kimlik yükleme + adres belgesi istenebilir
4. Ödemeler profili + vergi bilgileri
5. Uygulama oluştur (üç kez) — adlar:
   - `Slot: Fit the Shape`
   - `Latch: One Tap Swing`
   - `Orbita: One Tap Orbit Jump`

## 3) Apple Developer (20 dk + 1-3 gün, şirketse D-U-N-S 1-3 hafta)

1. developer.apple.com/programs → **99 $/yıl**
2. Hesap türü: **Individual** — **D-U-N-S gerekmiyor**, kayıt 1-3 günde açılır
3. Kimlik doğrulama (Apple ID + iki adımlı doğrulama şart)
4. Agreements, Tax and Banking → **Paid Apps** sözleşmesi + banka + vergi formu
5. App Store Connect → yeni uygulama (üç kez), bundle id'ler yukarıdaki tabloda

---

## Her üç kayıtta da soracakları ortak bilgiler

| Alan | Değer |
|---|---|
| Destek e-postası | `kusgrupgames@gmail.com` |
| Web sitesi | `https://kusgrupgames.github.io` |
| Gizlilik – Slot | `https://kusgrupgames.github.io/slot/privacy.html` |
| Gizlilik – Latch | `https://kusgrupgames.github.io/latch/privacy.html` |
| Gizlilik – Orbita | `https://kusgrupgames.github.io/orbita/privacy.html` |
| Kategori | Games → Arcade |
| Yaş hedefi | 13+ (13 yaş altını seçme) |
| Ülke dağıtımı | Tüm ülkeler, **Türkiye dahil** |
| Reklam içeriyor | Evet |
| Uygulama içi satın alma | Evet — `remove_ads`, tek seferlik, ~2,99 $ |

---

## Bittiğinde bana ver, gerisi bende

18 AdMob kimliğini gönder; ben `app.config.json` dosyalarına yazar,
`set-identity.sh` çalıştırır, `useTest`'i kapatır, `check.js` ile doğrularım.
Sonra imzalı AAB üretimi için 4 depo secret'ı kurarız ve mağaza gönderimine
geçeriz — metinler, görseller, form cevapları üç oyun için de hazır.

**Bana asla göndermen gerekmeyenler:** kimlik fotoğrafı, TC kimlik numarası,
kart bilgisi, IBAN, şifre, Apple/Google hesap parolası. Bunların hiçbiri
projenin hiçbir adımında gerekmiyor.
