# MASTER CHECKLIST

> Şartnamedeki **her** gereksinim burada izlenir. Bir madde gerçekten
> tamamlanmadan `[x]` yapılmaz (§93). `⛔Bn` işareti, o maddenin
> `KNOWN_ISSUES.md` içindeki **Bn** engeline bağlı olduğunu gösterir:
> altyapı tamamlanır, veri/kimlik yuvası boş kalır.
**Toplam 133 madde · tamamlanan 95 · kısmen tamamlanan 12 · dış engele bağlı 22**
>
> `[~]` işareti: yapılabilecek kısmı tamamlandı, kalanı dış engele bağlı.


## FAZ 0 — Audit, mimari, design system, veritabanı mimarisi

- [x] Repository audit
- [x] Mimari kararları (DECISIONS.md)
- [x] PROJECT_STATE / MASTER_CHECKLIST / DECISIONS / KNOWN_ISSUES / CHANGELOG
- [x] Expo + TypeScript iskeleti
- [x] BrandConfig (§7) — tek noktadan marka yönetimi
- [x] Design token katmanı: colors, spacing, typography, radius, shadows, opacity, animations, icons (§8)
- [x] Light/Dark tema (§8)
- [x] Reusable component kütüphanesi (§8) — 29 bileşen + 32 ikonluk kendi SVG seti
- [x] Görsel dil: düşük opaklıkta geometrik motif (§9) — 5 desen, figüratif öge yok
- [x] Typography: Latin sistem yazı tipi + Amiri/Amiri Quran (OFL), RTL katmanı (§10)
- [x] Supabase şeması (§70) — 10 migration, 39 tablo, yerelde uygulanarak doğrulandı
- [x] RLS politikaları (§71) — davranış sınaması + kapsama denetimi, mutasyonla sınandı
- [x] Quality gate: tsc + lint + test + build

## FAZ 1 — Çekirdek

- [x] Navigation (§11): Ana Sayfa · Kur'an · İbadet · Keşfet · Profil — expo-router, 5 sekme
- [x] Localization altyapısı, string hardcode yok (§61) — sınamayla denetleniyor
- [x] Türkçe çeviri tam (§61) — 169 anahtar, kaynak dil
- [x] EN / AR / DE / FR temel UI çevirileri (§61) — 85 temel anahtar, eksiksizliği sınanıyor
- [x] RTL desteği (§61, §79) — saf yön katmanı + platform köprüsü + Arapça metin akışı
- [x] Persistence: SQLite + AsyncStorage + SecureStore (§5) — 3 migration, işlemli çalıştırıcı
- [x] Global Error Boundary, offline banner, retry (§82)
- [x] Network katmanı: timeout, retry, cache, fallback (§76) — bayat önbellek yedeği dahil
- [x] Production-safe logging (§83) — konum/e-posta/jeton maskeleme sınandı

## FAZ 2 — Onboarding, konum, namaz

- [x] Onboarding 5 aşama (§12) — hoş geldin · konum · yöntem · bildirim · hazır
- [ ] GPS + manuel ülke/il/ilçe (§13) — **il düzeyi tamam** (81 il + 36 dünya şehri); ilçe verisi ⛔B9
- [x] Çoklu kayıtlı konum ve aralarında geçiş (§13) — birincil konum kuralı sınandı
- [x] PrayerTimesProvider abstraction + fallback (§15) — ağ çökerse yerel hesaba düşer; yerel hesap önbellek istemez
- [x] Hesaplama yöntemleri (§15) — 7 yöntem + Hanefî/Şâfiî ikindi seçimi
- [x] Altı vakit + sıradaki vakit + canlı geri sayım (§14) — arka planda sayaç durur
- [x] Günlük ve aylık takvim ekranı + haftalık aralık işlevi (§14)
- [x] Vakit bazlı bildirim ayarları, erken uyarı dakikası (§16) — iOS 64 sınırı hesaba katıldı
- [~] Bildirim sesi: sistem sesi kullanılıyor; **ezan sesi için ayrı lisans gerekir** (§17)
- [x] Bildirim merkezi (§65) — vakit bildirimleri ve hatırlatıcılar tek listede, yeniden kurma

## FAZ 3 — Ana sayfa ve günlük içerik

- [x] Ana sayfa düzeni (§20) — sekiz kart, sıradaki vakit sabit
- [x] Ana sayfa özelleştirme: gizle/göster/sırala (§21) — bulut eşitleme FAZ 10'da ⛔B5
- [x] Günün Âyeti (§22) — Arapça + Elmalılı meali, kaynak künyesiyle
- [ ] Günün Hadisi (§23)  ⛔B3
- [x] Günün Duası (§24) — 34 özgün Türkçe dua, 14 kategori
- [x] Günün Bilgisi (§25) — 43 özgün madde, 6 konu
- [x] Esmâü'l-Hüsnâ: 99 isim, arama, favori, günün esması (§26) — Arapça yazım ⛔T4
- [x] Hicri takvim + çift yönlü çevirici + gün düzeltmesi (§44)
- [x] Dini günler + geri sayım (§45) — 13 gün
- [x] Ay durumu: faz, aydınlanma, yaş (§46) — bilinen yeni ay anlarıyla sınandı

## FAZ 4 — Kur'an

- [x] Kur'an ana ekranı: son okunan, sureler, cüzler, yer imleri (§27) — sayfa listesi FAZ 5'te
- [x] Arapça metin içe aktarma (Tanzil) + doğrulama + checksum (§74) — 6236 âyet, bilinen sayılarla sınandı
- [x] Reader: Arapça / Arapça+Meal / Meal modları — hepsi çalışıyor (§28)
- [~] Reader ayarları: yazı boyutu ve tema tamam; satır aralığı hareke güvenliği için sabit oranlı, sayfa kipi FAZ 5'te (§28)
- [~] Âyet aksiyonları: favori, yer imi, not, paylaş, dinle ve meal tamam (kaynak künyesiyle); tefsir ⛔B2 (§28)
- [x] Son okunan + devam et (§29)
- [x] Yer imleri: renk, etiket, not (§30)
- [~] Favoriler tamam; koleksiyonlar FAZ 11'de (§31)
- [x] Arama: Arapça kelime + meal araması, nerede aranacağı seçilebilir (§35)
- [ ] Tefsir (§34)  ⛔B2 — tek kalan içerik engeli

## FAZ 5 — Kur'an sesi

- [x] Audio player: 18 okuyucu, çal/duraklat/ileri/geri, tekrar kipleri, hız (§32)
- [x] Arka planda oynatma (UIBackgroundModes: audio), sessiz kipte de duyulur (§32)
- [x] Okunan âyet çalarken düğmesi duraklat'a döner; kuyruk otomatik ilerler (§32)
- [x] İndirme yöneticisi: sure sure indirme, ilerleme, depolama göstergesi, silme (§33)

## FAZ 6 — Kıble

- [x] GPS + pusula, büyük daire hesabı (§36)
- [x] Derece, mesafe, geometrik pusula kadranı (§36)
- [x] Doğruluk göstergesi, kalibrasyon ve manyetik girişim uyarısı (§36)
- [x] Hizalanınca haptic — bir kez, reduced-motion'da kapalı (§36)
- [x] Pusula yalnız Kıble ekranında ve ekran öndeyken aktif (§81)

## FAZ 7 — Zikir, dualar, esma, hadis, bilgi

- [x] Zikirmatik: 8 hazır zikir, 6 hedef, özel zikir, haptic (§37)
- [x] Özel zikir oluşturma (§37)
- [x] Zikir istatistiği: günlük/haftalık/aylık + 14 günlük grafik + seri (§38)
- [~] Dua veritabanı: 14 kategori, 34 özgün Türkçe dua; me'sûr duaların Arapça metni ⛔B3 (§39)
- [~] Dua favori ve kategori süzme tamam; arama ve ses FAZ 11'de (§39)
- [ ] Hadis kütüphanesi (§52)  ⛔B3
- [x] İslami bilgi kütüphanesi: 43 madde, 6 konu, arama (§53)

## FAZ 8 — İbadet rehberi ve takip

- [~] Namaz rehberi: abdest, hazırlık, kılınış, rekât sayıları, seferîlik, özür — 6 bölüm, 33 adım. Namazda okunan sûre ve duaların Arapça metni **eksik**: B1 kalktığı için artık engel yok, yazılacak (§40)
- [x] Kaza namazı: 6 sayaç, toplu giriş, +/-, geçmiş, geri alma, ilerleme (§41)
- [x] İbadet defteri: gün gün namaz, Kuran dakikası, not (§42)
- [x] Oruç takibi: Ramazan/kaza/nafile (§49)

## FAZ 9 — Zekât, Ramazan, mukabele, cuma, hac

- [x] Zekât: nakit/döviz/altın/gümüş/yatırım/ticari/alacak/borç + fitre (§43)
- [~] Nisap (altın/gümüş ölçüsü seçmeli) + metodoloji ekranda yazılı; fiyatı kullanıcı girer, canlı piyasa verisi bilerek yok (§43)
- [x] Ramazan modu: iftar/imsak geri sayımı, 30 günlük takvim, ana sayfa kartı (§47)
- [x] Mukabele: 30 cüz takibi, hedef tempo hesabı, okuyucu entegrasyonu (§48)
- [x] Cuma modu: yalnız cuma günü görünen kart, Kehf kısayolu (§50)
- [x] Hac/Umre rehberi: 4 bölüm, 17 adım + 18 maddelik hazırlık listesi, tamamen çevrimdışı (§54)

## FAZ 10 — Hesap ve eşitleme

- [x] Misafir kullanım (§57) — hesap yok; Hesap ekranı verinin nerede durduğunu anlatıyor (D12)
- [ ] Sign in with Apple / Google / Email (§57)  ⛔B5
- [~] Cloud sync **v2'ye alındı** (D12): birleştirme motoru hazır ve sınandı, taşıma katmanı v2'de ⛔B5
- [x] Çevrimdışı öncelikli birleştirme ve çakışma çözümü (§58) — mezar taşı, kararlı çözüm, sayaç birleştirme; 17 sınama
- [x] Profil ve ayarlar (§59, §60) — tema, dil, bildirim, kıraat, tanılama, hesap
- [ ] Hesap silme, veri dışa aktarma, KVKK/GDPR (§69)  ⛔B5

## FAZ 11 — Arama, paylaşım, hatırlatıcı

- [x] Akıllı global arama (§51) — sure adı, âyet başvurusu (2:255 / bakara 255), dua, esmâ, bilgi, Arapça metin
- [x] Türkçe + Arapça normalizasyon, diacritics-aware (§78)
- [x] Paylaşım kartı: hikâye/kare/dikey, açık-koyu tema, kaynak künyesi **kaldırılamaz** (§62)
- [x] Birleşik favoriler (§63) — dua, esmâ, âyet aynı listede
- [x] Özel hatırlatıcılar (§64) — sabit saat ve vakte göre, hafta günü seçimi

## FAZ 12 — Widget ve Live Activity

- [ ] iOS widget: small/medium/large (§19)  ⛔B6
- [ ] Android widget (§19)
- [ ] Günün Âyeti / Hadisi widget (§19)  ⛔B1,B3
- [ ] Live Activities: lock screen (§18)  ⛔B6
- [ ] Dynamic Island: compact/minimal/expanded (§18)  ⛔B6

## FAZ 13 — Topluluk

- [ ] Anonim dua talebi (§55)  ⛔B5
- [ ] "Dua ettim" etkileşimi (§55)  ⛔B5
- [ ] Report / block / moderation / rate limit / spam-profanity koruma (§55)  ⛔B5

## FAZ 14 — AI asistan

- [ ] Retrieval-backed mimari, onaylı kaynak havuzu (§56)  ⛔B8
- [ ] Kaynak gösterimi, ihtilaf belirtimi, fetva reddi (§56)  ⛔B8
- [x] AI çıktısı içerik veritabanına yazmaz (§56) — şema düzeyinde engelli, v2'de de geçerli

## FAZ 15 — Admin panel

- [ ] Web admin paneli (§72)  ⛔B5
- [ ] İçerik yönetimi: âyet/hadis/dua/makale/dini gün/kaynak (§72)  ⛔B5
- [ ] Push kampanyaları, topluluk moderasyonu, raporlar (§72)  ⛔B5
- [ ] Rol tabanlı erişim + audit log (§72)  ⛔B5
- [x] İçerik doğrulama akışı: DRAFT→REVIEW→VERIFIED→PUBLISHED (§73) — şema + RLS, taslak son kullanıcıya görünmez

## FAZ 16 — Abonelik ve reklam

- [x] Freemium dağılımı (§66) — ibadetin kendisi hiç kilitlenmez, sınamayla korunuyor
- [ ] Aylık/yıllık abonelik, StoreKit + Play Billing (§67)  ⛔B6,B7
- [ ] Fiyat mağazadan, restore, manage, doğrulama (§67)  ⛔B6,B7
- [x] Reklam yerleşim kuralları (§68) — vakte yakın, okuyucuda, kıblede ve zikirde reklam yok
- [x] Uygunsuz reklam kategorisi engelleme + yaş derecesi G (§68)

## FAZ 17 — Erişilebilirlik, performans, güvenlik

- [x] VoiceOver/TalkBack etiketleri, Dynamic Type sınırı, WCAG AA kontrast, 44 birim dokunma hedefi (§79) — hepsi sınamayla denetleniyor
- [x] Reduced motion (titreşim ve animasyon durur), erişilebilirlik etiketleri (§79)
- [x] Sanal listeler (sure, esmâ, arama, bildirim), memoization, ölçülü toplu çizim (§80) — sınamayla denetleniyor
- [x] Pil: tek seferlik GPS, pusula yalnız kıble ekranında, geri sayım arka planda durur (§81) — sınamayla denetleniyor
- [x] Güvenlik: gömülü sır taraması, SecureStore, her girdi şemadan geçer (§89)
- [x] Gizlilik: konum/e-posta/not günlükte maskeli, analitik kapalı başlar, kişisel veri sunucuya gitmiyor (§69, §84)
- [x] Çökme kaydı + kişisel veri temizleme (§85) — kayıt cihazda kalır, kullanıcı kendisi paylaşır

## FAZ 18 — Test

- [x] Unit testler (§86) — 480 mantık sınaması
- [~] Bütünleşme: içe aktarma boruhattı, içerik kanalı ve RLS uçtan uca sınanıyor; E2E cihaz testi ⛔E3 (§86)
- [x] Component testler (§86) — jest-expo ile 16 bileşen sınaması
- [ ] E2E testler (§86)
- [x] Kritik: namaz vakti, timezone, DST, hicri, kıble, zekât, ay (§86)
- [~] Kritik: Kur'an bütünlüğü, meal bütünlüğü, RLS, çevrimdışı birleştirme sınandı; abonelik ⛔B6/B7 (§86)
- [x] Uç durum matrisi (§88) — kutup enlemleri, gece yarısını aşan yatsı, DST geçişi, boş/bozuk veri, ağ yokluğu
- [~] Cihaz matrisi RELEASE_CHECKLIST'te tanımlı; gerçek cihazda koşulacak ⛔E3 (§87)

## FAZ 19b — Marka (BEŞ)

- [x] Marka adı BEŞ, sembol 5; eski ad kullanıcıya görünen her yerden kaldırıldı (D15)
- [x] Koyu ve açık master logo — **bitmiş master PNG'den** (D17); depoda logo çizilmez
- [x] Elle çizilmiş `assets/brand/svg/` kaldırıldı; `.svg` dönerse sınama düşüyor
- [x] Esnetme yok: üretilen ikonun oranı masterınkiyle karşılaştırılıyor
- [x] Duyarlı işaret: tam / orta / mikro kademe, küçük boy ölçülerek denetlendi
- [x] iOS ikonu (köşesiz), Android adaptive + monokrom ikon, bildirim rozeti, açılış, favicon
- [x] Design token'ları merkezi; tema dışında düz renk kodu yasak (sınamayla)
- [x] Açık tema fildişine geçirildi, saf beyaz yüzey kaldırıldı
- [x] Bildirim metinleri markaya uyarlandı (başlık vakit adını tekrar etmiyor)
- [x] Mağaza adı, alt başlık, anahtar kelimeler, iki mağaza açıklaması
- [x] Ekran görüntüsü hikâyesi (7 kare) yazıldı
- [x] `BRAND_GUIDELINES.md`
- [x] Marka tutarlılık sınaması (`brand.test.ts`)
- [~] Widget · Live Activity · Dynamic Island · Watch — tasarımları kılavuzda
      tanımlı, native hedef gerektiği için kodda yok ⛔B6/B7

## FAZ 19 — Yayın

- [x] Ortam ayrımı: development/staging/production, ayrı bundle id (§96)
- [x] README, ARCHITECTURE, RELEASE_CHECKLIST, CONTENT_SOURCES, DECISIONS, KNOWN_ISSUES (§97)
- [x] Semantic versioning — marka ve paket sürümü eşitliği sınanıyor (§98)
- [~] iOS store gereklilikleri (§90) — metinler, sınır denetimi ve gizlilik etiketleri hazır; kayıt açılması ⛔B6
- [~] Google Play gereklilikleri (§91) — metinler ve veri güvenliği formu hazır; kayıt açılması ⛔B7
- [x] Son denetim: yarım iş işareti, kayıtsız ekran, olmayan yönlendirme, tanımsız çeviri anahtarı taraması (§101)
- [~] Beş kullanıcı yolculuğu RELEASE_CHECKLIST'e yazıldı; gerçek cihazda elle koşulacak ⛔E3 (§102)
- [ ] /final-screenshots/ (§110)
