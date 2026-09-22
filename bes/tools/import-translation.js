#!/usr/bin/env node
/**
 * Meal içe aktarma — şartname §74, CONTENT_SOURCES.
 *
 * Kullanım:
 *   node --experimental-strip-types tools/import-translation.js tr.yazir
 *   node --experimental-strip-types tools/import-translation.js tr.yazir <yerel-dizin>
 *
 * Kaynak: Tanzil (tanzil.net/trans/<id>). Metin birebir alınır, değiştirilmez.
 * Doğrulama geçmezse dosya **yazılmaz**.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'quran', 'translations');

/** Desteklenen mealler ve telif durumları. */
const CATALOG = {
  'tr.yazir': {
    id: 'tr-yazir',
    name: 'Elmalılı Hamdi Yazır',
    language: 'tr',
    years: '1878-1942',
    work: 'Hak Dini Kur’an Dili',
    rights: 'kamu-mali',
    // FSEK m.27: koruma, ölümü izleyen yıldan itibaren 70 yıl. Yazır 1942'de
    // vefat etti; koruma 31.12.2012'de sona erdi. Eser kamu malıdır.
    rightsNote: 'Mütercimin vefatı 1942; 5846 sayılı FSEK m.27 uyarınca koruma süresi 2012 sonunda doldu. Eser kamu malı statüsündedir.',
    sourceUrl: 'https://tanzil.net/trans/tr.yazir',
  },
};

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

function ayikla(ham) {
  const out = [];
  for (const satir of ham.split('\n')) {
    const s = satir.trim();
    if (!s || s.startsWith('#')) continue;
    const parts = s.split('|');
    if (parts.length < 3) continue;
    out.push({ surah: Number(parts[0]), ayah: Number(parts[1]), body: parts.slice(2).join('|').trim() });
  }
  return out;
}

async function main() {
  const tanzilId = process.argv[2];
  const yerel = process.argv[3];
  const meta = CATALOG[tanzilId];
  if (!meta) {
    console.error(`Bilinmeyen meal: ${tanzilId}`);
    console.error(`Tanımlı olanlar: ${Object.keys(CATALOG).join(', ')}`);
    console.error('Yeni meal eklemeden önce telif durumu CATALOG içine yazılmalıdır.');
    process.exit(1);
  }

  const ham = yerel
    ? fs.readFileSync(path.join(yerel, `${tanzilId}.txt`), 'utf8')
    : await indir(meta.sourceUrl);

  const rows = ayikla(ham);

  const quran = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'quran', 'quran.json'), 'utf8'));
  const { verifyTranslation, translationChecksum } = await import('../src/features/quran/verify.ts');

  const sonuc = verifyTranslation(rows, quran.surahs);
  if (!sonuc.ok) {
    console.error('DOGRULAMA BASARISIZ — dosya yazilmadi:');
    for (const p of sonuc.problems) console.error('  - ' + p);
    process.exit(1);
  }

  const paket = {
    id: meta.id,
    name: meta.name,
    language: meta.language,
    work: meta.work,
    years: meta.years,
    rights: meta.rights,
    rightsNote: meta.rightsNote,
    source: { name: 'Tanzil Project', url: meta.sourceUrl },
    checksum: translationChecksum(rows),
    // Yer kazanmak için sure sure dizilir: [surah][ayahIndex] = metin.
    rows: rows.map((r) => r.body),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dosya = path.join(OUT_DIR, `${meta.id}.json`);
  fs.writeFileSync(dosya, JSON.stringify(paket));
  const kb = Math.round(fs.statSync(dosya).size / 1024);
  console.log(`YAZILDI ${dosya} (${kb} KB)`);
  console.log(`  ${meta.name} · ${rows.length} satır · sağlama ${paket.checksum}`);
  console.log(`  telif: ${meta.rights} — ${meta.rightsNote}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
