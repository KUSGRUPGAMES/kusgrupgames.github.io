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

console.log('\n1) Uygulama betigi');
{
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m, blocks = 0, dirty = 0;
  while ((m = re.exec(html))) {
    blocks++;
    try { new Function(m[1]); } catch (e) { dirty++; bad('betik blogu ' + blocks + ': ' + e.message); }
  }
  if (!dirty) ok(blocks + ' betik blogu, sozdizimi temiz');
  /* Nefes egrileri urunun kendisi: biri kaybolursa uygulama sessizce
     "sabit tempo dayatan" siradan bir nefes uygulamasina doner. */
  if (!/function rateAt/.test(html)) bad('rateAt kayip - tempo inisi yok, sabit tempo dayatilir');
  if (!/function ratioAt/.test(html)) bad('ratioAt kayip - nefes verme uzamaz, parasempatik etki kalkar');
  if (!/function measuredRate/.test(html)) bad('measuredRate kayip - kullanicinin temposu olculmez');
  if (!/CFG\s*=\s*\{/.test(html)) bad('CFG tablosu yok - ayarlar tek yerden yapilamiyor');
  else ok('CFG ayar tablosu yerinde (tempo, oran, sureler tek yerden)');
  /* Ayar tablosundaki degerler anlamli araliklarda mi */
  const num = k => { const m = html.match(new RegExp(k + ':\\s*([0-9.]+)')); return m ? parseFloat(m[1]) : NaN; };
  const tgt = num('targetRate'), r0 = num('ratioStart'), r1 = num('ratioEnd');
  if (!(tgt >= 4 && tgt <= 7)) bad('targetRate ' + tgt + ' - rezonans frekansi 4-7/dk araliginda olmali');
  if (!(r1 > r0)) bad('ratioEnd (' + r1 + ') ratioStart (' + r0 + ') degerinden buyuk olmali');
  if (tgt >= 4 && tgt <= 7 && r1 > r0) ok('hedef tempo ' + tgt + '/dk, veris/alis orani ' + r0 + ' -> ' + r1);
}

console.log('\n2) Tarayicida nefes egrisi (self-test)');
if (!fs.existsSync(CHROME)) {
  wrn('Chrome bulunamadi (' + CHROME + '). CHROME=/yol/chrome node tools/check.js ile calistir.');
} else {
  try {
    const out = cp.execSync(
      `"${CHROME}" --headless=new --no-sandbox --disable-gpu --virtual-time-budget=40000 ` +
      `--window-size=500,900 --dump-dom "file://${path.join(ROOT, 'www/index.html')}?selftest=1" 2>/dev/null`,
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const t = (out.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    if (!t.startsWith('SELFTEST:OK')) bad('self-test basarisiz: ' + t);
    else {
      /* Sadece "calisti" yetmez: tempo GERCEKTEN inmis mi? */
      const a = parseFloat((t.match(/baslangic=([0-9.]+)/) || [])[1]);
      const b = parseFloat((t.match(/bitis=([0-9.]+)/) || [])[1]);
      if (!(a > b)) bad('tempo inmemis: ' + a + ' -> ' + b);
      else ok(t.replace('SELFTEST:OK ', '') + '  (tempo ' + a + ' -> ' + b + ' indi)');
    }
  } catch (e) { bad('self-test calistirilamadi: ' + e.message); }
}

console.log('\n3) Magaza gorselleri');
{
  const need = {
    'assets/icon-1024.png': [1024, 1024], 'assets/icon-512.png': [512, 512],
    'assets/feature-graphic-1024x500.png': [1024, 500], 'assets/splash-2732.png': [2732, 2732]
  };
  for (let i = 1; i <= 5; i++) {
    need['assets/screenshots/android-' + i + '-1080x1920.png'] = [1080, 1920];
    need['assets/screenshots/ios69-' + i + '-1290x2796.png'] = [1290, 2796];
    need['assets/screenshots/ios65-' + i + '-1284x2778.png'] = [1284, 2778];
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
  /* gizlilik.html BU LISTEDE YOKTU ve sablondan kalan Slot'un kumar paragrafi
     fark edilmeden yayinlandi. Turkce sayfa da taranir. */
  ['index.html','privacy.html','gizlilik.html','terms.html','support.html'].forEach(f => {
    /* Eksik dosyayi 4. bolum zaten HATA olarak bildirdi; burada okumaya kalkarsak
       check.js yigin iziyle coker ve geri kalan denetimler (useTest dahil) hic calismaz. */
    if (!fs.existsSync(path.join(DOCS, f))) return;
    const s = fs.readFileSync(path.join(DOCS, f), 'utf8');
    if (/orbita|nakitpilot|\bslot\b|\blatch\b|kumar|gambling/i.test(s))
      bad('docs/' + GAME + '/' + f + ' icinde baska projeden kalan metin var');
    /* Oyun ADI gecmeden de sablon metni kalabilir: support.html bastan asagi
       Latch'in SSS'siydi ("hook", "rope", "PERFECT") ve ad taramasi bunu kacirdi.
       Lull'da olmamasi gereken mekanik kelimeleri de ariyoruz. */
    const oyunSozcugu = s.match(/\b(hook|rope|swing|respawn|leaderboard|high score|skor tablosu|\bcengel\b|\bcengeli\b)\b/i);
    if (oyunSozcugu)
      bad('docs/' + GAME + '/' + f + ' icinde oyun sablonundan kalan metin var: "' + oyunSozcugu[0] + '"');
    /* Reklamsiz/satin almasiz bir uygulamada bu cumleler yalan beyandir. */
    if (cfg.admob && cfg.admob.enabled === false) {
      const rek = s.match(/remove ads|restore purchase|rewarded|advertising identifier|reklam kimligini|reklam onayini|satin almayi geri/i);
      if (rek)
        bad('docs/' + GAME + '/' + f + ' reklamsiz uygulamada reklam/satin alma metni iceriyor: "' + rek[0] + '"');
    }
  });
}

console.log('\n6) Yayin oncesi ayarlar');
{
  /* Reklam kapaliyken useTest anlamsiz. Onun yerine TUTARLILIK denetlenir:
     reklamsiz bir uygulamada kodda reklam koprusu kalmamali. Play, "veri
     toplamiyorum" beyaniyla AD_ID iznini dogrudan CELISKI olarak isaretliyor. */
  if (cfg.admob && cfg.admob.enabled === false) {
    if (/\bAds\s*=|googleads|AdMob\.|admob\./i.test(html))
      bad('reklam kapali ama www/index.html icinde reklam koprusu var');
    else ok('reklamsiz: uygulama kodunda reklam koprusu yok');
    if (cfg.iap && cfg.iap.enabled === false) ok('satin alma kapali (v1 tamamen ucretsiz)');
  } else if (/useTest:\s*true/.test(html)) {
    wrn('CFG.ads.useTest = true - TEST reklamlari aktif. Yayindan once false yap.');
  }
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
