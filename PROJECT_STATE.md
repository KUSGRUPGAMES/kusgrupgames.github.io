# PROJECT_STATE

> Bu dosya her oturumun **ilk okunacak** dosyasıdır. Context sıfırlanırsa
> buradan devam edilir. Her önemli adımdan sonra güncellenir.

## Ürün

| | |
|---|---|
| Marka | **BEŞ** — sembol `5` (D15). `BrandConfig` tek kaynak; paket kimliği `com.kusgrup.sukun` olarak kaldı |
| Klasör | `sukun/` |
| Sürüm | 0.1.0 (ilk üretim sürümü hedefi: 1.0.0) |
| Teknoloji | Expo SDK 54 · React Native 0.81.5 · React 19 · TypeScript (strict) · expo-router 6 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions + RLS) |

## Mevcut faz

**FAZ 10 — Hesap ve eşitleme** (FAZ 0–9 tamamlandı)

## Tamamlanan

- [x] Repository audit (5 mevcut ürün, Capacitor tabanlı, tek dosya mimarisi)
- [x] Mimari kararı verildi ve `DECISIONS.md`'ye yazıldı (D1–D8)
- [x] Durum dosyaları oluşturuldu
- [x] `sukun/` Expo + TypeScript iskeleti kuruldu
- [x] Kalite kapısı yeşil: `npm run gate` (tsc + eslint + jest)
- [x] `BrandConfig` — marka adı, bundle id, e-posta tek noktada
- [x] Design token katmanı (renk, tipografi, spacing, radius, opaklık, süre, easing)
- [x] Açık/koyu tema (`ThemeColors` rol arayüzü üzerinden)
- [x] Saat dilimi katmanı (`src/lib/time/zone.ts`) — IANA zone, DST'ye dayanıklı
- [x] Namaz vakti çekirdeği (7 hesap yöntemi, astronomi, düzeltme, sonraki/şimdiki vakit)
- [x] Kıble çekirdeği (bearing, mesafe, pusula sapması, doğruluk sınıfı)
- [x] Hicri takvim çekirdeği + 13 dinî gün tanımı
- [x] 4 test dosyası / 32 test — hepsi yeşil
- [x] `CONTENT_SOURCES.md` — telif durumu kalem kalem yazıldı
- [x] Bileşen kütüphanesi: 29 bileşen, 32 ikonluk kendi SVG seti (§8)
- [x] Geometrik motif dili: 5 desen, figüratif öge yok (§9)
- [x] Arapça tipografi: Amiri + Amiri Quran (SIL OFL 1.1), RTL katmanı (§10)
- [x] Supabase şeması: 10 migration, 39 tablo (§70)
- [x] RLS politikaları + davranış sınaması + kapsama denetimi (§71)

**FAZ 0 tamamlandı.**

**FAZ 1 tamamlandı:**

- [x] expo-router sekme düzeni, 5 sekme + bulunamayan yol ekranı (§11)
- [x] Yerelleştirme: TR tam (169 anahtar), EN/AR/DE/FR temel (85 anahtar) (§61)
- [x] Gömülü metin yasağı — sınamayla denetleniyor (§61)
- [x] RTL: saf yön katmanı, platform köprüsü, Arapça metin akışı (§79)
- [x] Kalıcılık: SQLite migration çalıştırıcısı, AsyncStorage, SecureStore (§5)
- [x] Hata sınırı, çevrimdışı şeridi, yeniden deneme (§82)
- [x] Ağ katmanı: zaman aşımı, yeniden deneme, önbellek, bayat yedek (§76)
- [x] Üretim güvenli günlükleme + veri maskeleme (§83, §84)
- [x] `expo export` ile paketleme doğrulandı (Android paketi üretiliyor)

**FAZ 2 tamamlandı:**

- [x] 5 aşamalı onboarding (§12)
- [x] Konum: GPS + elle seçim, 81 il + 36 dünya şehri, çoklu kayıt (§13)
- [x] Türkçe arama normalizasyonu — İ/ı tuzağı dahil (§78)
- [x] 7 hesaplama yöntemi + Hanefî/Şâfiî ikindi (§15)
- [x] PrayerTimesProvider soyutlaması, ağ çökerse yerel hesaba düşer (§15)
- [x] Altı vakit, canlı geri sayım, aylık takvim ekranı (§14)
- [x] Vakit bildirimleri: vakit bazlı açma/kapama, erken uyarı dakikası (§16)

**FAZ 3 tamamlandı:**

- [x] Ana sayfa: 8 kart, gizle/göster/sırala (§20, §21)
- [x] Günün içeriği seçimi: aynı gün sabit, N ardışık günde tekrarsız (§22–§25)
- [x] 34 özgün dua (14 kategori), 43 özgün bilgi maddesi (6 konu)
- [x] Esmâü'l-Hüsnâ: 99 isim, arama, favori (§26)
- [x] Hicrî takvim, çift yönlü çevirici, gün düzeltmesi (§44)
- [x] Dinî günler + geri sayım (§45), ay durumu (§46)
- [x] Birleşik favoriler altyapısı (§63)

**FAZ 4 tamamlandı (telif engelli kısımlar hariç):**

- [x] Tanzil'den Arapça metin içe aktarma, doğrulama ve sağlama (§74)
- [x] 114 sure · 6236 âyet · 604 sayfa · 30 cüz · 15 secde âyeti
- [x] Kur'an ana ekranı: son okunan, sureler, cüzler, yer imleri (§27)
- [x] Okuyucu: Arapça metin, yazı boyutu, âyet aksiyonları (§28)
- [x] Yer imleri (renk + not), son okunan konum (§29, §30)
- [x] Arapça arama: harekesiz sorgu harekeli metinde eşleşiyor (§35, §78)
- [x] Paylaşımda kaynak künyesi her zaman gidiyor

**FAZ 5 (ses) — yapılabilecek kısım tamam:** oynatma durum mantığı ve
depolama hesabı yazıldı ve sınandı; ses dosyaları kıraat lisansına bağlı (⛔B4).

**FAZ 6 tamamlandı:**

- [x] Kıble: büyük daire hesabı, derece, Kâbe uzaklığı (§36)
- [x] Geometrik pusula kadranı — figüratif öge yok (§9)
- [x] Doğruluk seviyesi, kalibrasyon ve manyetik girişim uyarısı (§36)
- [x] Hizalanınca bir kez titreşim; reduced-motion açıkken kapalı (§36, §79)
- [x] Pusula yalnız kıble ekranı öndeyken açık (§81)

**FAZ 7 ve 8 tamamlandı (telif engelli kısımlar hariç):**

- [x] Zikirmatik: 8 hazır zikir, özel zikir, haptic, hedef halkası (§37)
- [x] Zikir istatistiği: seri, 14 günlük grafik, günlük/haftalık/aylık (§38)
- [x] Namaz rehberi: 6 bölüm, 33 adım — hüküm vermez, farkları belirtir (§40)
- [x] Kaza namazı: 6 sayaç, toplu giriş, geri alma (§41)
- [x] İbadet defteri ve oruç takibi (§42, §49)
- [x] İslami bilgi kütüphanesi (§53)

**FAZ 9 tamamlandı:**

- [x] Zekât: 7 varlık kalemi, 2 düşülen kalem, altın/gümüş nisap seçimi,
      fitre hesabı; metodoloji ekranda yazılı (§43)
- [x] Ramazan modu: iftar/imsak geri sayımı, 30 günlük takvim (§47)
- [x] Mukabele: 30 cüz takibi, hedef tempo, okuyucuya atlama (§48)
- [x] Cuma modu: yalnız cuma görünen kart, Kehf kısayolu (§50)
- [x] Hac/Umre rehberi + hazırlık listesi, tamamen çevrimdışı (§54)

**FAZ 10-11 — yapılabilecek kısım tamam:**

- [x] Eşitleme birleştirme motoru: çakışma çözümü, mezar taşı, sayaç
      birleştirme (§58). Taşıma katmanı Supabase projesine bağlı ⛔B5
- [x] Global arama: âyet başvurusu, sure, dua, esmâ, bilgi, Arapça (§51, §78)
- [x] Birleşik favoriler (§63)
- [x] Özel hatırlatıcılar: sabit saat / vakte göre / hafta günü (§64)

**Engeller kalktı (kullanıcı kararıyla):**

- [x] **B1 — meal**: Elmalılı Hamdi Yazır kamu malı; içe aktarıldı, okuyucuya,
      aramaya ve Günün Âyeti'ne bağlandı (D13)
- [x] **B4 — kıraat**: Islamic Network CDN'inden akış + indirme, 18 okuyucu (D14)
- [x] **B5 — Supabase**: v1 için gerekmiyor; içerik GitHub Pages'ten, kişisel
      veri cihazda kalıyor (D12)

**FAZ 11, 16, 17, 18, 19 — yapılabilecek kısım tamam:**

- [x] Paylaşım kartı (§62), freemium ve reklam kuralları (§66, §68)
- [x] Erişilebilirlik, kontrast, güvenlik ve pil denetimleri sınamaya bağlandı
- [x] Bileşen sınamaları (jest-expo), uç durum matrisi
- [x] README, ARCHITECTURE, RELEASE_CHECKLIST, mağaza sayfaları, gizlilik (TR+EN)

**Görsel geçiş — ekranlara bakılarak yapıldı:**

- [x] `npm run preview`: 42 ekran çizdirilip tek tek incelendi, 85 sn'lik tur kaydedildi
- [x] Bakarak bulunan 13 hata düzeltildi (ayrıntı `CHANGELOG.md`), dördü için
      geri gelmesini engelleyen sınama yazıldı

## Devam eden

- [ ] Mağaza hesapları açılınca: abonelik, widget, Live Activity (⛔B6, B7)
- [ ] Gerçek cihazda son bakış (⛔E3 — bu kapsayıcıda emülatör yok)

## Sıradaki iş

1. Paylaşım kartı üreticisi — kaynak künyesi görünür (§62)
2. Profil ve ayarlar ekranının tamamlanması (§59, §60)
3. Freemium sınırları ve Pro kapıları (§66)
4. Reklam yerleşim kuralları ve uygunsuz kategori engelleme (§68)
5. Erişilebilirlik ve performans geçişi (§79, §80)

## Build durumu

| | Durum |
|---|---|
| TypeScript | ✅ `tsc --noEmit` temiz |
| Lint | ✅ `eslint --max-warnings=0` temiz |
| Test | ✅ 40 suite / 524 test (mantık + bileşen) |
| Veritabanı | ✅ `bash sukun/tools/verify-db.sh` — migration + RLS + kapsama |
| Paketleme | ✅ `npm run bundle` — Metro paketi üretiliyor |
| Görsel geçiş | ✅ `npm run preview` — 42 ekran + 85 sn'lik gezinme videosu, hepsi çiziyor |
| Marka varlıkları | ✅ `node tools/gen-brand.js` — 5 işareti, koyu/açık, mikro, monokrom, SVG kaynak |
| iOS CI | ✅ `sukun-ios.yml` — kalite kapısı + imzasız simulator derlemesi |
| iOS yayın | ⚙️ `sukun-release-ios.yml` — elle çalışır, TestFlight'a yükler (secret'lara bağlı) |
| Android CI | ⚙️ `sukun-android.yml` — kalite kapısı + AAB + debug APK |
| iOS build | ✅ CI'da imzasız derleniyor; imzalı TestFlight yapısı secret'lara bağlı |
| Android build | ⚙️ `sukun-android.yml` eklendi, ilk koşu bekliyor |

## Kritik kararlar (özet — ayrıntı DECISIONS.md)

- Mevcut `seher/` **silinmedi**; yeni ürün ayrı klasörde kuruluyor.
- Depo kökündeki "tek dosya" kuralı bu ürün için **belgelenmiş istisna** (D3).
- Telifli dinî içerik (meal, tefsir, hadis, kıraat) **kaynak lisansı gelmeden
  yayınlanmaz**; altyapı kurulur, veri yuvası boş bırakılır. Ayrıntı:
  `CONTENT_SOURCES.md` ve `KNOWN_ISSUES.md`.
