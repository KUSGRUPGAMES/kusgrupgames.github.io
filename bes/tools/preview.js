/**
 * Ekran görüntüsü ve gezinme videosu üreticisi.
 *
 * Neden var: bu kapsayıcıda simülatör yok (KNOWN_ISSUES E3), ama uygulamaya
 * **bakmadan** bulunamayan hatalar var — taşan geri sayım, kendini tekrar
 * eden başlık, ilk açılışta bomboş kalan ekran. Hepsi burada çizdirilip
 * gözle görülerek yakalandı.
 *
 * Kullanım:
 *   npm run preview            → web derlemesi + 4 geçiş × 32 ekran + video
 *   node tools/preview.js shots
 *   node tools/preview.js film
 *
 * Gereken: `npx expo export --platform web --output-dir .expo/web-build`
 * (npm run preview bunu kendisi çalıştırır) ve `playwright-core`.
 */
/* eslint-disable no-console */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const KOK_DIZIN = path.join(__dirname, '..');
const WEB = path.join(KOK_DIZIN, '.expo', 'web-build');
const SHOTS = path.join(KOK_DIZIN, '.expo', 'shots');
const VIDEO = path.join(KOK_DIZIN, '.expo', 'video');

/**
 * Playwright'ın indirdiği Chromium (CI kapsayıcısı). Mac'te geliştirici
 * makinesinde o dizin yok; kurulu Google Chrome kullanılır.
 */
function tarayiciYolu() {
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && process.platform === 'darwin' && fs.existsSync(mac)) return mac;
  const taban = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dizin = fs.readdirSync(taban).find((d) => /^chromium-\d+$/.test(d));
  if (!dizin) throw new Error(`Chromium bulunamadı: ${taban}`);
  return path.join(taban, dizin, 'chrome-linux', 'chrome');
}

const TIPLER = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};

/**
 * Tek sayfalık uygulama sunucusu. Dosya yoksa `index.html` döner — expo
 * router'ın `/qibla` gibi yolları istemci tarafında çözmesi için şart.
 */
function sunucuAc() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const istenen = decodeURIComponent((req.url || '/').split('?')[0]);
      let dosya = path.join(WEB, istenen);
      if (!fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) {
        dosya = path.join(WEB, 'index.html');
      }
      res.writeHead(200, { 'content-type': TIPLER[path.extname(dosya)] || 'application/octet-stream' });
      fs.createReadStream(dosya).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve({ sunucu: s, port: s.address().port }));
  });
}

const ISTANBUL = {
  id: 'tr-34', name: 'İstanbul', country: 'Türkiye', countryCode: 'TR',
  timezone: 'Europe/Istanbul', latitude: 41.0082, longitude: 28.9784,
  label: 'İstanbul', isPrimary: true, origin: 'manual', savedAt: 1758240000000,
};

const EKRANLAR = [
  ['10-ana-sayfa', '/'], ['11-kuran', '/quran'], ['12-ibadet', '/worship'],
  ['13-ogren', '/learn'], ['14-ayarlar', '/profile'],
  ['15-ders-harf', '/lesson?id=harf-1'], ['16-ders-hece', '/lesson?id=ustun'], ['17-ders-sure', '/lesson?id=sure-112'],
  ['18-elifba', '/alphabet'],
  ['20-okuyucu', '/reader?surah=1'], ['21-kuran-arama', '/quran-search'],
  ['22-kiraat', '/recitation'], ['23-arama', '/search'],
  ['30-kible', '/qibla'], ['31-zikir', '/dhikr'], ['32-zikir-istatistik', '/dhikr-stats'],
  ['33-esma', '/names'], ['34-dualar', '/duas'],
  ['40-vakit-takvimi', '/prayer-calendar'], ['41-vakit-ayarlari', '/prayer-settings'],
  ['42-konum', '/location'], ['43-hatirlatici', '/reminders'], ['45-vakit-uyarilari', '/alarms'],
  ['44-bildirim-merkezi', '/notifications-center'],
  ['50-namaz-rehberi', '/prayer-guide'], ['51-ibadet-gunlugu', '/worship-log'],
  ['52-kaza', '/qada'], ['53-hatim', '/khatm'], ['54-ramazan', '/ramadan'],
  ['55-zekat', '/zakat'], ['56-hac-umre', '/hajj'],
  ['57-ibadet-istatistik', '/worship-stats'], ['63-topluluk', '/community'], ['64-hatim-gruplari', '/khatm-circles'],
  ['60-bilgi', '/knowledge'], ['61-hicri-takvim', '/hijri'], ['62-paylasim-karti', '/share-card'],
  ['70-ana-sayfa-duzeni', '/home-layout'], ['71-hesap', '/account'], ['72-tani', '/diagnostics'],
];

/**
 * Denetim geçişleri.
 *
 * Tek bir tema ve tek bir ekran genişliği yetmiyor: bulunan hataların çoğu
 * ya koyu temada ya da dar ekranda ortaya çıktı (koyu temada bembeyaz başlık
 * çubuğu, dar ekranda taşan geri sayım). Her geçiş bütün ekranları çizer.
 */
const GECISLER = [
  // D34: uygulama yalnız koyu temada; açık tema geçişi kaldırıldı.
  { ad: 'koyu', klasor: 'koyu', viewport: { width: 390, height: 844 }, tema: 'dark' },
  // iPhone SE genişliği: düzen kırılmaları önce burada görünür.
  { ad: 'dar', klasor: 'dar', viewport: { width: 320, height: 568 }, tema: 'dark' },
  // Arapça arayüz: sağdan sola akış ve uzun kelimeler.
  { ad: 'arapca', klasor: 'ar', viewport: { width: 390, height: 844 }, tema: 'dark', dil: 'ar' },
  // Mağaza kareleri: koyu tema + örnek kullanım verisi (tools/store-shots.js).
  // Uzun ekran: mağaza karesinde telefon alttan taşar; kısa kare altta boşluk bırakıyordu.
  { ad: 'vitrin', klasor: 'vitrin', viewport: { width: 390, height: 1120 }, tema: 'dark', vitrin: true },
];

const bekle = (p, ms) => p.waitForTimeout(ms);
const yazi = (p, s) => p.getByText(s, { exact: true });

async function kaydir(page, miktar, adim = 60) {
  const yon = Math.sign(miktar);
  for (let i = 0; i < Math.abs(miktar) / adim; i++) {
    await page.mouse.wheel(0, yon * adim);
    await bekle(page, 45);
  }
}

function tarayiciAc() {
  return chromium.launch({
    executablePath: tarayiciYolu(),
    args: ['--no-sandbox', '--disable-gpu'],
  });
}

const BAGLAM = { viewport: { width: 390, height: 844 }, locale: 'tr-TR', timezoneId: 'Europe/Istanbul' };

/**
 * Konumu, temayı ve dili hazır kabul ettirir.
 *
 * Tema ve dil depodan okunuyor; arayüzden tıklayarak geçmek her ekranda
 * bir tur gezinme demekti ve bir kez de yanlış ekranda kaldı.
 */
async function tohumla(ctx, { tema = 'light', dil = 'tr', vitrin = false } = {}) {
  await ctx.addInitScript((veri) => {
    localStorage.setItem('bes.onboardingDone', 'true');
    localStorage.setItem('bes.locations', JSON.stringify({ locations: [veri.yer], activeId: veri.yer.id }));
    localStorage.setItem('bes.themeMode', JSON.stringify(veri.tema));
    localStorage.setItem('bes.settings', JSON.stringify({ language: veri.dil }));
    if (!veri.vitrin) return;
    // --- Vitrin: mağaza kareleri için üç haftalık örnek kullanım. Yalnız
    // `vitrin` geçişinde; denetim geçişleri boş ekranları da sınasın diye
    // tohumsuz kalır. Rastgele değil, sabit örüntü: kareler her üretimde aynı.
    const gun = (fark) => {
      const d = new Date(); d.setDate(d.getDate() - fark);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const ZIKIR = [['Sübhânallah', 33], ['Elhamdülillah', 33], ['Allâhu ekber', 34], ['Estağfirullah', 100], ['Salavât', 100]];
    const sessions = [];
    const days = {};
    const VAKIT = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (let f = 0; f < 21; f += 1) {
      const t = gun(f);
      const kac = f === 0 ? ZIKIR.length : 1 + ((f * 7) % 3);
      for (let i = 0; i < kac; i += 1) {
        const [ad, hedef] = ZIKIR[(f + i) % ZIKIR.length];
        const tam = (f + i) % 4 !== 3;
        sessions.push({ id: `z${f}-${i}`, title: ad, count: tam ? hedef : Math.round(hedef * 0.6), target: hedef, onDate: t, createdAt: Date.now() - f * 864e5 - i * 36e5 });
      }
      const prayers = {};
      VAKIT.forEach((v, i) => {
        if ((f + i) % 9 === 8) return;
        prayers[v] = (f + i) % 3 === 0 ? 'jamaah' : 'alone';
      });
      days[t] = { date: t, prayers, quranMinutes: 10 + ((f * 13) % 35) };
    }
    const worship = {
      sessions, days,
      qada: { fajr: 12, dhuhr: 4, asr: 6, maghrib: 2, isha: 9, witr: 3 },
      qadaHistory: [],
      khatms: [{ id: 'h1', title: 'Ramazan hatmi', startedOn: gun(20), targetOn: gun(-18),
        completedJuz: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], active: true }],
      reminders: [
        { id: 'r1', title: 'Kur’an okuma vakti', body: 'Bugünkü sayfanı oku', trigger: { kind: 'time', hour: 21, minute: 0 }, weekdays: [], enabled: true },
        { id: 'r2', title: 'Sabah namazına hazırlan', trigger: { kind: 'prayer', slot: 'fajr', offsetMinutes: -20 }, weekdays: [], enabled: true },
        { id: 'r3', title: 'Cuma — Kehf sûresi', trigger: { kind: 'time', hour: 10, minute: 0 }, weekdays: [5], enabled: true },
        { id: 'r4', title: 'Akşam ezkârı', trigger: { kind: 'prayer', slot: 'maghrib', offsetMinutes: 15 }, weekdays: [], enabled: true },
      ],
      fasts: { [gun(1)]: { date: gun(1), kind: 'nafile', completed: true }, [gun(4)]: { date: gun(4), kind: 'nafile', completed: true } },
    };
    localStorage.setItem('bes.worship', JSON.stringify(worship));
    const DERS = ['harf-1', 'harf-2', 'harf-3', 'harf-4', 'harf-5', 'harf-6', 'harf-7', 'harf-tekrar', 'bitisme', 'ustun', 'esre'];
    localStorage.setItem('bes.learning', JSON.stringify(DERS.map((id, i) => ({ lessonId: id, stars: i % 4 === 3 ? 2 : 3, completedAt: Date.now() - (DERS.length - i) * 864e5 }))));
    localStorage.setItem('bes.reading', JSON.stringify({ position: { surah: 18, ayah: 10, updatedAt: Date.now() }, bookmarks: [] }));
  }, { yer: ISTANBUL, tema, dil, vitrin });
}

async function ekranlar(port) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const kok = `http://127.0.0.1:${port}`;
  const browser = await tarayiciAc();
  /** Bulunan her sorun: { gecis, ekran, tur, ayrinti }. */
  const sorunlar = [];

  // --- ilk açılış: tohumsuz, gerçek onboarding akışı
  {
    const dizin = path.join(SHOTS, 'acilis');
    fs.mkdirSync(dizin, { recursive: true });
    const ctx = await browser.newContext({ ...BAGLAM, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => sorunlar.push({ gecis: 'acilis', ekran: 'onboarding', tur: 'hata', ayrinti: String(e).slice(0, 160) }));
    await page.goto(`${kok}/`, { waitUntil: 'load' });
    await bekle(page, 3000);
    // Adım 0: dil seçimi. Tarayıcının dili ne olursa olsun Türkçe seçilir;
    // sonraki adımların metinleri ona göre aranıyor.
    await page.screenshot({ path: path.join(dizin, '0-dil.png') });
    await yazi(page, 'Türkçe').first().click(); await bekle(page, 800);
    await yazi(page, 'İleri').first().click(); await bekle(page, 1200);
    await page.screenshot({ path: path.join(dizin, '1-hosgeldin.png') });

    await yazi(page, 'Başla').first().click(); await bekle(page, 1200);
    const alan = page.locator('input').first();
    await alan.click(); await alan.type('İstanbul', { delay: 60 });
    await bekle(page, 1200);
    await page.screenshot({ path: path.join(dizin, '2-konum-arama.png') });

    await yazi(page, 'İstanbul').first().click(); await bekle(page, 1200);
    await page.screenshot({ path: path.join(dizin, '3-konum-secildi.png') });
    await yazi(page, 'İleri').first().click(); await bekle(page, 1200);
    await page.screenshot({ path: path.join(dizin, '4-yontem.png') });
    await yazi(page, 'İleri').first().click(); await bekle(page, 1200);
    await page.screenshot({ path: path.join(dizin, '5-bildirim.png') });
    await yazi(page, 'Geç').first().click(); await bekle(page, 1200);
    // Giriş adımı yalnız topluluk sunucusu yapılandırılmışsa var (D32).
    let kare = 7;
    if (await yazi(page, 'Google ile devam et').count()) {
      await page.screenshot({ path: path.join(dizin, '6-giris.png') });
      await yazi(page, 'Geç').first().click(); await bekle(page, 1200);
      kare = 8;
    }
    await page.screenshot({ path: path.join(dizin, '7-hazir.png') });
    await ctx.close();
    console.log(`  . açılış akışı (${kare} kare)`);
  }

  for (const gecis of GECISLER) {
    const dizin = path.join(SHOTS, gecis.klasor);
    fs.mkdirSync(dizin, { recursive: true });
    const ctx = await browser.newContext({
      ...BAGLAM, viewport: gecis.viewport, deviceScaleFactor: 2,
      ...(gecis.dil === 'ar' ? { locale: 'ar' } : {}),
    });
    await tohumla(ctx, { tema: gecis.tema, dil: gecis.dil ?? 'tr', vitrin: gecis.vitrin ?? false });
    const page = await ctx.newPage();
    let suAnki = '';
    page.on('pageerror', (e) => sorunlar.push({ gecis: gecis.ad, ekran: suAnki, tur: 'hata', ayrinti: String(e).slice(0, 160) }));

    console.log(`\n--- ${gecis.ad} (${gecis.viewport.width}×${gecis.viewport.height}${gecis.dil ? ', ' + gecis.dil : ''})`);
    for (const [ad, yol] of EKRANLAR) {
      suAnki = ad;
      await page.goto(kok + yol, { waitUntil: 'load' });
      await bekle(page, gecis.dil === 'ar' ? 2200 : 1700);
      const olcum = await page.evaluate(() => ({
        metin: document.body.innerText.trim().length,
        tasma: document.documentElement.scrollWidth - window.innerWidth,
      }));
      await page.screenshot({ path: path.join(dizin, `${ad}.png`) });

      const isaret = [];
      if (olcum.metin < 12) { sorunlar.push({ gecis: gecis.ad, ekran: ad, tur: 'boş', ayrinti: '' }); isaret.push('BOŞ'); }
      // Yatay taşma = düzen kırılması. 1 piksel yuvarlama payı bırakılır.
      if (olcum.tasma > 1) {
        sorunlar.push({ gecis: gecis.ad, ekran: ad, tur: 'taşma', ayrinti: `${olcum.tasma}px` });
        isaret.push(`TAŞMA ${olcum.tasma}px`);
      }
      console.log(`${isaret.length ? '!!' : ' .'} ${ad.padEnd(24)} ${isaret.join(' ')}`);
    }
    await ctx.close();
  }

  await browser.close();

  if (sorunlar.length > 0) {
    console.log('\n=== SORUNLAR ===');
    for (const s of sorunlar) console.log(`  ${s.gecis.padEnd(8)} ${s.ekran.padEnd(24)} ${s.tur} ${s.ayrinti}`);
  }
  return sorunlar.length;
}

async function film(port) {
  fs.mkdirSync(VIDEO, { recursive: true });
  const kok = `http://127.0.0.1:${port}`;
  const browser = await tarayiciAc();
  const ctx = await browser.newContext({
    ...BAGLAM,
    recordVideo: { dir: VIDEO, size: { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  const git = async (yol, ms = 1800) => {
    await page.goto(kok + yol, { waitUntil: 'load' });
    await bekle(page, ms);
  };
  const tikla = async (metin, ms = 1200) => {
    try { await yazi(page, metin).first().click({ timeout: 6000 }); } catch { console.log('  tıklanamadı:', metin); return; }
    await bekle(page, ms);
  };

  // 1. İlk açılış
  await git('/', 3000);
  await tikla('Başla', 1400);
  const alan = page.locator('input').first();
  await alan.click(); await alan.type('İstanbul', { delay: 150 });
  await bekle(page, 1400);
  await tikla('İstanbul', 1500);
  await tikla('İleri', 1600);
  await tikla('İleri', 1600);
  await tikla('Geç', 1600);
  await tikla('Bitir', 2600);

  // 2. Ana sayfa
  await bekle(page, 1600);
  await kaydir(page, 1000); await bekle(page, 1200);
  await kaydir(page, -1000); await bekle(page, 800);

  // 3. Kuran
  await git('/quran');
  await kaydir(page, 500); await bekle(page, 700);
  await kaydir(page, -500); await bekle(page, 500);
  await git('/reader?surah=1', 2000);
  await kaydir(page, 1300); await bekle(page, 1300);
  await git('/quran-search', 1600);
  const ara = page.locator('input').first();
  await ara.click(); await ara.type('rahmet', { delay: 130 });
  await bekle(page, 2400);
  await kaydir(page, 500); await bekle(page, 1200);

  // 4. İbadet
  await git('/worship', 1500);
  await tikla('Zikirmatik', 1600);
  for (let i = 0; i < 8; i++) { await page.mouse.click(195, 300); await bekle(page, 250); }
  await bekle(page, 1000);
  await kaydir(page, 700); await bekle(page, 1000);
  await git('/qibla', 2600);
  await git('/prayer-guide', 1600);
  await kaydir(page, 700); await bekle(page, 1000);

  // 5. Öğren
  await git('/learn', 1600);
  await git('/lesson?id=harf-1', 1600);
  await git('/names', 1600);
  await kaydir(page, 900); await bekle(page, 1000);
  await git('/zakat', 1800);
  await kaydir(page, 800); await bekle(page, 1200);
  await git('/hijri', 1800);
  await kaydir(page, 700); await bekle(page, 1100);

  // 6. Vakit takvimi
  await git('/prayer-calendar', 2000);
  await kaydir(page, 900); await bekle(page, 1200);

  // 7. Ayarlar ve ana sayfaya dönüş (D34: tema seçici yok, uygulama hep koyu)
  await git('/profile', 1800);
  await kaydir(page, 600); await bekle(page, 1000);
  await git('/', 2200);
  await kaydir(page, 800); await bekle(page, 1000);
  await git('/quran', 1800);
  await git('/qibla', 2400);

  await ctx.close();
  await browser.close();
  const [dosya] = fs.readdirSync(VIDEO).filter((f) => f.endsWith('.webm'));
  console.log('video:', path.join(VIDEO, dosya || '(yok)'));
}

(async () => {
  const ne = process.argv[2] || 'all';
  if (!fs.existsSync(path.join(WEB, 'index.html'))) {
    console.error(`Web derlemesi yok: ${WEB}\n  npx expo export --platform web --output-dir .expo/web-build`);
    process.exit(1);
  }
  const { sunucu, port } = await sunucuAc();
  let sorunlu = 0;
  try {
    if (ne === 'shots' || ne === 'all') sorunlu = await ekranlar(port);
    if (ne === 'film' || ne === 'all') await film(port);
  } finally {
    sunucu.close();
  }
  if (sorunlu > 0) {
    console.error(`\n${sorunlu} sorun bulundu (boş ekran, çalışma hatası ya da yatay taşma).`);
    process.exit(1);
  }
  console.log('\nHepsi çizdi.');
})();
