# BEŞ Yönetici Paneli — NOT (D36)

Bu dosya panelin **nasıl kurulduğunu, neden böyle kurulduğunu** ve **senden
beklenenleri** anlatır. Giriş adresi ve hangi hesapla girileceği ayrıca,
Masaüstündeki `BES-Yonetim-Paneli-GIZLI.txt` dosyasında.

---

## Ne kuruldu

| Bölüm | Ne yapar |
|---|---|
| **Pano** | Hesap sayısı, günlük/7/30 gün aktif, eşitleyenler, topluluk etkinliği, açık şikâyet; RevenueCat geliri (MRR, 28 günlük gelir, abonelik, deneme); App Store indirme/satış grafikleri (satıcı numarası girilince). 7/30/90 gün. |
| **Şikâyetler** | Açık / sonuçlanan / reddedilen kuyruk. Kim şikâyet etti, neden, içeriğin tamamı, sohbetteki bağlamı, yazarın geçmişi (kaç şikâyet, uyarı, susturma). Buradan: içeriği gizle/sil, yazarı **uyar**, **sustur** (1 sa–30 gün), **yasakla**, şikâyeti reddet/kapat. |
| **Kullanıcılar** | Bütün hesaplar (e-posta, giriş yöntemi, kayıt/son giriş, içerik sayıları, durum). Ayrıntı: dua istekleri, mesajlar, uyarılar, hatim grupları, şikâyetleri; uyar, sustur, yasakla/kaldır, takma ad değiştir, yönetici yap/kaldır, eşitleme kaydını sil, **hesabı tamamen sil**, **ücretsiz Pro ver/geri al** (1 hafta, 1 ay, 1 yıl, süresiz — reklamsız + bütün Pro özellikleri; iPhone'da yayındaki 1.0.0 (13)'te, Android'de 1.0.0 (5) ve sonrasında geçerli; kendine de verebilirsin. Kullanıcı uygulamada hesabıyla giriş yapmış olmalı). |
| **Dua istekleri** | Hepsi (gizliler dahil), arama/süzgeç; düzenle, gizle/göster, sil. |
| **Sohbet** | Odaları ekle/düzenle/sil; oda mesajlarında ara, gizle/göster, sil. |
| **Hatim grupları** | Düzenle (başlık, amaç, herkese açık), sil; 30 cüzün durumu, cüzü boşalt / okundu işaretle. |
| **İçerik** | Duyuru, dua, **günün âyeti havuzu**, **günün bilgisi**, bilgi yazısı, hazır kart — 5 dilde ekle/düzenle/yayından kaldır/sil. **Yerleşik içerik**: uygulamaya gömülü 96 dua, 43 bilgi, 186 kart — gizle ya da "Düzenle" (gizle + değiştirilmiş kopya). Yeni derleme gerekmez. |
| **Yasaklı kelimeler** | Ekle/kaldır; dua, mesaj ve takma adda sunucuda uygulanır. |
| **Ayarlar ve günlük** | App Store satıcı numarası; yöneticilerin yaptığı her işlemin günlüğü (kim, ne, ne zaman). |

Uygulamaya da eklenenler: yönetici uyarısı Topluluk sekmesinde görünür
("Okudum" ile kapanır); panel içeriği bütün kullanıcılara gider (topluluğa
katılmak gerekmez), telefonda saklanır, internetsiz de çalışır; 6 saatte bir
ya da uygulama yeniden açılınca yenilenir.

---

## Mimari kararlar ve gerekçeleri

1. **Tek sayfalık statik web uygulaması, GitHub Pages'te** (`docs/yonetim-…/`).
   Sunucu yok, derleme yok, aylık ücret yok, bakımı yalnız dosya. Sitenin
   (gizlilik sayfaları) zaten durduğu yer. React/Next gibi bir çatı bilerek
   kullanılmadı: derleme zinciri bozulabilir, sen müdahale edemezsin.
2. **Yetki tarayıcıda değil, veritabanında.** Her tablo RLS ile korunur;
   yönetici işlemleri `is_admin` denetleyen işlevlerden geçer. Panelin kodu
   herkese açık olsa da (GitHub Pages deposu herkese açıktır) yönetici
   olmayan biri **hiçbir veri göremez** — canlıda denendi.
   *Not: panel adresi rastgele bir klasör adıdır ve arama motorlarına
   kapalıdır, ama asıl koruma adres gizliliği değil, giriş + sunucu
   denetimidir.*
3. **Giriş: Google hesabınla** (Supabase Auth). Parola yok → çalınacak
   parola da yok; Google'ın iki adımlı doğrulaması geçerli. Yönetici
   hesapları: `kusgrupgames@gmail.com`, `t.burakkus@gmail.com`.
   Oturum sekme kapanınca biter; 30 dk hareketsizlikte kapanır.
4. **Gizli anahtarlar tarayıcıya hiç inmez.** RevenueCat ve App Store Connect
   anahtarları Supabase Edge Function (`admin-metrics`) içinde, Supabase
   Secrets'ta durur. İşlev çağıranın yönetici olduğunu doğrular (değilse 403),
   yalnız `kusgrupgames.github.io`'dan gelen tarayıcı isteğini kabul eder.
5. **Kullanıcı içeriği asla HTML olarak işlenmez** (XSS'e karşı): dua
   isteğine yazılan `<script>` panelde düz yazı görünür — denendi.
   Sayfa sıkı içerik güvenlik politikasıyla (CSP) yalnız kendi dosyalarını
   çalıştırır; kütüphaneler klasörde, bütünlük imzalı (SRI).
6. **Kişisel eşitleme kaydı panelde okunmaz.** Gizlilik sayfası bu kaydın
   "yalnız sizin erişebileceğiniz" olduğunu söylüyor; panel yalnız var/yok,
   boyut ve tarih gösterir, silebilir.
7. **Her yönetici işlemi günlüğe yazılır** (`admin_audit`).

### Panel kurulurken bulunan ve kapatılan güvenlik açıkları (0007)
- **Kritik:** sıradan kullanıcı profilini ilk oluştururken kendini yönetici
  yapabiliyordu. Kapatıldı, denendi.
- Gizlenen içeriği geri açma, dua sayacını şişirme, yasaklı kelimeyi
  düzenlemeyle atlatma, başkasının (ör. "Yönetici") takma adıyla yazma,
  şikâyeti "sonuçlanmış" gönderme — hepsi kapatıldı, denendi.
- "yönetici/admin/moderatör/BEŞ ekibi/KUŞ GRUP" takma adları kullanıcıya kapalı.

### Dosyalar
| Yer | Ne |
|---|---|
| `docs/yonetim-…/index.html, panel.js, panel.css` | Panel |
| `docs/yonetim-…/catalog.json` | Yerleşik içerik kataloğu — içerik değişince: `npx tsx tools/export-catalog.ts ../docs/yonetim-…/catalog.json` |
| `docs/yonetim-…/vendor/` | supabase-js 2.117.2, Chart.js 4.4.9 (SRI'lı) |
| `supabase/migrations/0006_admin_panel.sql` | Yönetici işlevleri ve tabloları |
| `supabase/migrations/0007_security_hardening.sql` | Güvenlik sağlamlaştırması |
| `supabase/functions/admin-metrics/` | Dış metrikler (RevenueCat, App Store) |
| `supabase/functions/admin-pro/` | Panelden ücretsiz Pro verme/geri alma (RevenueCat promosyon hakkı) |
| `src/features/content/` | Uygulamada panel içeriğinin okunması ve birleştirilmesi |

---

## Veri kaynakları — durum ve senden beklenenler

| Kaynak | Durum | Ne gösterir | Senden beklenen |
|---|---|---|---|
| **Supabase** | ✅ Bağlı | Hesaplar, aktif kullanıcı (giriş yapmış), topluluk, şikâyet | — |
| **RevenueCat** | ✅ Bağlı | Gelir (28 gün), MRR, aktif abonelik/deneme, yeni müşteri | Aşağıdaki **1** |
| **App Store Connect** | ⏳ Satıcı numarası bekleniyor | Günlük indirme, yeniden indirme, güncelleme, uygulama içi satış, para birimi bazında gelir | Aşağıdaki **2** |
| **Google Play Console** | ⏳ Android yayında değil | Android indirmeleri | Android yayına çıkınca **3** |
| **AdMob** | ❌ Bağlı değil | Reklam geliri | İstersen **4** |

**Giriş yapmadan kullananlar neden sayılmıyor?** Uygulamada analitik yok
(gizlilik sözü, mağaza formunda da "analitik yok" beyanı var). Onların
sayısını App Store/Play indirme ve "aktif cihaz" raporları verir.

1. **RevenueCat — kalıcı salt-okunur anahtar.** Şu an benim için açtığın
   geçici `claude-bes` anahtarı kullanılıyor. Onu kapatmadan önce:
   RevenueCat → Project settings → **API keys** → **+ New secret API key** →
   ad `bes-admin-panel`, sürüm **V2**, izinler: **Charts metrics: Read only**,
   **Customer information: Read only** (gerisi No access) → anahtarı bana
   gönder; ben Supabase'e koyup `claude-bes`'i kapatabileceğini söylerim.
2. **App Store satıcı numarası.** Banka/vergi sözleşmesi (Paid Apps) etkin
   olunca App Store Connect → **Payments and Financial Reports** sayfasının
   sol üstünde 8 haneli numara çıkar. Panelde **Ayarlar** → "App Store
   satıcı numarası" alanına yaz, Kaydet. Grafikler ertesi gün dolmaya başlar.
   *Ayrıca:* panel şu an benim için açtığın App Store Connect API anahtarını
   (`WMPYYBP5JS`) kullanıyor. Onu kapatmak istersen önce App Store Connect →
   Users and Access → Integrations → **+** → ad `bes-admin-panel`, erişim
   **Sales** (yalnız satış raporları) → .p8 dosyasını, Key ID'yi bana ver.
3. **Google Play.** Android sürümü yayına alınınca: Play Console → Kurulum →
   API erişimi → hizmet hesabı (Google Cloud'da) → "Raporları görüntüle"
   izni. Hizmet hesabının JSON anahtarını bana ver; işlevi genişletirim.
4. **AdMob (isteğe bağlı).** AdMob API hizmet hesabını kabul etmiyor, bir kez
   Google hesabınla OAuth onayı istiyor: Google Cloud'da AdMob API'yi
   etkinleştir, "Masaüstü uygulaması" OAuth istemcisi aç, istemci kimliğini
   ve gizli anahtarı bana ver; onay bağlantısını birlikte açarız.

---

## İşletim

- **Şikâyetler:** Apple 24 saat içinde inceleme ister. Kenar çubuğundaki
  rozet açık şikâyet sayısıdır; günde bir bak.
- **Yeni yönetici:** Kullanıcılar → kişi → "Yönetici yap" (onay için
  `YÖNETİCİ` yazılır). O kişi Google hesabıyla bir kez uygulamaya ya da
  panele giriş yapmış olmalı.
- **Panel adresi değişirse** Supabase → Authentication → URL Configuration →
  Redirect URLs listesine yeni adres eklenmeli (şu an ekli).
