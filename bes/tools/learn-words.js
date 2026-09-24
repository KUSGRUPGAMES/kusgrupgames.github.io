/**
 * Kur'an eğitimi için gerçek kelime verisini üretir — DECISIONS D26.
 *
 * Hiçbir kelime elle yazılmaz. Kaynak: kendi Tanzil metnimiz
 * (`assets/quran/quran.json`). Quran Foundation API'si yalnız **kelime
 * konumunu doğrulamak** ve kelime kelime ses dosyasının yolunu bulmak için
 * sorgulanır; QF'nin metni, çevirisi ya da harf çevirisi dosyaya yazılmaz
 * (şartları bir haftadan uzun saklamayı yasaklıyor).
 *
 * Her âyette bizim kelimelerimizle QF kelimeleri harf iskeletinde (hareke
 * ve tatvil atılmış hâlde) birebir karşılaştırılır; tek bir uyuşmazlıkta
 * araç durur — yanlış kelimeye yanlış ses bağlanmasın diye.
 *
 * Kullanım: node tools/learn-words.js  → src/content/learnData.json
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const KOK = path.join(__dirname, '..');
const CIKTI = path.join(KOK, 'src', 'content', 'learnData.json');
const QURAN = JSON.parse(fs.readFileSync(path.join(KOK, 'assets', 'quran', 'quran.json'), 'utf8'));

/** Pratik sureleri — öğretim sırası: namazda her rekâtta okunan Fâtiha önce. */
const PRATIK = [1, 112, 113, 114, 108, 103, 110, 105, 106, 107, 109, 111];
/** Örnek kelime havuzu: Fâtiha + Amme cüzü. */
const HAVUZ = [1, ...Array.from({ length: 37 }, (_, i) => 78 + i)];

const HAREKE = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const iskelet = (s) => s.replace(/\s+/g, '').replace(HAREKE, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ۥ|ۦ/g, '');

const BESMELE_KELIME = 4;

async function getir(url) {
  for (let deneme = 0; deneme < 4; deneme++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch { /* yeniden dene */ }
    await new Promise((res) => setTimeout(res, 800 * (deneme + 1)));
  }
  throw new Error(`alınamadı: ${url}`);
}

async function qfSure(no) {
  const ayetler = [];
  for (let sayfa = 1; ; sayfa++) {
    const d = await getir(`https://api.quran.com/api/v4/verses/by_chapter/${no}?words=true&word_fields=text_uthmani,audio_url&per_page=50&page=${sayfa}`);
    ayetler.push(...d.verses);
    if (!d.pagination?.next_page) break;
  }
  return ayetler;
}

function bizimKelimeler(sure, ayet) {
  const kayit = QURAN.ayahs.find((a) => a.surah === sure && a.ayah === ayet);
  if (!kayit) throw new Error(`yok: ${sure}:${ayet}`);
  let kelimeler = kayit.text.split(/\s+/).filter(Boolean);
  // Tanzil, 1. ve 9. sure dışında ilk âyetin başına Besmele ekler; QF eklemez.
  if (ayet === 1 && sure !== 1 && sure !== 9) kelimeler = kelimeler.slice(BESMELE_KELIME);
  return kelimeler;
}

async function main() {
  const sureler = {};
  for (const no of [...new Set([...PRATIK, ...HAVUZ])].sort((a, b) => a - b)) {
    const qf = await qfSure(no);
    const ayetler = [];
    for (const v of qf) {
      const qfKelime = v.words.filter((w) => w.char_type_name === 'word');
      const bizim = bizimKelimeler(no, v.verse_number);
      if (bizim.length !== qfKelime.length) {
        throw new Error(`${no}:${v.verse_number} kelime sayısı uyuşmuyor (${bizim.length} / ${qfKelime.length})`);
      }
      const kelimeler = bizim.map((t, i) => {
        const w = qfKelime[i];
        if (iskelet(t) !== iskelet(w.text_uthmani)) {
          throw new Error(`${no}:${v.verse_number}:${i + 1} uyuşmuyor: "${t}" / "${w.text_uthmani}"`);
        }
        // QF'de ses dosyası numarası kelime sırasından farklı olabiliyor
        // (durak işaretleri numara tüketiyor, ör. 78:37'de 007 yok). Numara
        // bu yüzden QF'nin kendi `audio_url` alanından alınır; sure ve âyet
        // kısmı yine de doğrulanır.
        const m = /^wbw\/(\d{3})_(\d{3})_(\d{3})\.mp3$/.exec(w.audio_url ?? '');
        if (!m || Number(m[1]) !== no || Number(m[2]) !== v.verse_number) {
          throw new Error(`${no}:${v.verse_number}:${i + 1} ses yolu beklenmedik: ${w.audio_url}`);
        }
        return [t, Number(m[3])];
      });
      ayetler.push({ ayah: v.verse_number, words: kelimeler });
    }
    sureler[no] = ayetler;
    process.stdout.write(`.${no}`);
  }
  console.log('');

  const cikti = {
    generatedBy: 'tools/learn-words.js',
    note: 'Kelimeler Tanzil metninden; konum ve ses yolu Quran Foundation ile doğrulandı. Kelime: [metin, ses dosyası no]. Ses: https://audio.qurancdn.com/wbw/SSS_AAA_KKK.mp3',
    practice: PRATIK,
    surahs: sureler,
  };
  fs.writeFileSync(CIKTI, `${JSON.stringify(cikti)}\n`);
  const kelimeSayisi = Object.values(sureler).flat().reduce((t, a) => t + a.words.length, 0);
  console.log(`yazıldı: ${path.relative(KOK, CIKTI)} — ${Object.keys(sureler).length} sure, ${kelimeSayisi} kelime`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
