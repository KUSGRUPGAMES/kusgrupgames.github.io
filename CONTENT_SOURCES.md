# CONTENT SOURCES

Dinî içeriğin **tek tek** kaynağı. Şartname §73, §74, §75 ve §107 gereği:
kaynağı olmayan dinî içerik üretimde yayınlanmaz, AI âyet/hadis/dua üretmez.

## Durum tablosu

| İçerik | Kaynak | Lisans durumu | Uygulamada |
|---|---|---|---|
| Kur'an Arapça metni | [Tanzil Project](https://tanzil.net/download/) | **Kullanılabilir** — verbatim kopyalama izinli, değiştirmek yasak, atıf ve tanzil.net bağlantısı şart | **İçe aktarıldı** (6236 âyet, sağlama doğrulandı); künye okuyucuda, aramada ve paylaşımda görünür |
| Türkçe meal | **Elmalılı Hamdi Yazır**, *Hak Dini Kur'an Dili* — Tanzil `tr.yazir` baskısı | **Kamu malı** — mütercim 1942'de vefat etti; FSEK m.27 koruma süresi 31.12.2012'de doldu | **Var** (6236 satır, sağlama doğrulandı); künye okuyucuda, aramada ve paylaşımda görünür |
| Tefsir | — | **YOK** (B2) | Şema hazır, veri yok |
| Hadis külliyatı | — | **YOK** (B3) | Şema hazır, veri yok |
| Kıraat kayıtları | [Islamic Network CDN](https://cdn.islamic.network) | **Akış ve indirme serbest** — kayıtlar okuyuculardan lisanslı; telif okuyucularda, kaldırma talebinde kaldırılır ([şartlar](https://alquran.cloud/terms-and-conditions) Böl. IV) | **Var** — 18 okuyucu, akış + isteğe bağlı indirme; paketle dağıtılmaz |
| ~~QuranicAudio.com~~ | — | **Kullanılmadı** — şartlarında ticari kullanım açıkça yasak | Elendi |
| Esmâü'l-Hüsnâ (okunuş + Türkçe anlam) | Bu uygulama için yazıldı | Özgün | Var |
| Dua metinleri (okunuş + anlam) | Bu uygulama için yazılacak | Özgün | FAZ 7 |
| Arapça yazı tipi (Amiri, Amiri Quran) | [Amiri Project](https://github.com/aliftype/amiri) | **Kullanılabilir** — SIL Open Font License 1.1; lisans metni paketle dağıtılıyor (`bes/assets/fonts/Amiri-OFL.txt`) | Var |
| Namaz vakti hesabı | Astronomik hesap, cihazda | Kaynak gerekmez | Var |
| Hicrî takvim | Aritmetik takvim | Kaynak gerekmez, sapma arayüzde yazılı | Var |

## İçerik güncelleme kanalı

Metin içeriği (dua, bilgi maddesi, dinî gün düzeltmesi) uygulama güncellemesi
beklemeden yenilenebilir: `docs/bes/content/tr.json`. Kanal statik dosyadır,
sunucu yoktur (DECISIONS D12). Kural: sürüm numarası artmadan içerik değişmez,
şemaya uymayan paket yok sayılır ve **kanal hiçbir şeyi silemez**.

**Âyet, meal ve hadis bu kanaldan geçmez** — onlar paketle gelir ve içe
aktarmada doğrulanır.

## Değişmez kurallar

1. **Mushaf metni ezberden dizilmez.** Tek bir harekenin yanlış olması kabul
   edilemez bir hatadır. Yalnız doğrulanmış kaynaktan içe aktarılır ve
   içe aktarma sonrası âyet sayısı + checksum doğrulanır (§74).
2. **Hadis kaynaksız yayınlanamaz.** Eser, kitap/bölüm ve numara alanları
   zorunludur; boşsa içerik `VERIFIED` olamaz (§75).
3. **Kaynak arayüzde görünür.** Meal, tefsir ve hadiste kaynak kullanıcıya
   gösterilir (§107).
4. **AI çıktısı içerik veritabanına yazılmaz** (§56).
5. **Kamu malı ≠ her baskı serbest.** Elmalılı'nın eseri kamu malıdır; ama
   sonradan yapılmış bir *sadeleştirme* FSEK m.6 anlamında işlenme eserdir ve
   kendi koruma süresine tabidir. Bu yüzden künye (mütercim, vefat yılı,
   kaynak baskı) uygulamada görünür tutulur ve metin tek dosyadan
   değiştirilebilir.

## Lisans alınırken sorulacaklar

- Eserin adı, sürümü ve hak sahibi
- Dijital dağıtım izni kapsamı (mobil uygulama, çevrimdışı kopya)
- Ticari kullanım (reklamlı/abonelikli uygulama) izni
- Atıf metninin nasıl görünmesi gerektiği
- Süre ve fesih koşulları
