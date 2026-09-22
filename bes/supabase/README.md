# Supabase şeması

Şartname §70 (şema), §71 (RLS), §72 (admin), §73 (içerik doğrulama akışı).

## Klasörler

| | |
|---|---|
| `migrations/` | Sıralı SQL. Numarası küçükten büyüğe uygulanır. |
| `tests/` | Doğrulama betikleri. **Üretime gönderilmez.** |

## Doğrulama

```bash
bash tools/verify-db.sh
```

Geçici bir PostgreSQL kümesi kurar, `migrations/` içindeki her dosyayı sırayla
uygular, RLS davranış sınamalarını çalıştırır, sonra kümeyi siler. Yerelde
PostgreSQL yoksa betik hata vermeden atlar ve kurulum komutunu yazar.

`tests/00_auth_stub.sql`, Supabase'in `auth` şemasının küçük bir taklidini
kurar (`auth.users`, `auth.uid()`, `anon/authenticated/service_role` rolleri).
Üretimde bu şemayı Supabase'in kendisi kurar.

## Kurallar

1. **Her tabloda RLS açıktır.** Politikası olmayan tablo kimseye görünmez;
   bu varsayılan kasıtlıdır. `tests/02_rls_coverage.sql` bunu her çalıştırmada
   denetler: RLS'i kapalı ya da politikasız kalan tablo bulursa hata verir.
   Bilerek kapalı bırakılan tek tablo `rate_limits`'tir (yalnız sunucu erişir).
2. **Servis anahtarı istemciye gönderilmez.** RLS'i atlar; yalnız Edge
   Function'larda bulunur (`.env.example` içinde ayrıca yazılıdır).
3. **Kaynaksız içerik giremez.** `translations`, `tafsirs`, `hadiths`, `duas`
   tablolarında `source_id` zorunludur; telif durumu `CONTENT_SOURCES.md`.
4. **Taslak metin son kullanıcıya görünmez.** Okuma politikaları
   `status = 'published'` şartını taşır; taslağı yalnız editör görür (§73).
5. **AI çıktısı içerik tablolarına yazılmaz.** Asistan yanıtı `ai_messages`
   içinde kalır; `ai_messages` tablosuna asistan satırını yalnız Edge Function
   (servis anahtarı) yazabilir — istemci politikası `role = 'user'` ile sınırlıdır.
6. **Topluluk anonimdir.** Uygulama akışı `prayer_feed` görünümünü okur; bu
   görünümde `author_id` sütunu **yoktur**.

## Migration eklemek

Yeni dosya bir sonraki numarayla açılır (`0010_...sql`), var olan dosya
değiştirilmez — uygulanmış migration'ı düzenlemek üretimle yereli ayırır.
Ekledikten sonra `bash tools/verify-db.sh` yeşil olmadan commit yok.
