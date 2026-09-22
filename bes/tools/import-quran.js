#!/usr/bin/env node
/**
 * Kur'an metnini içe aktarır — şartname §74.
 *
 * Kaynak: Tanzil Project (tanzil.net). Metin **birebir** kopyalanır,
 * değiştirilmez; Tanzil'in kullanım şartı budur ve atıf uygulamada görünür.
 * Meta veri (sure adları, âyet sayıları, sayfa ve cüz başlangıçları) Tanzil'in
 * CC-BY lisanslı `quran-data.xml` dosyasından gelir.
 *
 * Kullanım:
 *   node tools/import-quran.js            # ağdan indir
 *   node tools/import-quran.js <dizin>    # yerel kopyadan
 *
 * Çıktı: assets/quran/quran.json  (sure meta verisi + 6236 âyet + sağlama)
 *
 * Doğrulama geçmezse **dosya yazılmaz**. Yarım veya bozuk mushaf metni
 * yayınlanmaz; bu, üzerinde pazarlık edilmeyen tek kuraldır.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'quran');
const OUT_FILE = path.join(OUT_DIR, 'quran.json');

const TEXT_URL = 'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true';
const META_URL = 'https://tanzil.net/res/text/metadata/quran-data.xml';

/** Türkçe sure adları — okunuş, bu ürün için yazıldı. */
const TR_NAMES = require('./surah-names-tr.json');

function indir(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        indir(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${url}`)); return; }
      const parcalar = [];
      res.on('data', (c) => parcalar.push(c));
      res.on('end', () => resolve(Buffer.concat(parcalar).toString('utf8')));
    }).on('error', reject);
  });
}

function ayetleriAyikla(ham) {
  const out = [];
  for (const satir of ham.split('\n')) {
    const s = satir.trim();
    if (!s || s.startsWith('#')) continue;
    const parts = s.split('|');
    if (parts.length < 3) continue;
    out.push({ surah: Number(parts[0]), ayah: Number(parts[1]), text: parts.slice(2).join('|').trim() });
  }
  return out;
}

function nitelik(etiket, ad) {
  const m = new RegExp(`${ad}="([^"]*)"`).exec(etiket);
  return m ? m[1] : null;
}

function metaAyikla(xml) {
  const sureler = [];
  for (const m of xml.matchAll(/<sura\b[^>]*\/>/g)) {
    const e = m[0];
    sureler.push({
      number: Number(nitelik(e, 'index')),
      ayahCount: Number(nitelik(e, 'ayas')),
      nameAr: nitelik(e, 'name'),
      nameEn: nitelik(e, 'ename'),
      revelation: nitelik(e, 'type') === 'Meccan' ? 'mekki' : 'medeni',
    });
  }

  const sayfalar = [];
  for (const m of xml.matchAll(/<page\b[^>]*\/>/g)) {
    const e = m[0];
    sayfalar.push({ index: Number(nitelik(e, 'index')), surah: Number(nitelik(e, 'sura')), ayah: Number(nitelik(e, 'aya')) });
  }

  const cuzler = [];
  for (const m of xml.matchAll(/<juz\b[^>]*\/>/g)) {
    const e = m[0];
    cuzler.push({ index: Number(nitelik(e, 'index')), surah: Number(nitelik(e, 'sura')), ayah: Number(nitelik(e, 'aya')) });
  }

  const secdeler = [];
  for (const m of xml.matchAll(/<sajda\b[^>]*\/>/g)) {
    const e = m[0];
    secdeler.push({ surah: Number(nitelik(e, 'sura')), ayah: Number(nitelik(e, 'aya')) });
  }

  return { sureler, sayfalar, cuzler, secdeler };
}

/** Her âyete sayfa ve cüz numarası yazar. */
function konumEkle(ayetler, sayfalar, cuzler, secdeler) {
  const anahtar = (s, a) => s * 1000 + a;
  const sayfaBas = new Map(sayfalar.map((p) => [anahtar(p.surah, p.ayah), p.index]));
  const cuzBas = new Map(cuzler.map((j) => [anahtar(j.surah, j.ayah), j.index]));
  const secdeKume = new Set(secdeler.map((s) => anahtar(s.surah, s.ayah)));

  let sayfa = 1;
  let cuz = 1;
  for (const a of ayetler) {
    const k = anahtar(a.surah, a.ayah);
    if (sayfaBas.has(k)) sayfa = sayfaBas.get(k);
    if (cuzBas.has(k)) cuz = cuzBas.get(k);
    a.page = sayfa;
    a.juz = cuz;
    a.sajda = secdeKume.has(k);
  }
}

async function main() {
  const yerel = process.argv[2];
  const hamMetin = yerel
    ? fs.readFileSync(path.join(yerel, 'quran-uthmani.txt'), 'utf8')
    : await indir(TEXT_URL);
  const hamMeta = yerel
    ? fs.readFileSync(path.join(yerel, 'quran-data.xml'), 'utf8')
    : await indir(META_URL);

  const ayetler = ayetleriAyikla(hamMetin);
  const { sureler, sayfalar, cuzler, secdeler } = metaAyikla(hamMeta);
  konumEkle(ayetler, sayfalar, cuzler, secdeler);

  // Sure meta verisini Türkçe adlar ve sayfa/cüz başlangıçlarıyla tamamla.
  for (const s of sureler) {
    const ilk = ayetler.find((a) => a.surah === s.number && a.ayah === 1);
    s.pageStart = ilk ? ilk.page : 1;
    s.juzStart = ilk ? ilk.juz : 1;
    const tr = TR_NAMES[String(s.number)];
    if (!tr) throw new Error(`Türkçe sure adı eksik: ${s.number}`);
    s.nameTr = tr.name;
    s.meaningTr = tr.meaning;
  }

  // Doğrulama: **uygulamanın kullandığı modülün aynısı**. Kopya mantık yok;
  // betik de uygulama da aynı dosyadan geçer. TypeScript kaynağı Node'un
  // tip sıyırma kipiyle doğrudan yüklenir (bkz. package.json: import:quran).
  const { verifyAyahs, ayahsChecksum, PAGE_COUNT, JUZ_COUNT } =
    await import('../src/features/quran/verify.ts');

  const sonuc = verifyAyahs(ayetler, sureler);
  const ekSorunlar = [];
  if (sayfalar.length !== PAGE_COUNT) ekSorunlar.push(`sayfa sayısı ${sayfalar.length}, beklenen ${PAGE_COUNT}`);
  if (cuzler.length !== JUZ_COUNT) ekSorunlar.push(`cüz sayısı ${cuzler.length}, beklenen ${JUZ_COUNT}`);

  const sorunlar = [...sonuc.problems, ...ekSorunlar];
  if (sorunlar.length > 0) {
    console.error('DOGRULAMA BASARISIZ — dosya yazilmadi:');
    for (const p of sorunlar) console.error('  - ' + p);
    process.exit(1);
  }

  const paket = {
    source: {
      name: 'Tanzil Project',
      url: 'https://tanzil.net',
      text: 'Uthmani',
      note: 'Metin birebir kopyalanmıştır; değiştirilmemiştir.',
      metadataLicense: 'CC BY (quran-data.xml)',
    },
    checksum: ayahsChecksum(ayetler),
    surahs: sureler,
    ayahs: ayetler,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(paket));
  const kb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`YAZILDI ${OUT_FILE} (${kb} KB)`);
  console.log(`  sure ${sureler.length} · âyet ${ayetler.length} · sağlama ${paket.checksum}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
