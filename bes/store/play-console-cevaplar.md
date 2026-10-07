# Play Console — "Uygulama içeriği" cevapları (BEŞ 1.0, lansman)

Play bu formları API'ye açmıyor; konsolda elle doldurulur. Yol:
**Play Console → BEŞ → Kontrol paneli → "Uygulamanızın kurulumunu tamamlayın" → Görevleri görüntüle**
(ya da sol menü en altta **Politika ve programlar → Uygulama içeriği**).

Mağaza metinleri, simge, tanıtım görseli, ekran görüntüleri ve iletişim
bilgileri **API ile yüklendi** — onlara dokunmaya gerek yok.

| # | Bölüm | Cevap |
|---|---|---|
| 1 | **Gizlilik politikası** | `https://kusgrupgames.github.io/bes/gizlilik.html` |
| 2 | **Uygulama erişimi** | "Tüm işlevler özel erişim gerektirmeden kullanılabilir". (Topluluk herhangi bir Google hesabıyla girilir; özel kullanıcı adı/şifre yok.) |
| 3 | **Reklamlar** | "Evet, uygulamamda reklam var" |
| 4 | **İçerik derecelendirmesi** | E-posta: kusgrupgames@gmail.com · Kategori: **Diğer tüm uygulama türleri** · Şiddet, cinsellik, küfür, uyuşturucu, kumar: **Hayır** · "Kullanıcılar birbiriyle etkileşim kurabilir / içerik paylaşabilir mi?": **Evet** · "Kullanıcının konumu başkalarıyla paylaşılıyor mu?": **Hayır** · "Dijital ürün satın alınabiliyor mu?": **Hayır** (1.0'da satış yok) · Gerisi **Hayır** |
| 5 | **Hedef kitle ve içerik** | Yaş grupları: **13-15, 16-17, 18 ve üzeri** (13 yaş altı işaretlenmez — reklam ve sohbet var) · "Çocukların ilgisini çekebilir mi?": **Hayır** |
| 6 | **Haber uygulaması** | Hayır |
| 7 | **Veri güvenliği** | Aşağıdaki tablo |
| 8 | **Devlet uygulaması** | Hayır |
| 9 | **Finansal özellikler** | "Uygulamam finansal özellik sunmuyor" |
| 10 | **Sağlık** | Hayır / sağlık özelliği yok |
| 11 | **Reklam kimliği** | **Evet** → amaç: **Reklam veya pazarlama**, **Analiz** |
| 11b | **Ön plan hizmeti izinleri** (sorulursa) | **Medya oynatma** → "Kullanıcının başlattığı Kur'an kıraati, ekran kapalıyken ya da uygulama arka plandayken çalmaya devam eder (bildirimden durdurulabilir)." Video istenirse: kıraati başlatıp ekranı kilitleyen 20-30 sn'lik ekran kaydı. |
| 12 | **Mağaza ayarları** (sol menü: Mağaza varlığı → Mağaza ayarları) | Kategori: **Uygulama → Yaşam Tarzı** · E-posta ve web sitesi zaten girildi |

## Veri güvenliği formu

**"Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu?" → Evet**
**"Tüm veriler aktarım sırasında şifreleniyor mu?" → Evet**
**"Kullanıcılar verilerinin silinmesini isteyebilir mi?" → Evet** — hesap silme bağlantısı: `https://kusgrupgames.github.io/bes/gizlilik.html`
**"Hesap oluşturma"** → "Uygulamam kullanıcıların hesap oluşturmasına izin veriyor" → **OAuth (Google ile giriş)** · hesap silme: uygulama içinde Ayarlar → Hesap → Hesabı sil

| Veri türü | Toplanıyor | Paylaşılıyor | İsteğe bağlı mı | Amaç |
|---|---|---|---|---|
| Konum → **Yaklaşık konum** | ✓ | ✓ (Google AdMob) | Hayır | Reklam |
| Kişisel bilgiler → **E-posta adresi** | ✓ | — | **Evet** | Uygulama işlevleri, Hesap yönetimi |
| Kişisel bilgiler → **Kullanıcı kimlikleri** | ✓ | — | **Evet** | Uygulama işlevleri, Hesap yönetimi |
| Mesajlar → **Diğer uygulama içi mesajlar** | ✓ | — | **Evet** | Uygulama işlevleri |
| Uygulama etkinliği → **Uygulama etkileşimleri** | ✓ | ✓ (Google AdMob) | Hayır | Reklam, Analiz |
| Uygulama etkinliği → **Kullanıcının oluşturduğu diğer içerikler** (dua istekleri, hesapla eşitlenen ibadet kayıtları) | ✓ | — | **Evet** | Uygulama işlevleri |
| Uygulama bilgileri ve performans → **Kilitlenme günlükleri**, **Teşhis** | ✓ | ✓ (Google AdMob SDK) | Hayır | Analiz |
| Cihaz veya diğer kimlikler → **Reklam kimliği** | ✓ | ✓ (Google AdMob) | Hayır | Reklam, Analiz |

İşaretlenmeyenler (toplanmıyor): kesin konum (GPS telefonda kalır), ad, telefon,
adres, fotoğraf/video, ses, dosyalar, takvim, kişiler, sağlık, finans,
web geçmişi. Her "Toplanıyor" satırında "geçici olarak mı işleniyor?" → **Hayır**.

## Kapalı test (üretim erişimi için zorunlu)

- **Test edin ve yayınlayın → Test → Kapalı test → Kanal oluştur** (ya da hazır "Alpha").
- **Test kullanıcıları** sekmesi → **E-posta listesi oluştur** → ad: `BEŞ test` → 12+ Gmail adresi (virgülle) → Kaydet.
- Sürümü (AAB) ben API ile bu kanala yüklerim.
- 12 kişi **katılım bağlantısından** "Test kullanıcısı ol" der ve Play'den kurar; **14 gün** silmez.
- 14 gün dolunca: Kontrol paneli → **Üretime başvur**.
