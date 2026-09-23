#!/usr/bin/env node
/**
 * Expo native modül sürüm denetimi.
 *
 * `npx expo install --check` yalnız `package.json`da BEYAN EDİLMİŞ
 * bağımlılıkları SDK'nın beklediğiyle karşılaştırır. `expo-asset` bir kez
 * hiç beyan edilmeden node_modules'da SDK'nın beklediğinden 51 sürüm ileride
 * (57.0.18 yerine ~12.0.13) durdu ve bu yüzden `--check` onu hiç görmedi —
 * gerçek cihazda "Cannot find native module 'ExpoAsset'" ile açılış hiç
 * bitmedi, hiçbir tsc/eslint/jest/Metro adımı yakalamadı.
 *
 * Bu betik daha geniş bakar: `expo/bundledNativeModules.json`daki HER
 * modülü, beyan edilmiş olsun olmasın, node_modules'da gerçekten kurulu
 * olan sürümle karşılaştırır. Kurulu değilse (henüz eklenmemiş, opsiyonel)
 * atlanır — yalnız KURULU olup SDK'nın beklediğinden farklı majör sürümde
 * olanlar hataya sayılır.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bundledPath = path.join(root, 'node_modules', 'expo', 'bundledNativeModules.json');

if (!fs.existsSync(bundledPath)) {
  console.error('expo/bundledNativeModules.json bulunamadı — `npm ci` çalıştırıldı mı?');
  process.exit(1);
}

const bundled = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
const mismatches = [];

for (const [pkg, expectedRange] of Object.entries(bundled)) {
  const pkgJsonPath = path.join(root, 'node_modules', pkg, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;

  const installed = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
  const expectedMajor = expectedRange.replace(/^[~^]/, '').split('.')[0];
  const installedMajor = installed.split('.')[0];

  if (expectedMajor !== installedMajor) {
    mismatches.push({ pkg, expected: expectedRange, installed });
  }
}

if (mismatches.length > 0) {
  console.error('SDK ile uyumsuz Expo native modül sürümleri bulundu:');
  for (const m of mismatches) {
    console.error(`  ${m.pkg}: kurulu ${m.installed}, SDK'nın beklediği ${m.expected}`);
  }
  console.error('\nDüzeltmek için: npx expo install ' + mismatches.map((m) => m.pkg).join(' '));
  console.error('(düz `npm install <paket>` KULLANMAYIN — SDK sürümünü bilmez, npm\'in');
  console.error('"latest" etiketine ne varsa onu çeker; bu sürüm uyumsuzluğunun sebebi buydu.)');
  process.exit(1);
}

console.log(`Expo native modül sürümleri SDK ile uyumlu (${Object.keys(bundled).length} modül denetlendi).`);
