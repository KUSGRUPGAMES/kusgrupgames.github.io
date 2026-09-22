# KUŞ GRUP uygulama deposu

Birden çok ürün, tek depo. Her ürün kendi klasöründe **bağımsızdır**: kendi
`www/index.html`, `app.config.json`, `tools/`, `store/`, `native/`, `marketing/`
ve `assets/` klasörü vardır. Ortak olan yalnızca `docs/` (GitHub Pages) ve
`.github/workflows/`.

**Hepsi oyun değil.** `slot`, `latch`, `orbita` oyundur; `lull` bir nefes/uyku
uygulaması, `bes` bir ezan vakti/Kur'an uygulamasıdır. Altyapı aynı, ürün tipi farklı —
bir klasörde çalışırken önce onun kendi `CLAUDE.md`'sini oku.

## Değişmez kurallar

1. **Ürün mantığı tek dosyada kalır:** `<ürün>/www/index.html`. Yeni dosya açma;
   kullanıcı yazılımcı değil, tek dosyayı kopyalayarak güncelleme yapabilmeli.
   **İstisna: `bes/`.** O ürün Expo + TypeScript ile çok dosyalı kurulur;
   gerekçesi `DECISIONS.md` D3'te yazılı (widget, Live Activity, arka plan ses
   ve Supabase tek dosyaya sığmaz). Diğer beş üründe kural aynen geçerlidir.
2. Bir oyunda çalışırken **o oyunun kendi `CLAUDE.md`'sini oku** — denge, adalet
   garantisi ve tuzaklar orada yazılı. Bu dosya yalnızca depo düzenini anlatır.
3. Her değişiklikten sonra ilgili oyunda `node tools/check.js`. Yeşil değilse commit yok.
4. **Git commit mesajı sadece sürüm numarasıdır** (`v1.0.1`) — tek oyunu ilgilendiren
   değişikliklerde `latch: v1.0.1` biçimi de kabul.
5. Kimlik bilgileri (bundle id, e-posta, AdMob, Pages adresi) **yalnız
   `<oyun>/app.config.json`** içinde değişir, ardından `bash tools/set-identity.sh`.
   Betik, dosyalarda **şu an yazılı olan** değerleri `OLD_MAIL / OLD_URL / OLD_ID`
   sabitlerinden bilir; çalıştırdıktan sonra bu sabitlere de yeni değeri yaz.
   Bayat kalırlarsa betik sessizce hiçbir şey değiştirmez — `OLD_URL` bir kez böyle
   bayatladı. Artık `check.js` bunu **hata** olarak yakalıyor.
6. Token tasarrufu: oyun dosyaları ~1200-1300 satırdır, tamamını okuma; `grep -n` kullan.
7. **Gördüğün hatayı sorma, düzelt.** Bir hata fark edildiğinde "istersen düzeltirim"
   denmez; düzeltilir, doğrulanır ve sonra "düzelttim" denir. Kullanıcı yazılımcı
   değil — hangi hatanın düzeltilmeye değer olduğuna karar vermesi beklenemez.
   Bu kural hangi üründe çalışılırsa çalışılsın geçerlidir.
8. **Bir üründe bulunan hata, aynı kodun kopyalandığı her üründe aranır.** Klasörler
   birbirinden kopyalanarak açıldığı için bir hata neredeyse hiçbir zaman tek yerde
   değildir. Düzeltmeden önce `grep -rn "<hatalı kalıp>" */tools/` çalıştır ve
   hepsini birlikte düzelt. (`film.sh` içindeki çıplak `wait` tam olarak böyleydi:
   bir üründe yakalandı, aynısı `lull`'da duruyordu.)

## GitHub Pages

Tek ayar: **Settings → Pages → `main` / `docs`**. Yayınlanan adres:

```
https://kusgrupgames.github.io/<oyun>/privacy.html
```

- `docs/.nojekyll` **silinmemeli**: Jekyll alt çizgiyle başlayan `_style.css`
  dosyasını yayınlamaz, sayfalar çıplak HTML olarak açılır.
- Ortak stil `docs/_style.css`; vurgu rengi sayfanın `<html data-game="...">`
  niteliğinden gelir. Yeni oyun için CSS'e bir satır ekle.

## Bulutta derleme

`.github/workflows/android.yml` her push'ta matristeki tüm oyunları derler:
`npx cap add android` → `tools/android-prepare.sh` → AAB + debug APK.

- **Java 21 zorunlu.** Capacitor 7 ile JDK 17 kullanırsan
  `invalid source release: 21` hatası alırsın (bu hata bir kez yaşandı).
- İmzalı AAB için 4 secret: `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`,
  `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Yoksa imzasız derler (doğrulama amaçlı).
- `tools/android-prepare.sh` native/android.md'deki tüm elle adımları otomatik
  uygular; `android/` klasörü her silindiğinde tekrar çalıştırılır.

## Oyunlar

| Klasör | Oyun | Not |
|---|---|---|
| `slot/` | Slot: Fit the Shape | şekli döndür, duvardaki deliğe otur |
| `latch/` | Latch: One Tap Swing | ipi at, salın, 45°'de bırak |
| `orbita/` | Orbita: One Tap Orbit Jump | yörüngeden teğet boyunca fırla |
| `lull/` | Lull: Breathe Yourself Down | **oyun değil** — nefesini ölçüp yavaşlatır |
| `bes/` | BEŞ: Ezan ve Namaz Vakitleri | **oyun değil, tek dosya değil** — Expo + TS; durum `PROJECT_STATE.md` |

Her oyunun kendi `CLAUDE.md`'si var; denge ve tuzaklar orada.

**Self-test garantileri oyundan oyuna FARKLI — karıştırma:**

| Oyun | Yapay oyuncu | Ne kanıtlıyor |
|---|---|---|
| `slot/` | mükemmel | `deaths=0` zorunlu → üretim adaletli |
| `latch/` | mükemmel | `deaths=0` **ve** `fallback=0` zorunlu → her çengel ulaşılabilir |
| `orbita/` | sezgisel (ölebilir) | yalnızca oyun döngüsünün çalıştığı ve çökmediği |
| `lull/` | hızlandırılmış seans | tempo **iniyor** (artmıyor), veriş/alış oranı 1'in altına düşmüyor, seans tam süresinde bitiyor |
| `bes/` | yok — hesap sınaması + görsel denetim | bilinen kıble/gündüz değerleri tutuyor, altı vakit sıralı; 128 kare (açık/koyu/320 piksel/Arapça) hata, boş ekran ve taşma için taranıyor |

Orbita'nınki daha zayıf bir güvence: ölüm sayısı > 0 olması hata değildir. Orbita'ya
"adaletsiz bölüm üretilmiyor" güvencesi eklemek istersen önce mükemmel oynayan bir
yapay oyuncu yazman gerekir; şu anki sezgisel oyuncu buna yetmez.

## Sağlıkla ilişkili ürünler

`lull` gibi nefes/uyku/gevşeme ürünlerinde **tıbbi sorumluluk reddi zorunludur**
ve silinmemelidir: tıbbi cihaz olmadığı, teşhis/tedavi etmediği, baş dönmesinde
bırakılması gerektiği, araç kullanırken kullanılmaması. `docs/<ürün>/terms.html`,
`privacy.html` ve `gizlilik.html` içinde yazılıdır; App Review bunu sorar.

Mağaza metinlerinde ve tanıtımda **sağlık iddiası yapma** — "uykusuzluğu tedavi
eder", "anksiyeteyi geçirir" hem yanlış hem de mağaza reddi sebebidir.

## Yeni ürün eklemek

1. En yakın oyunun klasörünü kopyala: `cp -r latch yenioyun`
2. `yenioyun/app.config.json`: `gameId`, `appName`, `bundleId`, `pagesBaseUrl`
   (`https://kusgrupgames.github.io/yenioyun`), `version` 1.0.0, `versionCode` 1.
3. `bash tools/set-identity.sh` (yenioyun içinde) — adresleri her yere yazar.
4. `docs/yenioyun/` klasörünü aç, `docs/latch/` sayfalarını kopyalayıp oyuna göre
   yaz; `docs/index.html` listesine kart ekle; `docs/_style.css` içine renk satırı.
5. `.github/workflows/android.yml` matrisine `- app: yenioyun / dir: yenioyun` ekle.
6. Oyunu yaz, `bash tools/gen.sh`, `node tools/check.js`.

**Görsel çıta — bu bir kez pahalıya mal oldu.** Dördüncü bir oyun (strateji/savunma)
mekaniği ölçülmüş ve dengeli olmasına rağmen **görselliği yüzünden** iptal edildi:
oynanabilir sürüm, motorun üstüne düz dairelerle çizilmiş bir hata ayıklama
görünümüyle teslim edildi. Ders şu:

- **Sorun soyutluk değil.** Slot da soyut — kareler ve çokgenler — ama degrade
  dolgusu, parlaması, parçacıkları ve derinliği var; tasarlanmış görünüyor.
  Ölçüt bu: `slot/assets/screenshots/` içindeki kareler.
- **Geçici görünüm oynatılmaz.** Mekaniği doğrulamak için düz şekiller çizmek
  doğrudur; onu kullanıcıya "oyun" diye sunmak değildir. Sunmadan önce sanat
  geçişi yapılır: silüetler, parlama, parçacık, vuruş geri bildirimi, ekran
  sarsıntısı, tasarlanmış HUD.
- İptal edilen oyunun kodu geçmişte duruyor: `git show ba8caa4`.

## Bir ürünü kendi deposuna çıkarmak

```bash
cd latch && bash tools/extract-repo.sh ~/latch-game
```
Ortak `docs/latch/` sayfalarını da yanına alır ve stil yollarını düzeltir.
