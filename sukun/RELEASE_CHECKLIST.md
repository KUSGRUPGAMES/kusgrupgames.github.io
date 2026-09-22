# Yayın kontrol listesi

Her sürümde baştan sona uygulanır. Bir madde atlanacaksa **neden atlandığı
yazılır**; sessizce geçilmez.

## 1. Kod sağlığı

- [x] `npm run gate` yeşil — tsc + eslint + **611 sınama / 45 takım** (v1.0.0)
- [x] `npm run bundle` sorunsuz (Metro'nun yakaladığı hatalar kapıda görünmez)
- [ ] `bash tools/verify-db.sh` — **v1'de çalıştırılmadı**: Supabase yok (B5), v1 sunucusuz
- [x] Son denetim sınamaları geçiyor: taslak metin yok, her ekran kayıtlı,
      her yönlendirme hedefi var, her çeviri anahtarı tanımlı

## 2. İçerik

- [x] `assets/quran/quran.json` dokunulmadı (son değişiklik v0.6.0, `13c127c`)
- [x] Meal künyesi ekranda görünüyor (okuyucu, arama, paylaşım)
- [ ] Kıraat kataloğu: `npm run probe:reciters` **çalıştırılmadı** — kapsayıcıdan CDN'e çıkış yok. Katalog v0.6.0'da doğrulanmıştı; ilk yayından sonra tekrar bakılmalı.
- [x] `docs/sukun/content/tr.json` sürüm 1; içerik kanalı v1'de hiçbir ekrana
      bağlı değil, güncelleme gerekmiyor

## 3. Sürüm

- [x] `src/config/brand.json` → **1.0.0**
- [x] `package.json` → **1.0.0**
- [x] `CHANGELOG.md` 1.0.0 maddesi yazıldı
- [ ] Git etiketi atıldı *(dal `main`'e birleştikten sonra `v1.0.0`)*

## 4. Mağaza

- [x] `npm run store:shots` çalıştırıldı; `store/screenshots/` güncel
      (App Store 1290×2796 ×7, Play 1080×1920 ×7, öne çıkan 1024×500, ikon 512×512)
- [x] Mağaza metinleri gözden geçirildi; **sağlık ya da dinî hüküm iddiası yok**
- [x] **Metinler yalnız var olan özellikleri anlatıyor.** Bir kez tersi oldu:
      açıklamada reklam kuralları ve Pro aboneliği yazıyordu, ikisi de kodda
      dormant. "Metadata describes functionality not present" doğrudan ret
      sebebidir. `security.test.ts` bunu artık denetliyor.
- [x] Gizlilik sayfası hazır: `docs/sukun/privacy.html` ve `gizlilik.html` *(Pages'te görünmesi için dal `main`'e birleşmeli)*
- [ ] İki konsolun formu `store/app-privacy.md` içindeki yanıtlarla dolduruldu
      (ikisinde de **veri toplanmıyor**) — **sende**: yanıtlar hazır, konsola girilecek
- [ ] Yaş derecesi 4+ / Herkes; reklam sorusu yok (reklam gösterilmiyor) — **sende**
- [ ] EU DSA tüccar beyanı dolduruldu — **sende**

## 5. Elle sınama — beş kullanıcı yolculuğu (§102)

Her biri **gerçek cihazda**, uçak modunda bir kez daha tekrarlanır:

1. **İlk açılış**: onboarding → konum seç → yöntem seç → bildirim izni →
   ana sayfada doğru vakit görünüyor mu
2. **Vakit takibi**: geri sayım ilerliyor mu, vakit girince bildirim geldi mi,
   aylık takvim doğru mu
3. **Kur'an**: sure aç → meal modunu değiştir → âyet seç → yer imi, not,
   paylaşım kartı → kaldığın yerden devam
4. **Kıraat**: okuyucu seç → âyet dinle → sure indir → **uçak moduna al** →
   indirilen sure hâlâ çalıyor mu
5. **İbadet**: zikir çek ve kaydet → kaza sayacını azalt → ibadet defterine
   gün işle → hepsi uygulama kapanıp açılınca duruyor mu

## 6. Son kontrol

- [ ] Uçak modunda uygulama açılıyor ve çalışıyor (çevrimdışı ürün sözü) *(gerçek cihazda)*
- [x] Koyu ve açık temada bütün ekranlar okunuyor — `npm run preview`
      dört geçiş çiziyor (açık, koyu, 320 piksel, Arapça) ve her karede
      çalışma hatası, boş ekran ve yatay taşma denetleniyor
- [ ] Yazı boyutu en büyükte düzen kırılmıyor *(gerçek cihazda; web hedefi
      Dynamic Type ölçeğini uygulamıyor — 320 piksellik geçiş en yakın vekil)*
- [ ] VoiceOver/TalkBack ile ana akış geçilebiliyor *(gerçek cihazda)*
- [ ] Pil: pusula ekranı kapatıldığında ölçüm duruyor *(gerçek cihazda)*
- [x] Beş dilin beşinde de arayüz **tam** çevrili — `i18n.test.ts` dört dilin
      Türkçenin tamamını karşıladığını her koşuda doğruluyor (573 anahtar)
- [ ] **Arapça sekme adları gerçek cihazda okunuyor** — web denetiminde `ر`
      çizilmiyor (KNOWN_ISSUES T6). Nedeni bulunamadı; cihazda dizgi yolu
      farklı olduğu için orada bakılmalı.
