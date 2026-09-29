# Topluluk kurulumu — dua panosu, sohbet, hatim grupları, yönetici paneli

Bu belge **kullanıcı için** yazıldı; yazılımcı bilgisi gerektirmez. Sırayla
takip et. Kod ve tasarım tamamen hazır ve sınandı (gerçek bir PostgreSQL
üzerinde 10 senaryo çalıştırılarak doğrulandı); geriye yalnız bu kurulum
kalıyor.

> **Gizli anahtarları bana sohbette gönderme:** Google **Client secret**,
> veritabanı parolası ve `service_role` anahtarı yalnız Supabase panosuna
> yazılır. Sohbette paylaşılabilen yalnız iki değer var: **Project URL** ve
> **anon** anahtar (Adım 4) — bunlar zaten uygulamanın içinde açık duruyor.

**Not — `SUPABASE_KURULUM.md` ile ilişkisi:** O belge çoklu cihaz eşitleme,
AI asistan ve tam yönetici paneli için yazılmıştı (v2'nin tamamı). Bu belge
onun **topluluk + yönetici paneli** kısmını tamamen kapsıyor ve şimdi
uygulanabilir durumda; eşitleme ve AI asistan hâlâ ileri bir tarih. İkisini
birlikte kuracaksan `SUPABASE_KURULUM.md`daki Adım 3 (vector) ve Adım 8
(Anthropic anahtarı) yalnız AI asistan için gerekli — topluluk için atlanır.

---

## Önce bilmen gereken üç şey

**1. Aylık gider başlıyor.** Supabase ücretsiz katman 7 gün hareketsiz
kalınca projeyi duraklatır. Denemek için Free yeterli; mağazaya çıkmadan
önce **Pro** (aylık 25 USD) gerekiyor.

**2. Bu, moderasyon sorumluluğu getiriyor.** Apple'ın kullanıcı içeriği
kuralı (App Review 1.2) dört şey istiyor: uygunsuz içeriği süzmek, şikâyet
mekanizması, kullanıcı engelleme ve yayınlanmış bir iletişim adresi. Kodun
hepsini karşılıyor: sunucu tarafında yasaklı kelime süzgeci (atlanamaz),
şikâyet + engelleme uygulama içinde, iletişim adresi zaten
`docs/bes/destek.html`de var. **Şikâyetleri incelemek** (yönetici panelinden,
birkaç dakika sürüyor) senin işin — Apple 24 saat içinde beklenen tepkiyi
istiyor.

**3. Gizlilik etiketin değişiyor.** Bugün App Store'da "Veri Toplanmıyor"
yazıyor. Topluluk özelliği **varsayılan kapalı** ve kullanıcı elle açmadan
hiçbir veri gönderilmiyor — ama açan kullanıcı için takma ad, dua istekleri
ve sohbet mesajları sunucuya gidiyor. Etiketleri buna göre güncelleyeceğim;
bu kurulumu bitirmeden önce haber vereceğim.

---

## Adım 1 — Supabase hesabı ve proje

*(`SUPABASE_KURULUM.md` Adım 1 ile aynı — projen zaten varsa atla.)*

1. <https://supabase.com> → **Start your project** → GitHub ile giriş yap.
2. **New organization**: ad `KUS GRUP`, tip `Personal`, plan `Free`.
3. **New project**: ad `bes-production`, parolayı üret ve sakla, bölge
   `Central EU (Frankfurt)`.

**Ne görmelisin:** Proje ana sayfası.

## Adım 2 — Google ve Apple girişini aç

Topluluğa katılmak için kullanıcı **Google ya da Apple hesabıyla** giriş
yapar (D32). Uygulamanın geri kalanı girişsiz çalışır; onboarding'deki giriş
adımı atlanabilir. Diğer katılımcılar yalnız takma adı görür, e-posta hiçbir
ekranda gösterilmez.

### 2a — Google

1. <https://console.cloud.google.com> → üstteki proje seçiciden **New
   Project** → ad `BES` → **Create**.
2. Sol menü → `APIs & Services` → **OAuth consent screen** → **Get
   started**. Uygulama adı `BEŞ`, destek e-postası kendi adresin,
   kitle **External**, iletişim e-postası yine kendi adresin → **Create**.
3. `APIs & Services` → **Credentials** → **Create credentials** → **OAuth
   client ID** → tür **Web application**, ad `BES Supabase`.
4. **Authorized redirect URIs** → **Add URI** →
   `https://PROJE-KIMLIGI.supabase.co/auth/v1/callback`
   (PROJE-KIMLIGI: Supabase proje adresindeki kısım — Adım 4'teki
   Project URL ile aynı başlangıç) → **Create**.
5. Açılan pencerede **Client ID** ve **Client secret** görünür. İkisini de
   kopyala.
6. Supabase → `Authentication` → `Sign In / Providers` → **Google** → aç,
   Client ID ve Client Secret'ı yapıştır → **Save**.

### 2b — Apple

1. Supabase → `Authentication` → `Sign In / Providers` → **Apple** → aç.
2. **Client IDs** alanına şunu yaz (virgülle, boşluksuz):
   `com.kusgrupgames.bes,com.kusgrupgames.bes.dev`
3. Diğer alanları (Secret Key vb.) **boş bırak** — uygulama iPhone'un kendi
   Apple panelini kullanıyor, onlara gerek yok. → **Save**.

Apple tarafında elle bir şey yapman gerekmiyor: Xcode, uygulamayı
derlerken "Sign in with Apple" yetkisini Apple Developer hesabına kendisi
ekliyor.

### 2c — Dönüş adresi

`Authentication` → `URL Configuration` → **Redirect URLs** → **Add URL** →
`bes://auth-callback` → **Save**.

Bu olmadan Google girişi tarayıcıda takılı kalır, uygulamaya geri dönmez.

### 2d — E-posta girişi (yönetici paneli için)

`Authentication` → `Sign In / Providers` → **Email**'in açık olduğunu
doğrula (yönetici paneli girişi için gerekiyor; varsayılan zaten açık).
**Anonymous Sign-Ins** kapalı kalabilir — artık kullanılmıyor.

**Ne görmelisin:** Google, Apple ve Email satırları yeşil/açık.

## Adım 3 — Veritabanı şemasını uygula

`SQL Editor` → `New query`. Aşağıdaki üç dosyayı **sırayla**, olduğu gibi
yapıştırıp **Run**'a bas:

1. `bes/supabase/migrations/0001_community.sql`
2. `bes/supabase/migrations/0002_moderation_admin_content.sql`
3. `bes/supabase/migrations/0003_account_deletion.sql` — uygulama içinden
   hesap silme (Apple bunu zorunlu tutuyor)

Hepsi tekrar çalıştırılabilir şekilde yazıldı (`create table if not
exists`, `drop trigger if exists` — hata almadan yeniden basabilirsin).

**Ne görmelisin:** Üçü de "Success. No rows returned" ya da benzeri yeşil
bir sonuç. Hata alırsan tam metnini bana gönder.

## Adım 4 — Proje bilgilerini topla

`Settings` → `API`:

| Nerede yazıyor | Ne işe yarıyor |
|---|---|
| **Project URL** | uygulama ve yönetici paneli buraya bağlanır |
| **Project API keys → anon / public** | herkese açık istemci anahtarı |

> Bu iki değer **gizli değildir** — istemciye her zaman açık olacak şekilde
> tasarlanmıştır. Gerçek koruma, veritabanındaki RLS kurallarından ve
> `is_admin` bayrağından gelir. `service_role` anahtarına hiç dokunma; o
> bütün kuralları atlar.

## Adım 5 — Uygulamayı bağla (GitHub secret)

<https://github.com/Buraakkuss/slot-game/settings/secrets/actions>

`New repository secret` ile ikisini ekle:

| Secret adı | Değer |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Adım 4'teki Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Adım 4'teki anon anahtar |

Bunlar eklenince (ve iş akışları bunları ortam değişkeni olarak geçirecek
şekilde bir sonraki oturumda güncellenince) uygulama içindeki "Topluluk"
bölümü sunucuyu görür.

**Mac'te kendi telefonunda denemek için** bu adımı bana bırak: iki değeri
bana söylemen yeterli, `bes/.env` dosyasına ben yazarım. (Bu iki değer
gizli değildir, sohbette paylaşılabilir. `service_role` anahtarını ise
**asla** gönderme.) `.env` dosyası depoya girmez.

## Adım 6 — Yönetici panelini bağla

`docs/bes-admin/index.html` dosyasını aç (GitHub'da doğrudan düzenleyebilir
ya da klonundan düzenleyip gönderebilirsin). Dosyanın en üstünde:

```js
const SUPABASE_URL = 'BURAYA_PROJE_URLNI_YAZ';
const SUPABASE_ANON_KEY = 'BURAYA_ANON_ANAHTARINI_YAZ';
```

İkisini de Adım 4'teki değerlerle değiştir, kaydet, GitHub'a gönder. Bir
kaç dakika içinde şurada canlı olur:

```
https://kusgrupgames.github.io/bes-admin/
```

> Bu adres herkese açıktır (linksiz bulunması zor, ama gizli değildir).
> Asıl güvenlik giriş ekranından geçer: Supabase'te hesabın ve
> `is_admin = true` olman gerekir. İkisi yoksa hiçbir düğme çalışmaz.

## Adım 7 — Kendini yönetici yap

1. `https://kusgrupgames.github.io/bes-admin/` adresini aç.
2. **"Hesap oluştur"**a bas, kendi e-postan ve bir parola gir.
3. E-postana gelen doğrulama bağlantısına tıkla.
4. Panele dön, aynı bilgilerle **"Giriş yap"**.
5. Şu an "yönetici yetkisi yok" uyarısı göreceksin — bu normal. Supabase
   `SQL Editor`'e dön, şunu yapıştırıp çalıştır (**e-postanı** yerine yaz):

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'E-POSTANI-BURAYA-YAZ');
```

6. Yönetici paneline dönüp sayfayı yenile.

**Ne görmelisin:** Şikâyetler, İçerik, Yasaklı kelimeler, Kullanıcılar
sekmeleri açılır.

## Adım 8 — Bana haber ver

Bu sekiz adım bitince *"topluluk hazır"* de. Ben de:

- Gizlilik metinlerini (`docs/bes/privacy.html`, `gizlilik.html`) ve mağaza
  gizlilik etiketlerini yeni gerçeğe göre güncellerim.
- Uygulamayı yeniden derleyip topluluk özelliklerini senin telefonunda
  (Ayarlar → Topluluk → Takma ad seç → Katıl) uçtan uca sınarım.
- Yönetici panelinden bir test şikâyeti oluşturup incele/gizle/kısıtla
  akışını birlikte doğrularız.

---

## Yönetici paneli ne yapıyor

- **Şikâyetler:** her şikâyetin içeriğini gösterir; **İçeriği gizle**,
  **Kısıtla (7 gün)**, **Yasakla** ya da **Reddet** düğmeleriyle tek
  tıkla sonuçlandırılır.
- **İçerik:** duyuru, ek dua, bilgilendirme yazısı ya da hazır kart
  ekler/düzenler/yayından kaldırır — uygulama güncellemesi gerekmez,
  kaydettiğin an topluluk açık kullanıcılara görünür.
- **Yasaklı kelimeler:** listeye ekle/çıkar; sunucu tarafında **anında** ve
  **atlanamaz** şekilde uygulanır (uygulamadaki hızlı ön denetim ayrıca var,
  ama asıl güvence bu).
- **Kullanıcılar:** takma ada göre ara, yasakla/yasağı kaldır.

## Sınırlar (bilerek kapsam dışı bırakıldı)

- Görsel/medya paylaşımı yok (yalnız metin) — moderasyon yükünü makul
  tutmak için.
- Özel (1'e1) mesajlaşma yok, yalnız sabit konu başlıklı herkese açık
  odalar — Apple'ın "rastgele/anonim sohbet" için istediği ek denetim
  yükünü ve kötüye kullanım riskini azaltmak için.
- Denetim günlüğü (kim hangi işlemi ne zaman yaptı) yok; `reports` tablosundaki
  `resolved_by`/`resolved_at`/`resolution_note` alanları temel bir iz bırakıyor.

## Sorun giderme

- **"topluluk henüz hazır değil" yazıyor:** Adım 5'teki secret'lar henüz
  derlemeye geçmemiş olabilir — bana söyle, kontrol edeyim.
- **Yönetici panelinde "yönetici yetkisi yok":** Adım 7'yi tekrar kontrol et;
  e-postanın SQL'deki yazımı tam eşleşmeli.
- **Sohbet/dua isteği gönderilmiyor, "hesabın kısıtlı" diyor:** o hesap
  yönetici panelinden yasaklanmış/kısıtlanmış demektir.
