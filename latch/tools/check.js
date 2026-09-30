#!/usr/bin/env node
/* Yayin oncesi tek komutluk dogrulama:  node tools/check.js
   1) oyun betigi sozdizimi   2) tarayicida gercek oyun dongusu (3 mod)
   3) magaza gorselleri       4) hukuki sayfalar
   5) surum/kimlik tutarliligi  6) yayin oncesi ayar uyarilari          */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
/* docs/ tek depoda koktedir: <depo>/docs/<gameId>/ */
const GAME = JSON.parse(require('fs').readFileSync(path.join(ROOT,'app.config.json'),'utf8')).gameId;
const DOCS = path.join(ROOT, '..', 'docs', GAME);
const DOCSROOT = path.join(ROOT, '..', 'docs');
// Mac'te Linux yolu yok; kurulu Chrome kullanılır.
const CHROME = process.env.CHROME || [
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => fs.existsSync(p)) || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let fail = 0, warn = 0;
const ok  = m => console.log('  \x1b[32mOK\x1b[0m   ' + m);
const bad = m => { fail++; console.log('  \x1b[31mHATA\x1b[0m ' + m); };
const wrn = m => { warn++; console.log('  \x1b[33mUYARI\x1b[0m ' + m); };

const html = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const cfg  = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.config.json'), 'utf8'));

console.log('\n1) Oyun betigi');
{
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, blocks = 0, dirty = 0;
  while ((m = re.exec(html))) {
    blocks++;
    try { new Function(m[1]); } catch (e) { dirty++; bad('betik blogu ' + blocks + ': ' + e.message); }
  }
  if (!dirty) ok(blocks + ' betik blogu, sozdizimi temiz');
  ['easy','normal','hard'].forEach(d => {
    if (!new RegExp('\\b' + d + ':\\s*\\{').test(html)) bad('DIFF tablosunda ' + d + ' modu yok');
  });
  if (!/function simChain/.test(html)) bad('uretim dogrulamasi (simChain) kayip - adalet garantisi yok');
  if (!/function latchBoost/.test(html)) bad('kanca cekisi (latchBoost) kayip - sig acili tutunmada oyuncu asili kalir');
  if (/DIFF\s*=\s*\{/.test(html)) ok('DIFF zorluk tablosu yerinde (denge tek yerden ayarlaniyor)');
}

console.log('\n2) Tarayicida oyun dongusu (self-test, 3 mod)');
if (!fs.existsSync(CHROME)) {
  wrn('Chrome bulunamadi (' + CHROME + '). CHROME=/yol/chrome node tools/check.js ile calistir.');
} else {
  for (const d of ['easy', 'normal', 'hard']) {
    try {
      const out = cp.execSync(
        `"${CHROME}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=60000 ` +
        `--window-size=420,860 --dump-dom "file://${path.join(ROOT, 'www/index.html')}?selftest=1&diff=${d}" 2>/dev/null`,
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const t = (out.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
      if (t.startsWith('SELFTEST:OK')) ok(t.replace('SELFTEST:OK ', ''));
      else bad('self-test basarisiz: ' + t);
    } catch (e) { bad('self-test calistirilamadi (' + d + '): ' + e.message); }
  }
}

console.log('\n3) Magaza gorselleri');
{
  const need = {
    'assets/icon-1024.png': [1024, 1024], 'assets/icon-512.png': [512, 512],
    'assets/feature-graphic-1024x500.png': [1024, 500], 'assets/splash-2732.png': [2732, 2732]
  };
  for (let i = 1; i <= 5; i++) {
    need['assets/screenshots/android-' + i + '-1080x1920.png'] = [1080, 1920];
    need['assets/screenshots/ios67-' + i + '-1290x2796.png'] = [1290, 2796];
  }
  for (const f in need) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) { bad('eksik: ' + f); continue; }
    const d = fs.readFileSync(p).subarray(0, 33);
    const w = d.readUInt32BE(16), h = d.readUInt32BE(20), ctype = d[25];
    if (w !== need[f][0] || h !== need[f][1]) bad(f + ' olcusu ' + w + 'x' + h + ', beklenen ' + need[f].join('x'));
    else if (f === 'assets/icon-1024.png' && ctype === 6) bad('App Store ikonu alfa kanali icermemeli');
    else ok(f + ' ' + w + 'x' + h);
  }
  ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi'].forEach(d => {
    const p = path.join(ROOT, 'assets/android/res/mipmap-' + d + '/ic_launcher.png');
    if (!fs.existsSync(p)) bad('Android simge agaci eksik: mipmap-' + d + ' (bash tools/gen.sh)');
  });
  if (fs.existsSync(path.join(ROOT, 'assets/android/res/mipmap-anydpi-v26/ic_launcher.xml')))
    ok('Android adaptive icon kaynaklari hazir');
}

console.log('\n4) Hukuki ve destek sayfalari');
['privacy.html', 'gizlilik.html', 'terms.html', 'support.html', 'index.html']
  .forEach(f => fs.existsSync(path.join(DOCS, f)) ? ok('docs/' + GAME + '/' + f) : bad('eksik: docs/' + GAME + '/' + f));
if (fs.existsSync(path.join(DOCSROOT, '_style.css'))) ok('docs/_style.css (ortak stil)');
else bad('eksik: docs/_style.css');
/* GitHub Pages Jekyll'i alt cizgiyle baslayan dosyalari yayinlamaz -> _style.css 404 verir */
if (fs.existsSync(path.join(DOCSROOT, '.nojekyll'))) ok('docs/.nojekyll (Pages _style.css dosyasini atlamaz)');
else bad('docs/.nojekyll eksik - GitHub Pages _style.css dosyasini yayinlamaz, sayfalar stilsiz kalir');

console.log('\n5) Surum ve kimlik tutarliligi');
{
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const capc = JSON.parse(fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8'));
  const inGame = (html.match(/version:\s*'([^']+)'/) || [])[1];
  if (inGame !== cfg.version) bad('www/index.html surumu ' + inGame + ', app.config.json ' + cfg.version + ' - bash tools/set-identity.sh');
  else ok('surum ' + cfg.version + ' her yerde ayni');
  if (pkg.version !== cfg.version) wrn('package.json surumu (' + pkg.version + ') app.config.json ile ayni degil');
  if (capc.appId !== cfg.bundleId) bad('capacitor.config.json appId (' + capc.appId + ') != ' + cfg.bundleId);
  else ok('bundle id ' + cfg.bundleId);
  if (!html.includes(cfg.bundleId)) wrn('www/index.html icindeki bundle id app.config.json ile ayni degil');
  if (!html.includes(cfg.pagesBaseUrl)) wrn('www/index.html icindeki gizlilik adresi app.config.json ile ayni degil');
  /* Destek e-postasi magaza sayfasinda herkese gorunur; yanlis kalirsa kullanici
     hicbir zaman ulasamaz. Bu yuzden UYARI degil HATA, ve tek bir dosya degil
     e-postanin gectigi TUM dosyalar taranir (paylasilan docs/index.html dahil). */
  const mail = cfg.supportEmail;
  const MAILFILES = ['www/index.html','store/google-play.md','store/app-store.md',
                     'native/android.md','native/ios.md','LAUNCH-CHECKLIST.md','README.md']
      .map(f => path.join(ROOT, f))
      .concat(['index.html','privacy.html','gizlilik.html','terms.html','support.html']
      .map(f => path.join(DOCS, f)))
      .concat([path.join(DOCSROOT, 'index.html')]);
  let stale = 0;
  MAILFILES.forEach(fp => {
    if (!fs.existsSync(fp)) return;
    const found = fs.readFileSync(fp, 'utf8')
      .match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
    found.filter(a => a !== mail).forEach(a => {
      stale++;
      bad(path.relative(path.join(ROOT, '..'), fp) + ' icinde farkli e-posta: ' + a
          + ' - app.config.json duzelt, sonra bash tools/set-identity.sh');
    });
  });
  if (!stale) ok('destek e-postasi ' + mail + ' gectigi her yerde ayni');

  /* set-identity.sh, dosyalarda SU AN yazili degerleri OLD_* sabitlerinden bilir.
     Bunlar bayatlarsa betik sessizce hicbir sey degistirmez - OLD_URL bir kez
     boyle bayatladi. Ayrica betigin icindeki node programinin kendisi de gecerli
     olmali: "g" iki kez tanimlandigi icin betik bir kez hic calismadi, yani
     gercek AdMob kimlikleri ve useTest=false hicbir zaman yazilmayacakti. */
  {
    const sh = fs.readFileSync(path.join(ROOT, 'tools/set-identity.sh'), 'utf8');
    const want = { OLD_MAIL: cfg.supportEmail, OLD_URL: cfg.pagesBaseUrl, OLD_ID: cfg.bundleId };
    let shBad = 0;
    Object.keys(want).forEach(k => {
      const got = (sh.match(new RegExp(k + '="([^"]*)"')) || [])[1];
      if (got !== want[k]) {
        shBad++;
        bad('tools/set-identity.sh ' + k + ' bayat: "' + got + '" yazili, "' + want[k] + '" olmali');
      }
    });
    const prog = (sh.match(/node -e '([\s\S]*?)'\s*"\$ROOT"/) || [])[1];
    if (!prog) { shBad++; bad('tools/set-identity.sh icindeki node programi okunamadi'); }
    else try { new Function(prog); }
         catch (e) { shBad++; bad('tools/set-identity.sh sozdizimi bozuk: ' + e.message); }
    if (!shBad) ok('tools/set-identity.sh sabitleri guncel, programi sozdizimi temiz');
  }
  ['index.html','privacy.html','terms.html','support.html'].forEach(f => {
    /* Eksik dosyayi 4. bolum zaten HATA olarak bildirdi; burada okumaya kalkarsak
       check.js yigin iziyle coker ve geri kalan denetimler (useTest dahil) hic calismaz. */
    if (!fs.existsSync(path.join(DOCS, f))) return;
    const s = fs.readFileSync(path.join(DOCS, f), 'utf8');
    if (/orbita|nakitpilot|\bslot\b/i.test(s)) bad('docs/' + GAME + '/' + f + ' icinde baska projeden kalan metin var');
  });
}

console.log('\n6) Yayin oncesi ayarlar');
{
  if (/useTest:\s*true/.test(html)) wrn('CFG.ads.useTest = true - TEST reklamlari aktif. Yayindan once false yap.');
  else {
    ok('gercek reklam kimlikleri aktif');
    ['android', 'ios'].forEach(p => ['app', 'interstitial', 'rewarded'].forEach(k => {
      if (!cfg.admob.real[p][k]) bad('app.config.json: admob.real.' + p + '.' + k + ' bos');
    }));
    if (/ca-app-pub-3940256099942544/.test(html)) bad('Kodda hala Google TEST reklam kimligi var!');
  }
  if (cfg.versionCode < 1 || cfg.versionCode % 1 !== 0) bad('app.config.json versionCode tam sayi olmali');
  else ok('versionCode ' + cfg.versionCode + ' (her Play yuklemesinde artmali)');
}

console.log('\n' + (fail ? '\x1b[31m' + fail + ' hata' : '\x1b[32mHata yok') + '\x1b[0m, ' + warn + ' uyari.\n');
process.exit(fail ? 1 : 0);
