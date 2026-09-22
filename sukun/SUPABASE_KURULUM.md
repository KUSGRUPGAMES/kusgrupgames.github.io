# Supabase kurulumu — v2'yi açmak için elle yapılacaklar

Bu belge **kullanıcı için** yazıldı; yazılımcı bilgisi gerektirmez. Sırayla
takip et, her adımın sonunda "ne görmelisin" yazıyor.

> **Hiçbir anahtarı bana sohbette gönderme.** Değerler yalnız GitHub'ın gizli
> anahtar ekranına yazılır (Adım 7). Ben oradan okumam bile gerekmez; derleme
> akışı okur. Veritabanı parolanı da yalnız kendi parola yöneticine kaydet.

Kurulum bitince v2'nin dört özelliği açılır: **çoklu cihaz eşitleme**,
**dua kardeşliği (topluluk)**, **AI asistan**, **admin paneli**. Hiçbiri
kapsamdan çıkarılmadı.

---

## Önce bilmen gereken üç şey

**1. Aylık gider başlıyor.** Supabase ücretsiz katman 7 gün hareketsiz kalınca
projeyi duraklatır; duraklamış proje demek uygulamanın eşitlemesinin ölmesi
demektir. Üretim için **Pro katman (aylık 25 USD)** gerekiyor. AI asistan ayrıca
kullanım başına ücretli (Anthropic API).

**2. Topluluk özelliği moderasyon sorumluluğu getiriyor.** Apple'ın kullanıcı
içeriği kuralı (App Review 1.2) dört şey istiyor: uygunsuz içeriği süzmek,
şikâyet mekanizması, kullanıcı engelleme ve yayınlanmış bir iletişim adresi.
Kodun üçünü de hazır; **şikâyetleri 24 saat içinde incelemek senin işin.**
Bunu yapamayacağın bir dönem olursa topluluk özelliğini kapatabilmeliyiz —
kapatma anahtarını koda koyacağım.

**3. Gizlilik etiketin değişiyor.** Bugün App Store'da "Veri Toplanmıyor"
yazıyor. Hesap + eşitleme + topluluk açılınca e-posta, ibadet kayıtları ve
dua metinleri sunucuya çıkıyor; etiketleri ve gizlilik metinlerini ben
güncelleyeceğim, ama bu bilinçli bir değişiklik — bilmeni istiyorum.

---

## Adım 1 — Supabase hesabı ve proje

1. <https://supabase.com> → **Start your project** → GitHub ile giriş yap
   (zaten GitHub hesabın var, en kolayı bu).
2. **New organization**: ad `KUS GRUP`, tip `Personal`, plan şimdilik `Free`.
3. **New project**:
   - **Name:** `bes-production`
   - **Database Password:** sağdaki **Generate a password** düğmesine bas.
     **Bu parolayı parola yöneticine kaydet.** Bir daha gösterilmiyor ve
     Adım 7'de lazım olacak.
   - **Region:** `Central EU (Frankfurt)` — Türkiye'ye en yakın ve AB
     bölgesinde olması KVKK/GDPR tarafını kolaylaştırıyor.
   - **Create new project**
4. Kurulum 1–2 dakika sürer.

**Ne görmelisin:** Proje ana sayfası ve üstte `Project Settings` bağlantısı.

---

## Adım 2 — Pro katmana geç (üretim için zorunlu)

`Settings` → `Billing` → `Change subscription` → **Pro** (aylık 25 USD).

Sebebi yukarıda: Free katmanda 7 gün hareketsizlik projeyi duraklatıyor ve
kullanıcıların eşitlemesi sessizce ölüyor.

> Önce denemek istersen Free'de bırakabilirsin; ama **mağazaya çıkmadan önce**
> Pro'ya geçmen şart. Bunu yayın kontrol listesine ekleyeceğim.

---

## Adım 3 — `vector` uzantısı

`Database` → `Extensions` → arama kutusuna `vector` yaz → anahtarı **aç**.

AI asistanın kaynaklı cevap verebilmesi (RAG) bunu kullanıyor.

**Ne görmelisin:** `vector` satırı yeşil/açık.

---

## Adım 4 — Giriş yöntemleri

`Authentication` → `Sign In / Providers`:

1. **Email** → açık kalsın. `Confirm email` **açık** olsun.
2. **Apple** → aç. (Apple'ın kuralı: başka bir sosyal giriş sunuyorsan
   "Sign in with Apple" da sunmak zorundasın. Bizde e-posta + Apple yeterli,
   Google'ı hiç açmıyoruz ki ek kurulum olmasın.)
   - Apple tarafındaki `Service ID` ve anahtar üretimi Apple Developer
     hesabında yapılıyor; o adımları ayrıca yazacağım. Şimdilik **Email**
     ile devam edebilirsin, Apple'ı sonra ekleriz.
3. `Authentication` → `URL Configuration`:
   - **Site URL:** `https://kusgrupgames.github.io/sukun/`
   - **Redirect URLs** listesine şunu ekle: `sukun://auth-callback`

**Ne görmelisin:** Email sağlayıcısı açık, yönlendirme adresi listede.

---

## Adım 5 — Supabase erişim anahtarı (benim çalışabilmem için)

Bu, veritabanı şemasını ve sunucu fonksiyonlarını **derleme akışının**
uygulayabilmesi için gerekiyor. Böylece ben hiçbir anahtarı görmeden
Supabase'i kurabiliyorum.

1. Sağ üstte hesap resmin → `Account Settings` → `Access Tokens`
2. `Generate new token` → ad: `bes-ci` → **Generate token**
3. Çıkan değeri kopyala. **Bir daha gösterilmiyor.** Adım 7'de kullanacaksın.

---

## Adım 6 — Proje bilgilerini topla

`Settings` → `API` sayfasından üç değer:

| Nerede yazıyor | Ne işe yarıyor |
|---|---|
| **Project URL** (`https://xxxx.supabase.co`) | uygulama buraya bağlanacak |
| **Project API keys → anon / public** | uygulamanın herkese açık anahtarı |
| **Reference ID** (`Settings` → `General`) | derleme akışı projeyi bununla bulur |

> `service_role` anahtarına **dokunma**. O anahtar bütün güvenlik kurallarını
> atlıyor; uygulamaya da GitHub'a da girmeyecek. Sunucu fonksiyonları onu
> Supabase'in kendi ortamından otomatik alıyor.

---

## Adım 7 — Anahtarları GitHub'a yaz (sohbete değil!)

<https://github.com/Buraakkuss/slot-game/settings/secrets/actions>

`New repository secret` ile **altı** tane ekle:

| Secret adı | Değer |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Adım 5'teki token |
| `SUPABASE_PROJECT_REF` | Adım 6'daki Reference ID |
| `SUPABASE_DB_PASSWORD` | Adım 1'de ürettiğin veritabanı parolası |
| `EXPO_PUBLIC_SUPABASE_URL` | Adım 6'daki Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Adım 6'daki anon anahtar |
| `ANTHROPIC_API_KEY` | Adım 8'de alacaksın |

**Ne görmelisin:** Listede altı satır; değerleri GitHub bir daha göstermez,
bu normal.

---

## Adım 8 — AI asistan için API anahtarı

1. <https://console.anthropic.com> → hesap aç
2. `Settings` → `Billing` → kart ekle ve bir bütçe sınırı koy
   (öneri: aylık 20 USD ile başla, kullanıma göre artırırız)
3. `API Keys` → `Create Key` → ad `bes-asistan` → kopyala
4. Adım 7'deki `ANTHROPIC_API_KEY` secret'ına yaz

> Bütçe sınırını **mutlaka** koy. Sınırsız bırakılan bir anahtar, kötü niyetli
> bir kullanım durumunda ayın sonunda sürpriz fatura demek. Ayrıca uygulama
> tarafına da kullanıcı başına günlük istek sınırı koyacağım (`rate_limits`
> tablosu bunun için hazır).

---

## Adım 9 — Bana haber ver

Bu dokuz adım bitince bana *"Supabase hazır"* de. Sonrasında ben şunları
yapacağım — tamamı otomatik, senin bir şey yapman gerekmeyecek:

**Veritabanı**
- `supabase/migrations/` altındaki dokuz dosyayı (39 tablo, RLS politikaları,
  görünümler, `delete_my_account()`, `export_my_data()`) projene uygulayan bir
  GitHub Actions akışı
- Her push'ta RLS kapsam sınamasının çalışması: politikasız tablo kalırsa
  derleme kırmızıya döner

**Uygulama**
- Supabase istemcisi, oturum yönetimi ve derin bağlantı (`sukun://auth-callback`)
- **Hesap ekranı**: e-posta ile giriş, çıkış, hesabı silme, verini indirme
- **Eşitleme**: yazılmış ve sınanmış birleştirme motorunun (D12) üstüne taşıma
  katmanı; çevrimdışı öncelikli, çakışmada veri kaybı yok
- **Dua kardeşliği**: anonim akış (`prayer_feed` görünümünde yazar kimliği
  yok), âmin, şikâyet, engelleme, moderasyon kuyruğu ve **özelliği tamamen
  kapatabilen anahtar**
- **AI asistan**: Edge Function üzerinden, sunucu tarafında anahtar, kaynaklı
  cevap, günlük istek sınırı ve "dinî hüküm vermez" uyarısı
- **Admin paneli**: içerik doğrulama akışı (taslak → yayın), moderasyon
  kuyruğu, denetim günlüğü

**Yasal ve mağaza**
- Gizlilik etiketleri, `docs/sukun/privacy.html`, `terms.html` ve mağaza
  metinlerinin yeni gerçeğe göre güncellenmesi
- Hesap silme akışının Apple'ın zorunlu kıldığı biçimde uygulama içinde olması

**Sınama**
- Her yeni katman için sınama; `npm run gate` yeşil olmadan commit yok
