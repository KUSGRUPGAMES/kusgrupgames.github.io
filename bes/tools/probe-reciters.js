#!/usr/bin/env node
/**
 * Okuyucu kataloğunu **ölçerek** üretir — şartname §32, §33.
 *
 * Neden ölçüyoruz: CDN'de her okuyucunun her bit hızı yok. Elle yazılan bir
 * liste zamanla bayatlar ve kullanıcı "ses gelmiyor" der. Bu betik her
 * okuyucunun hangi bit hızlarında gerçekten dosya verdiğini sınar ve yalnız
 * çalışanları yazar.
 *
 * Kullanım: node tools/probe-reciters.js
 * Çıktı: assets/quran/reciters.json
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'assets', 'quran', 'reciters.json');
const CDN = 'https://cdn.islamic.network/quran/audio';
const EDITIONS_URL = 'https://api.alquran.cloud/v1/edition/format/audio';
const BITRATES = [128, 64];
/** Sınama âyeti: Bakara 255 (küresel 262). Uzun bir âyet, eksik dosyayı ele verir. */
const PROBE_AYAH = 262;

/** Türkçe okuyucu adları — arayüzde İngilizce ad gösterilmez. */
const TR_NAMES = {
  'ar.alafasy': 'Mişari Raşid el-Afasi',
  'ar.abdulbasitmurattal': 'Abdülbasit Abdüssamed (Murattal)',
  'ar.abdulsamad': 'Abdülbasit Abdüssamed',
  'ar.husary': 'Mahmud Halil el-Husari',
  'ar.husarymujawwad': 'Mahmud Halil el-Husari (Mücevved)',
  'ar.minshawi': 'Muhammed Sıddık el-Minşavi',
  'ar.minshawimujawwad': 'Muhammed Sıddık el-Minşavi (Mücevved)',
  'ar.abdurrahmaansudais': 'Abdurrahman es-Sudeys',
  'ar.saoodshuraym': 'Suud eş-Şüreym',
  'ar.mahermuaiqly': 'Mahir el-Muaykılı',
  'ar.shaatree': 'Ebu Bekir eş-Şatıri',
  'ar.ahmedajamy': 'Ahmed el-Acemi',
  'ar.hudhaify': 'Ali el-Huzeyfi',
  'ar.muhammadayyoub': 'Muhammed Eyyub',
  'ar.abdullahbasfar': 'Abdullah Basfar',
  'ar.hanirifai': 'Hani er-Rifai',
  'ar.muhammadjibreel': 'Muhammed Cibril',
  'ar.ibrahimakhbar': 'İbrahim el-Ahdar',
  'ar.parhizgar': 'Şehriyar Perhizgâr',
  'ar.aymanswoaid': 'Eymen Süveyd',
};

function istek(url, method = 'GET') {
  return new Promise((resolve) => {
    const req = https.request(url, { method, timeout: 20000 }, (res) => {
      const parcalar = [];
      res.on('data', (c) => parcalar.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(parcalar).toString('utf8') }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
    req.end();
  });
}

async function main() {
  const liste = await istek(EDITIONS_URL);
  if (liste.status !== 200) { console.error('Okuyucu listesi alınamadı'); process.exit(1); }
  const hepsi = JSON.parse(liste.body).data.filter((e) => e.language === 'ar');

  // CDN'de aynı okuyucunun ikinci bir baskısı "-2" ekiyle duruyor ve aynı
  // kaydı veriyor. Listede iki kez görünmesi kullanıcıyı şaşırtır; temel
  // kimlik varsa ikincisi atılır.
  const kimlikler = new Set(hepsi.map((e) => e.identifier));
  const editions = hepsi.filter((e) => {
    const temel = e.identifier.replace(/-\d+$/, '');
    return temel === e.identifier || !kimlikler.has(temel);
  });

  const out = [];
  for (const e of editions) {
    const calisan = [];
    for (const bit of BITRATES) {
      const r = await istek(`${CDN}/${bit}/${e.identifier}/${PROBE_AYAH}.mp3`, 'HEAD');
      if (r.status === 200) calisan.push(bit);
    }
    if (calisan.length === 0) {
      console.log(`  atlandı (ses yok): ${e.identifier}`);
      continue;
    }
    out.push({
      id: e.identifier,
      name: TR_NAMES[e.identifier] ?? e.englishName,
      englishName: e.englishName,
      bitrates: calisan,
      style: e.identifier.includes('mujawwad') ? 'mucevved' : 'murattal',
    });
    console.log(`  ${e.identifier} → ${calisan.join(', ')} kbps`);
  }

  const paket = {
    cdn: CDN,
    source: {
      name: 'Islamic Network',
      url: 'https://islamic.network',
      terms: 'https://alquran.cloud/terms-and-conditions',
      note: 'Kıraatler okuyucular veya mirasçıları tarafından Islamic Network’e lisanslanmıştır. Akış ve gömme serbesttir; telif okuyucularda kalır ve kaldırma talebi gelirse kaldırılır.',
    },
    probedAt: new Date().toISOString().slice(0, 10),
    reciters: out,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(paket, null, 2));
  console.log(`YAZILDI ${OUT} — ${out.length} okuyucu`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
