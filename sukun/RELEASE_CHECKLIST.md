# Yayın kontrol listesi

Her sürümde baştan sona uygulanır. Bir madde atlanacaksa **neden atlandığı
yazılır**; sessizce geçilmez.

## 1. Kod sağlığı

- [ ] `npm run gate` yeşil (tsc + eslint + 480+ sınama)
- [ ] `npm run bundle` sorunsuz (Metro'nun yakaladığı hatalar kapıda görünmez)
- [ ] `bash tools/verify-db.sh` yeşil *(yalnız v2'de anlamlı)*
- [ ] Son denetim sınamaları geçiyor: taslak metin yok, her ekran kayıtlı,
      her yönlendirme hedefi var, her çeviri anahtarı tanımlı

## 2. İçerik

- [ ] `assets/quran/quran.json` sağlaması değişmediyse dokunulmadı
- [ ] Meal künyesi ekranda görünüyor (okuyucu, arama, paylaşım)
- [ ] Kıraat kataloğu güncel: `npm run probe:reciters` son 3 ayda çalıştırıldı
- [ ] `docs/sukun/content/tr.json` sürümü uygulamadakinden büyük değilse
      güncelleme gerekmiyor

## 3. Sürüm

- [ ] `src/config/brand.json` içindeki `version` artırıldı (semantik)
- [ ] `package.json` sürümü aynı değere getirildi
- [ ] `CHANGELOG.md` bu sürümün maddeleriyle güncellendi
- [ ] Git etiketi atıldı

## 4. Mağaza

- [ ] Ekran görüntüleri güncel (§110)
- [ ] Mağaza metinleri gözden geçirildi; **sağlık ya da dinî hüküm iddiası yok**
- [ ] Gizlilik sayfası yayında: `docs/sukun/privacy.html`
- [ ] Veri güvenliği formu: **kişisel veri toplanmıyor** (v1'de sunucu yok)
- [ ] Yaş derecesi ve reklam kategorisi ayarları konsolda G'ye sabitlendi
- [ ] EU DSA tüccar beyanı dolduruldu

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

- [ ] Uçak modunda uygulama açılıyor ve çalışıyor (çevrimdışı ürün sözü)
- [ ] Koyu ve açık temada bütün ekranlar okunuyor
- [ ] Yazı boyutu en büyükte düzen kırılmıyor
- [ ] VoiceOver/TalkBack ile ana akış geçilebiliyor
- [ ] Pil: pusula ekranı kapatıldığında ölçüm duruyor
