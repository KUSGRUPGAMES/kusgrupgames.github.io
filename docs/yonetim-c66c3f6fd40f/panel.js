/* BEŞ yönetici paneli (D36) — mimari ve gerekçeler: bes/ADMIN_PANEL.md
 *
 * Güvenlik kuralları (bozulmamalı):
 * - Kullanıcı içeriği (dua, mesaj, takma ad, e-posta…) ASLA innerHTML ile
 *   basılmaz; her şey h() ile textContent olarak eklenir (XSS: kötü niyetli
 *   bir dua isteği yönetici oturumunu çalamasın).
 * - Yetki tarayıcıda değil sunucuda: RLS + is_admin denetimli işlevler.
 *   Yönetici olmayan biri bu sayfayı açsa da hiçbir veri göremez.
 * - Oturum sessionStorage'da: sekme kapanınca biter; 30 dk hareketsizlikte çıkış.
 */
'use strict';
(() => {
const SUPABASE_URL = 'https://gqvoaryuwhtxwbkjudhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxdm9hcnl1d2h0eHdia2p1ZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTEzNDUsImV4cCI6MjEwNjI4NzM0NX0.vSTTzbsDjZCCSgQ-lOtZfRGizOsxuDsrkhP5MOfPRi8';
const LOCALES = [['tr', 'Türkçe'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['ar', 'العربية']];
const IDLE_MS = 30 * 60 * 1000;

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { flowType: 'pkce', storage: window.sessionStorage, persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
});

// ── küçük yardımcılar ─────────────────────────────────────────────────────
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = Boolean(v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  const ekle = (c) => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(ekle); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  children.forEach(ekle);
  return el;
}
const $ = (sel) => document.querySelector(sel);
const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtDay = (iso) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '');
const num = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('tr-TR'));
const short = (s, n = 120) => (s && s.length > n ? `${s.slice(0, n)}…` : (s || ''));

function toast(msg, tone = '') {
  const t = h('div', { class: `toast ${tone}` }, msg);
  $('#toast-root').appendChild(t);
  setTimeout(() => t.remove(), tone === 'bad' ? 7000 : 3500);
}
function fail(e, ctx) {
  console.error(ctx, e);
  toast(`${ctx ? `${ctx}: ` : ''}${e && e.message ? e.message : String(e)}`, 'bad');
}
async function must(promise, ctx) {
  const { data, error } = await promise;
  if (error) throw Object.assign(new Error(error.message), { ctx });
  return data;
}

function modal(title, body, actions) {
  const root = $('#modal-root');
  const kapat = () => clear(root);
  const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) kapat(); } },
    h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'row' }, h('h2', { class: 'grow' }, title), h('button', { class: 'btn sm', onclick: kapat }, 'Kapat')),
      body,
      actions ? h('div', { class: 'row end' }, actions(kapat)) : null));
  clear(root).appendChild(back);
  const ilk = back.querySelector('input,textarea,select');
  if (ilk) ilk.focus();
  return kapat;
}
function confirmBox(title, text, okLabel, onOk, { danger = true, typeToConfirm = null } = {}) {
  const giris = typeToConfirm ? h('input', { placeholder: `Onay için "${typeToConfirm}" yazın` }) : null;
  modal(title, h('div', { class: 'col' }, h('p', { class: 'body' }, text), giris), (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    h('button', { class: `btn ${danger ? 'bad' : 'pri'}`, onclick: async (e) => {
      if (giris && giris.value.trim() !== typeToConfirm) { toast('Onay metni eşleşmedi.', 'bad'); return; }
      e.target.disabled = true;
      try { await onOk(); kapat(); } catch (err) { fail(err, title); e.target.disabled = false; }
    } }, okLabel),
  ]);
}
function promptBox(title, label, { initial = '', multiline = true, okLabel = 'Kaydet', required = true } = {}, onOk) {
  const alan = multiline ? h('textarea', { value: initial }) : h('input', { value: initial });
  modal(title, h('label', { class: 'f' }, label, alan), (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    h('button', { class: 'btn pri', onclick: async (e) => {
      const v = alan.value.trim();
      if (required && !v) { toast('Boş bırakılamaz.', 'bad'); return; }
      e.target.disabled = true;
      try { await onOk(v); kapat(); } catch (err) { fail(err, title); e.target.disabled = false; }
    } }, okLabel),
  ]);
}

// ── oturum ────────────────────────────────────────────────────────────────
const state = { user: null, profile: null, view: 'dashboard', users: new Map(), openReports: 0 };

async function audit(action, target, detail = {}) {
  try { await sb.from('admin_audit').insert({ admin_id: state.user.id, action, target: target ? String(target) : null, detail }); } catch (_) { /* günlük yazılamasa da işlem tamam */ }
}

function loginScreen(msg) {
  const app = clear($('#app'));
  app.appendChild(h('div', { class: 'login' }, h('div', { class: 'card col' },
    h('div', { class: 'brand', style: { justifyContent: 'center' } }, h('div', { class: 'mark' }, '5'), h('div', null, 'BEŞ Yönetim', h('small', null, 'Yalnız yetkili hesaplar'))),
    msg ? h('p', { class: 'badge bad', style: { whiteSpace: 'normal' } }, msg) : null,
    h('button', { class: 'btn pri', onclick: async () => {
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } },
      });
      if (error) fail(error, 'Giriş');
    } }, 'Google ile giriş yap'),
    h('p', { class: 'subtle' }, 'Giriş yalnız yönetici olarak tanımlı hesaplarla çalışır. Oturum, sekme kapanınca ya da 30 dakika işlem yapılmayınca kapanır.'))));
}

let idleTimer = null;
function armIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => { await sb.auth.signOut(); loginScreen('Uzun süre işlem yapılmadığı için oturum kapandı.'); }, IDLE_MS);
}
['click', 'keydown', 'mousemove', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { if (state.user) armIdle(); }, { passive: true }));

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (location.search.includes('code=') || location.hash.includes('access_token')) history.replaceState(null, '', location.pathname);
  if (!session) { loginScreen(); return; }
  state.user = session.user;
  const { data: profil } = await sb.from('profiles').select('is_admin,nickname').eq('id', session.user.id).maybeSingle();
  if (!profil || !profil.is_admin) {
    await sb.auth.signOut();
    loginScreen(`${session.user.email || 'Bu hesap'} yönetici değil. Erişim reddedildi.`);
    return;
  }
  state.profile = profil;
  armIdle();
  await loadUsers();
  shell();
  go(location.hash.slice(1) || 'dashboard');
  // Geri/ileri tuşu ve adres çubuğundan bölüm değişimi.
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== state.view) go(v); });
}

async function loadUsers() {
  const rows = await must(sb.rpc('admin_users', { q: '', lim: 5000 }), 'Kullanıcılar');
  state.users = new Map(rows.map((u) => [u.id, u]));
}
const who = (id) => {
  const u = state.users.get(id);
  if (!u) return h('span', { class: 'subtle mono' }, id ? id.slice(0, 8) : '—');
  return h('span', null, h('b', null, u.nickname || '(takma ad yok)'), ' ', h('span', { class: 'subtle' }, u.email || ''));
};

// ── iskelet ve gezinme ────────────────────────────────────────────────────
const VIEWS = [
  ['dashboard', 'Pano'], ['reports', 'Şikâyetler'], ['users', 'Kullanıcılar'], ['duas', 'Dua istekleri'],
  ['chat', 'Sohbet'], ['khatm', 'Hatim grupları'], ['content', 'İçerik'], ['words', 'Yasaklı kelimeler'], ['settings', 'Ayarlar ve günlük'],
];
function shell() {
  const app = clear($('#app'));
  const side = h('nav', { class: 'side', 'aria-label': 'Bölümler' },
    h('div', { class: 'brand' }, h('div', { class: 'mark' }, '5'), h('div', null, 'BEŞ Yönetim', h('small', null, state.profile.nickname || ''))),
    VIEWS.map(([id, ad]) => h('button', { class: 'nav', 'data-v': id, onclick: () => go(id) }, ad, id === 'reports' ? h('span', { class: 'badge warn', id: 'rep-badge', style: { display: 'none' } }) : null)),
    h('div', { class: 'foot' }, h('span', null, state.user.email), h('button', { class: 'btn sm', onclick: async () => { await sb.auth.signOut(); loginScreen('Çıkış yapıldı.'); } }, 'Çıkış')));
  app.appendChild(side);
  app.appendChild(h('main', { class: 'main', id: 'main' }));
  refreshReportBadge();
}
async function refreshReportBadge() {
  const { count } = await sb.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open');
  const b = $('#rep-badge');
  if (b) { b.textContent = count || ''; b.style.display = count ? '' : 'none'; }
}
const charts = [];
function go(view) {
  if (!VIEWS.some(([id]) => id === view)) view = 'dashboard';
  state.view = view;
  if (location.hash.slice(1) !== view) history.pushState(null, '', `#${view}`);
  document.querySelectorAll('.nav').forEach((n) => n.classList.toggle('on', n.dataset.v === view));
  charts.splice(0).forEach((c) => c.destroy());
  const main = clear($('#main'));
  const fn = { dashboard: viewDashboard, reports: viewReports, users: viewUsers, duas: viewDuas, chat: viewChat, khatm: viewKhatm, content: viewContent, words: viewWords, settings: viewSettings }[view];
  fn(main).catch((e) => { fail(e, 'Yükleme'); main.appendChild(h('div', { class: 'empty' }, 'Bu bölüm yüklenemedi. Sayfayı yenileyin.')); });
}
const header = (title, sub, right) => h('div', { class: 'row', style: { marginBottom: '18px', alignItems: 'flex-end' } },
  h('div', { class: 'grow' }, h('h1', null, title), sub ? h('p', { class: 'sub', style: { margin: 0 } }, sub) : null), right || null);

// ── PANO ──────────────────────────────────────────────────────────────────
async function viewDashboard(main) {
  let gun = Number(sessionStorage.getItem('dash.days') || 30);
  const aralik = h('select', { class: 'inline', onchange: (e) => { sessionStorage.setItem('dash.days', e.target.value); go('dashboard'); } },
    [7, 30, 90].map((d) => h('option', { value: d, selected: d === gun ? true : null }, `Son ${d} gün`)));
  main.appendChild(header('Pano', 'Uygulamanın genel durumu, büyüme ve gelir', aralik));
  const stats = await must(sb.rpc('admin_stats', { days: gun }), 'İstatistik');
  const t = stats.totals; const daily = stats.daily || [];

  const kpi = (l, v, s, tone) => h('div', { class: 'card kpi' }, h('div', { class: 'l' }, l), h('div', { class: 'v', style: tone ? { color: `var(--${tone})` } : null }, num(v)), s ? h('div', { class: 's' }, s) : null);
  main.appendChild(h('h2', null, 'Kullanıcılar'));
  main.appendChild(h('div', { class: 'grid g4' },
    kpi('Kayıtlı hesap', t.users, `Apple ${num(t.apple)} · Google ${num(t.google)}`),
    kpi('Bugün aktif', t.activeToday, 'giriş yapmış kullanıcı'),
    kpi('Son 7 gün aktif', t.active7), kpi('Son 30 gün aktif', t.active30),
    kpi('Hesapla eşitleyen', t.syncUsers),
    kpi('Açık şikâyet', t.openReports, 'yanıt bekliyor', t.openReports ? 'warn' : null),
    kpi('Yasaklı', t.banned), kpi('Susturulmuş', t.muted)));
  main.appendChild(h('h2', { style: { marginTop: '22px' } }, 'Topluluk'));
  main.appendChild(h('div', { class: 'grid g4' },
    kpi('Dua isteği', t.duaRequests), kpi('Edilen dua', t.prayers), kpi('Sohbet mesajı', t.chatMessages),
    kpi('Hatim grubu', t.khatmCircles, `${num(t.khatmActive)} süren · ${num(t.khatmCompleted)} biten`), kpi('Okunan cüz', t.juzCompleted),
    kpi('Panel içeriği', t.contentItems)));

  const ext = h('div', { class: 'card col', style: { marginTop: '22px' } }, h('h2', null, 'Mağaza ve gelir'), h('div', { class: 'subtle' }, 'Kaynaklar sorgulanıyor…'));
  main.appendChild(ext);

  const grafikler = h('div', { class: 'grid g2', style: { marginTop: '22px' } });
  main.appendChild(grafikler);
  const etiket = daily.map((d) => fmtDay(d.day));
  lineChart(grafikler, 'Yeni hesap ve aktif kullanıcı', etiket, [
    ['Yeni hesap', daily.map((d) => d.signups), '#d9b25f'], ['Aktif (giriş yapmış)', daily.map((d) => d.active), '#5fc59a'], ['Eşitleme', daily.map((d) => d.syncs), '#6fb3e0']]);
  barChart(grafikler, 'Topluluk etkinliği', etiket, [
    ['Dua isteği', daily.map((d) => d.duaRequests), '#d9b25f'], ['Edilen dua', daily.map((d) => d.prayers), '#5fc59a'], ['Mesaj', daily.map((d) => d.chatMessages), '#6fb3e0'], ['Şikâyet', daily.map((d) => d.reports), '#e46a5e']]);

  // Dış kaynaklar: sunucu işlevi gizli anahtarlarla okur, geçmişi metrics_daily'ye yazar.
  let dis = null;
  try {
    const r = await sb.functions.invoke('admin-metrics', { body: {} });
    if (r.error) throw r.error;
    dis = r.data;
  } catch (e) { dis = { errors: [String(e.message || e)] }; }
  const since = daily.length ? daily[0].day : new Date().toISOString().slice(0, 10);
  const metrics = await must(sb.from('metrics_daily').select('*').gte('day', since).order('day'), 'Metrikler');
  renderExternal(ext, dis, metrics, daily, grafikler);
}

function renderExternal(box, dis, metrics, daily, grafikler) {
  clear(box).appendChild(h('div', { class: 'row' }, h('h2', { class: 'grow' }, 'Mağaza ve gelir'), h('span', { class: 'subtle' }, dis && dis.at ? `Güncellendi: ${fmtDate(dis.at)}` : '')));
  const rc = dis && dis.revenuecat;
  if (rc && rc.configured && rc.metrics) {
    const para = rc.currency || 'USD';
    const m = Object.fromEntries(rc.metrics.map((x) => [x.id, x]));
    const deger = (id, money) => (m[id] ? (money ? `${Number(m[id].value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${para}` : num(m[id].value)) : '—');
    box.appendChild(h('div', { class: 'grid g4' },
      [['Gelir (28 gün)', 'revenue', true], ['MRR (aylık yinelenen)', 'mrr', true], ['Aktif abonelik', 'active_subscriptions'], ['Aktif deneme', 'active_trials'], ['Yeni müşteri (28 gün)', 'new_customers'], ['Pro ekranı kullanıcısı (28 gün)', 'active_users']]
        .map(([l, id, money]) => h('div', { class: 'card kpi' }, h('div', { class: 'l' }, l), h('div', { class: 'v' }, deger(id, money)), h('div', { class: 's' }, 'RevenueCat')))));
  }
  const ulasilamadi = !dis || (!dis.revenuecat && !dis.appstore);
  const kaynak = (ok, ad, ayrinti) => h('div', { class: 'src' }, h('span', { class: `dot ${ok === true ? 'ok' : ok === 'bad' ? 'bad' : 'off'}` }), h('div', null, h('b', null, ad), h('div', { class: 'subtle' }, ayrinti)));
  const as = dis && dis.appstore;
  box.appendChild(h('div', null,
    ulasilamadi ? h('div', { class: 'badge bad', style: { whiteSpace: 'normal' } }, 'Sunucu işlevine ulaşılamadı; mağaza ve gelir kaynakları şu an denetlenemedi. Sayfayı yenileyin.') : null,
    kaynak(ulasilamadi ? 'bad' : rc && rc.configured ? true : 'off', 'RevenueCat — abonelik ve satın alma geliri', ulasilamadi ? 'Denetlenemedi.' : rc && rc.configured ? 'Bağlı. Her açılışta günlük kesit kaydedilir; MRR geçmişi aşağıdaki grafikte birikir.' : 'Bağlı değil.'),
    kaynak(ulasilamadi ? 'bad' : as && as.configured ? (as.errors && as.errors.length ? 'bad' : true) : 'off', 'App Store Connect — indirme, yeniden indirme, güncelleme, uygulama içi satış',
      as && as.configured ? `Bağlı. ${num(as.fetchedDays)} gün çekildi${as.pendingDays ? `, ${as.pendingDays} gün sırada (sonraki açılışta)` : ''}.${as.errors && as.errors.length ? ` Hata: ${as.errors[0]}` : ''}`
        : as && as.missing === 'vendor' ? 'Satıcı numarası (vendor number) girilmemiş → Ayarlar bölümünden girin. Numara App Store Connect → Payments and Financial Reports sayfasının sol üstünde yazar (banka sözleşmesi tamamlanınca görünür).'
          : ulasilamadi ? 'Denetlenemedi.' : 'Anahtar tanımlı değil.'),
    kaynak('off', 'Google Play Console — Android indirmeleri', 'Henüz bağlı değil: Android sürümü yayına alınınca Play Console hizmet hesabı bağlanacak (bkz. ADMIN_PANEL.md).'),
    kaynak('off', 'AdMob — reklam geliri', 'Bağlı değil: AdMob API yalnız Google hesabıyla OAuth onayı ister; adımlar ADMIN_PANEL.md\'de. O zamana kadar AdMob uygulamasından/sitesinden bakılır.'),
    kaynak(true, 'Supabase — hesaplar, aktiflik, topluluk', 'Bağlı (canlı). Giriş yapmadan kullananlar bilerek sayılmaz: uygulamada analitik yok (gizlilik sözü); onların sayısı mağaza indirmelerinden okunur.'),
    dis && dis.errors && dis.errors.length ? h('div', { class: 'badge bad', style: { whiteSpace: 'normal' } }, dis.errors.join(' · ')) : null));

  const gunler = daily.map((d) => d.day);
  const seri = (src, metric) => gunler.map((g) => { const r = metrics.find((x) => x.day === g && x.source === src && x.metric === metric); return r ? Number(r.value) : null; });
  const etiket = daily.map((d) => fmtDay(d.day));
  if (metrics.some((x) => x.source === 'appstore')) {
    barChart(grafikler, 'App Store — günlük', etiket, [['İlk indirme', seri('appstore', 'downloads'), '#d9b25f'], ['Yeniden indirme', seri('appstore', 'redownloads'), '#6fb3e0'], ['Uygulama içi satış', seri('appstore', 'iap_units'), '#5fc59a']]);
  }
  if (metrics.some((x) => x.source === 'revenuecat')) {
    lineChart(grafikler, 'RevenueCat — gelir ve abonelik (günlük kesit)', etiket, [['Gelir 28g', seri('revenuecat', 'revenue'), '#d9b25f'], ['MRR', seri('revenuecat', 'mrr'), '#5fc59a'], ['Aktif abonelik', seri('revenuecat', 'active_subscriptions'), '#6fb3e0']]);
  }
}

function chartBox(parent, title) {
  const canvas = h('canvas');
  parent.appendChild(h('div', { class: 'card' }, h('h3', null, title), h('div', { class: 'chart' }, canvas)));
  return canvas;
}
const chartOpts = () => ({
  responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
  plugins: { legend: { labels: { color: '#9db8ab', boxWidth: 12 } } },
  scales: { x: { ticks: { color: '#6f8c7f', maxRotation: 0, autoSkip: true }, grid: { color: '#16392d' } }, y: { beginAtZero: true, ticks: { color: '#6f8c7f', precision: 0 }, grid: { color: '#16392d' } } },
});
function lineChart(parent, title, labels, sets) {
  charts.push(new window.Chart(chartBox(parent, title), { type: 'line', data: { labels, datasets: sets.map(([label, data, color]) => ({ label, data, borderColor: color, backgroundColor: `${color}33`, tension: 0.3, spanGaps: true, pointRadius: 2 })) }, options: chartOpts() }));
}
function barChart(parent, title, labels, sets) {
  charts.push(new window.Chart(chartBox(parent, title), { type: 'bar', data: { labels, datasets: sets.map(([label, data, color]) => ({ label, data, backgroundColor: color, borderRadius: 4 })) }, options: chartOpts() }));
}

// ── ŞİKÂYETLER ────────────────────────────────────────────────────────────
async function viewReports(main) {
  const durum = sessionStorage.getItem('rep.status') || 'open';
  main.appendChild(header('Şikâyetler', 'Apple kuralı (1.2): şikâyetler 24 saat içinde incelenmeli.'));
  main.appendChild(h('div', { class: 'tabs' }, [['open', 'Açık'], ['reviewed', 'Sonuçlanan'], ['dismissed', 'Reddedilen'], ['all', 'Tümü']]
    .map(([id, ad]) => h('button', { class: `tab ${durum === id ? 'on' : ''}`, onclick: () => { sessionStorage.setItem('rep.status', id); go('reports'); } }, ad))));
  let q = sb.from('reports').select('*').order('created_at', { ascending: false }).limit(300);
  if (durum !== 'all') q = q.eq('status', durum);
  const reps = await must(q, 'Şikâyetler');
  if (!reps.length) { main.appendChild(h('div', { class: 'card empty' }, durum === 'open' ? 'Açık şikâyet yok. 🎉' : 'Kayıt yok.')); return; }

  const duaIds = reps.filter((r) => r.target_type === 'dua_request').map((r) => r.target_id);
  const msgIds = reps.filter((r) => r.target_type === 'chat_message').map((r) => r.target_id);
  const [dualar, mesajlar, odalar] = await Promise.all([
    duaIds.length ? must(sb.from('dua_requests').select('*').in('id', duaIds), 'Dua') : [],
    msgIds.length ? must(sb.from('chat_messages').select('*').in('id', msgIds), 'Mesaj') : [],
    must(sb.from('chat_rooms').select('id,title'), 'Odalar'),
  ]);
  const icerik = new Map([...dualar.map((d) => [d.id, { ...d, kind: 'dua_request' }]), ...mesajlar.map((m) => [m.id, { ...m, kind: 'chat_message' }])]);
  const odaAdi = new Map(odalar.map((o) => [o.id, o.title]));
  const yazarSikayet = new Map();
  for (const r of reps) { const c = icerik.get(r.target_id); if (c) yazarSikayet.set(c.author_id, (yazarSikayet.get(c.author_id) || 0) + 1); }

  const liste = h('div', { class: 'col' });
  main.appendChild(liste);
  for (const r of reps) {
    const c = icerik.get(r.target_id);
    const yazar = c ? state.users.get(c.author_id) : null;
    const kart = h('div', { class: 'card col' },
      h('div', { class: 'row' },
        h('span', { class: `badge ${r.status === 'open' ? 'warn' : r.status === 'reviewed' ? 'ok' : ''}` }, { open: 'Açık', reviewed: 'Sonuçlandı', dismissed: 'Reddedildi' }[r.status] || r.status),
        h('span', { class: 'badge info' }, r.target_type === 'dua_request' ? 'Dua isteği' : `Sohbet mesajı${c && c.room_id ? ` · ${odaAdi.get(c.room_id) || ''}` : ''}`),
        h('span', { class: 'grow' }), h('span', { class: 'subtle' }, `#${r.id} · ${fmtDate(r.created_at)}`)),
      h('dl', { class: 'kv' },
        h('dt', null, 'Şikâyet eden'), h('dd', null, who(r.reporter_id)),
        h('dt', null, 'Sebep'), h('dd', { class: 'body' }, r.reason),
        h('dt', null, 'İçeriğin yazarı'), h('dd', null, c ? who(c.author_id) : h('span', { class: 'subtle' }, 'İçerik silinmiş'),
          c && yazarSikayet.get(c.author_id) > 1 ? h('span', { class: 'badge bad', style: { marginLeft: '8px' } }, `bu listede ${yazarSikayet.get(c.author_id)} şikâyet`) : null,
          yazar && yazar.banned ? h('span', { class: 'badge bad', style: { marginLeft: '8px' } }, 'yasaklı') : null,
          yazar && yazar.muted_until && new Date(yazar.muted_until) > new Date() ? h('span', { class: 'badge warn', style: { marginLeft: '8px' } }, `susturulmuş: ${fmtDate(yazar.muted_until)}`) : null,
          yazar && yazar.warning_count ? h('span', { class: 'badge warn', style: { marginLeft: '8px' } }, `${yazar.warning_count} uyarı`) : null),
        r.resolution_note ? [h('dt', null, 'Yönetici notu'), h('dd', { class: 'body' }, r.resolution_note)] : null),
      c ? h('div', { class: 'col' },
        h('div', { class: 'subtle' }, `İçerik (${fmtDate(c.created_at)})${c.is_hidden ? ' — GİZLİ' : ''}:`),
        h('div', { class: 'quote' }, c.body),
        c.kind === 'chat_message' ? h('button', { class: 'btn sm', style: { alignSelf: 'flex-start' }, onclick: () => showContext(c, odaAdi.get(c.room_id)) }, 'Sohbetteki bağlamını gör') : null) : null,
      h('div', { class: 'row' },
        c && !c.is_hidden ? h('button', { class: 'btn', onclick: () => act(async () => { await hideContent(c, true); await resolve(r, 'reviewed', 'İçerik gizlendi'); }) }, 'İçeriği gizle') : null,
        c && c.is_hidden ? h('button', { class: 'btn', onclick: () => act(() => hideContent(c, false)) }, 'Görünür yap') : null,
        c ? h('button', { class: 'btn bad', onclick: () => confirmBox('İçeriği sil', 'İçerik kalıcı olarak silinir. Şikâyet "sonuçlandı" olarak kapanır.', 'Sil', async () => { await deleteContent(c); await resolve(r, 'reviewed', 'İçerik silindi'); go('reports'); }) }, 'İçeriği sil') : null,
        c ? h('button', { class: 'btn', onclick: () => warnUser(c.author_id, r.id, () => resolve(r, 'reviewed', 'Yazar uyarıldı').then(() => go('reports'))) }, 'Yazarı uyar') : null,
        c ? h('button', { class: 'btn', onclick: () => muteUser(c.author_id, () => go('reports')) }, 'Sustur') : null,
        c && !(yazar && yazar.banned) ? h('button', { class: 'btn bad', onclick: () => banUser(c.author_id, `Şikâyet #${r.id}`, async () => { await resolve(r, 'reviewed', 'Yazar yasaklandı'); go('reports'); }) }, 'Yasakla') : null,
        h('span', { class: 'grow' }),
        r.status === 'open' ? h('button', { class: 'btn', onclick: () => promptBox('Şikâyeti reddet', 'Not (isteğe bağlı)', { required: false, okLabel: 'Reddet' }, async (not) => { await resolve(r, 'dismissed', not); go('reports'); }) }, 'Reddet') : null,
        r.status === 'open' ? h('button', { class: 'btn pri', onclick: () => promptBox('Sonuçlandı olarak kapat', 'Not (isteğe bağlı)', { required: false, okLabel: 'Kapat' }, async (not) => { await resolve(r, 'reviewed', not); go('reports'); }) }, 'Sonuçlandı') : null,
        r.status !== 'open' ? h('button', { class: 'btn sm', onclick: () => act(async () => { await resolve(r, 'open', null); go('reports'); }) }, 'Yeniden aç') : null));
    liste.appendChild(kart);
  }
}
async function act(fn) { try { await fn(); toast('Tamam.', 'ok'); } catch (e) { fail(e, 'İşlem'); } }
async function resolve(r, status, note) {
  await must(sb.from('reports').update({ status, resolution_note: note || null, resolved_by: status === 'open' ? null : state.user.id, resolved_at: status === 'open' ? null : new Date().toISOString() }).eq('id', r.id), 'Şikâyet');
  await audit(`report_${status}`, r.id, { note });
  refreshReportBadge();
}
async function hideContent(c, hide) {
  const tablo = c.kind === 'dua_request' ? 'dua_requests' : 'chat_messages';
  await must(sb.from(tablo).update({ is_hidden: hide }).eq('id', c.id), 'Gizleme');
  await audit(hide ? 'hide' : 'unhide', `${tablo}:${c.id}`, { body: short(c.body, 300) });
  c.is_hidden = hide;
  if (state.view === 'reports') go('reports');
}
async function deleteContent(c) {
  const tablo = c.kind === 'dua_request' ? 'dua_requests' : 'chat_messages';
  await must(sb.from(tablo).delete().eq('id', c.id), 'Silme');
  await audit('delete', `${tablo}:${c.id}`, { author: c.author_id, body: short(c.body, 500) });
}
async function showContext(m, oda) {
  const [once, sonra] = await Promise.all([
    must(sb.from('chat_messages').select('*').eq('room_id', m.room_id).lt('created_at', m.created_at).order('created_at', { ascending: false }).limit(6), 'Bağlam'),
    must(sb.from('chat_messages').select('*').eq('room_id', m.room_id).gt('created_at', m.created_at).order('created_at').limit(6), 'Bağlam'),
  ]);
  const satir = (x, vurgu) => h('div', { class: vurgu ? 'quote' : 'card', style: { padding: '8px 12px' } },
    h('div', { class: 'subtle' }, `${x.nickname} · ${fmtDate(x.created_at)}${x.is_hidden ? ' · gizli' : ''}`), h('div', { class: 'body' }, x.body));
  modal(`Sohbet bağlamı — ${oda || ''}`, h('div', { class: 'col' }, once.reverse().map((x) => satir(x)), satir(m, true), sonra.map((x) => satir(x))));
}

// ── kullanıcı işlemleri (şikâyet ve kullanıcı ekranları ortak) ─────────────
async function ensureProfile(uid) {
  const { data } = await sb.from('profiles').select('id').eq('id', uid).maybeSingle();
  if (!data) await must(sb.from('profiles').insert({ id: uid, nickname: `Kullanıcı-${uid.slice(0, 6)}` }), 'Profil');
}
function warnUser(uid, reportId, after) {
  promptBox('Kullanıcıyı uyar', 'Uyarı metni — kullanıcı bunu uygulamada Topluluk sekmesinde görür', { okLabel: 'Uyarıyı gönder' }, async (metin) => {
    await must(sb.from('user_warnings').insert({ user_id: uid, message: metin, report_id: reportId || null, created_by: state.user.id }), 'Uyarı');
    await audit('warn', uid, { message: metin, report: reportId || null });
    const u = state.users.get(uid); if (u) u.warning_count = (u.warning_count || 0) + 1;
    toast('Uyarı gönderildi.', 'ok');
    if (after) await after();
  });
}
function muteUser(uid, after) {
  const sec = h('select', null, [['1', '1 saat'], ['24', '24 saat'], ['168', '7 gün'], ['720', '30 gün'], ['0', 'Susturmayı kaldır']].map(([v, l]) => h('option', { value: v }, l)));
  modal('Sustur', h('label', { class: 'f' }, 'Süre — susturulan kişi bu süre boyunca dua isteği/mesaj gönderemez, cüz alamaz', sec), (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    h('button', { class: 'btn pri', onclick: async () => {
      try {
        await ensureProfile(uid);
        const saat = Number(sec.value);
        const until = saat ? new Date(Date.now() + saat * 3600000).toISOString() : null;
        await must(sb.from('profiles').update({ muted_until: until }).eq('id', uid), 'Susturma');
        await audit(saat ? 'mute' : 'unmute', uid, { hours: saat });
        const u = state.users.get(uid); if (u) u.muted_until = until;
        kapat(); toast(saat ? 'Susturuldu.' : 'Susturma kaldırıldı.', 'ok'); if (after) after();
      } catch (e) { fail(e, 'Susturma'); }
    } }, 'Uygula'),
  ]);
}
function banUser(uid, reason, after) {
  promptBox('Yasakla', 'Sebep (yalnız yöneticiler görür)', { initial: reason || '', okLabel: 'Yasakla' }, async (sebep) => {
    await ensureProfile(uid);
    await must(sb.from('profiles').update({ banned: true, ban_reason: sebep }).eq('id', uid), 'Yasaklama');
    await audit('ban', uid, { reason: sebep });
    const u = state.users.get(uid); if (u) { u.banned = true; u.ban_reason = sebep; }
    toast('Kullanıcı yasaklandı: artık hiçbir topluluk içeriği gönderemez.', 'ok');
    if (after) await after();
  });
}
async function unban(uid) {
  await must(sb.from('profiles').update({ banned: false, ban_reason: null, muted_until: null }).eq('id', uid), 'Yasak kaldırma');
  await audit('unban', uid);
  const u = state.users.get(uid); if (u) { u.banned = false; u.ban_reason = null; u.muted_until = null; }
}

// ── KULLANICILAR ──────────────────────────────────────────────────────────
async function viewUsers(main) {
  await loadUsers();
  const ara = h('input', { placeholder: 'Takma ad, e-posta ya da kimlik ara…', class: 'inline', style: { width: '320px' } });
  const filtre = h('select', { class: 'inline' }, [['all', 'Hepsi'], ['banned', 'Yasaklılar'], ['muted', 'Susturulanlar'], ['admin', 'Yöneticiler'], ['sync', 'Eşitleyenler'], ['warned', 'Uyarılanlar']].map(([v, l]) => h('option', { value: v }, l)));
  main.appendChild(header('Kullanıcılar', `${state.users.size} hesap`, h('div', { class: 'row' }, ara, filtre)));
  const wrap = h('div', { class: 'tablewrap' });
  main.appendChild(wrap);
  const ciz = () => {
    const s = ara.value.trim().toLowerCase(); const f = filtre.value; const simdi = new Date();
    const rows = [...state.users.values()].filter((u) => (!s || [u.nickname, u.email, u.id].some((x) => x && x.toLowerCase().includes(s)))
      && (f === 'all' || (f === 'banned' && u.banned) || (f === 'muted' && u.muted_until && new Date(u.muted_until) > simdi) || (f === 'admin' && u.is_admin) || (f === 'sync' && u.has_sync) || (f === 'warned' && u.warning_count)));
    clear(wrap).appendChild(rows.length ? h('table', null,
      h('thead', null, h('tr', null, ['Takma ad', 'E-posta', 'Giriş', 'Kayıt', 'Son giriş', 'Dua', 'Mesaj', 'Durum'].map((x) => h('th', null, x)))),
      h('tbody', null, rows.map((u) => h('tr', { class: 'click', onclick: () => userDetail(u.id) },
        h('td', null, h('b', null, u.nickname || '—')), h('td', null, u.email || '—'), h('td', null, h('span', { class: 'badge' }, u.provider)),
        h('td', { class: 'subtle' }, fmtDate(u.created_at)), h('td', { class: 'subtle' }, fmtDate(u.last_sign_in_at)),
        h('td', null, num(u.dua_count)), h('td', null, num(u.message_count)),
        h('td', null, u.is_admin ? h('span', { class: 'badge gold' }, 'yönetici') : null, u.banned ? h('span', { class: 'badge bad' }, 'yasaklı') : null,
          u.muted_until && new Date(u.muted_until) > simdi ? h('span', { class: 'badge warn' }, 'susturulmuş') : null,
          u.warning_count ? h('span', { class: 'badge warn' }, `${u.warning_count} uyarı`) : null,
          u.has_sync ? h('span', { class: 'badge info' }, 'eşitleme') : null))))) : h('div', { class: 'empty' }, 'Eşleşen kullanıcı yok.'));
  };
  ara.addEventListener('input', ciz); filtre.addEventListener('change', ciz); ciz();
}

async function userDetail(uid) {
  await loadUsers();
  const u = state.users.get(uid);
  if (!u) { toast('Kullanıcı bulunamadı (silinmiş olabilir).', 'bad'); return; }
  const [dualar, mesajlar, uyarilar, sikayetEttigi, gruplar] = await Promise.all([
    must(sb.from('dua_requests').select('*').eq('author_id', uid).order('created_at', { ascending: false }).limit(100), 'Dua'),
    must(sb.from('chat_messages').select('*').eq('author_id', uid).order('created_at', { ascending: false }).limit(100), 'Mesaj'),
    must(sb.from('user_warnings').select('*').eq('user_id', uid).order('created_at', { ascending: false }), 'Uyarı'),
    must(sb.from('reports').select('*').eq('reporter_id', uid).order('created_at', { ascending: false }).limit(50), 'Şikâyet'),
    must(sb.from('khatm_circles').select('*').eq('created_by', uid), 'Hatim'),
  ]);
  const yenile = () => { userDetail(uid); if (state.view === 'users') go('users'); };
  const ben = uid === state.user.id;
  const simdi = new Date();
  const body = h('div', { class: 'col' },
    h('dl', { class: 'kv' },
      h('dt', null, 'Takma ad'), h('dd', null, u.nickname || '—'),
      h('dt', null, 'E-posta'), h('dd', null, u.email || '—'),
      h('dt', null, 'Giriş yöntemi'), h('dd', null, u.provider),
      h('dt', null, 'Kimlik'), h('dd', { class: 'mono' }, u.id),
      h('dt', null, 'Kayıt / son giriş'), h('dd', null, `${fmtDate(u.created_at)} / ${fmtDate(u.last_sign_in_at)}`),
      h('dt', null, 'Durum'), h('dd', null, u.is_admin ? h('span', { class: 'badge gold' }, 'yönetici') : null, ' ',
        u.banned ? h('span', { class: 'badge bad' }, `yasaklı${u.ban_reason ? `: ${u.ban_reason}` : ''}`) : h('span', { class: 'badge ok' }, 'etkin'), ' ',
        u.muted_until && new Date(u.muted_until) > simdi ? h('span', { class: 'badge warn' }, `susturulmuş: ${fmtDate(u.muted_until)}`) : null),
      h('dt', null, 'Hesapla eşitleme'), h('dd', null, u.has_sync ? `Var — ${num(u.sync_bytes)} bayt, son: ${fmtDate(u.sync_updated_at)} (içerik gizlilik gereği okunmaz)` : 'Yok')),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => warnUser(uid, null, yenile) }, 'Uyar'),
      h('button', { class: 'btn', onclick: () => muteUser(uid, yenile) }, 'Sustur'),
      u.banned ? h('button', { class: 'btn', onclick: () => act(async () => { await unban(uid); yenile(); }) }, 'Yasağı kaldır')
        : h('button', { class: 'btn bad', disabled: ben ? true : null, onclick: () => banUser(uid, '', yenile) }, 'Yasakla'),
      h('button', { class: 'btn', onclick: () => promptBox('Takma adı değiştir', 'Yeni takma ad (1-24 karakter)', { initial: u.nickname || '', multiline: false }, async (ad) => {
        if (ad.length > 24) throw new Error('En fazla 24 karakter.');
        await ensureProfile(uid);
        await must(sb.from('profiles').update({ nickname: ad }).eq('id', uid), 'Takma ad');
        await audit('rename', uid, { from: u.nickname, to: ad }); yenile();
      }) }, 'Takma adı değiştir'),
      h('button', { class: 'btn', disabled: ben ? true : null, onclick: () => confirmBox(u.is_admin ? 'Yöneticiliği kaldır' : 'Yönetici yap',
        u.is_admin ? 'Bu hesap paneli artık açamaz.' : 'Bu hesap panelin TAMAMINA erişir: kullanıcı silme, yasaklama, içerik. Yalnız güvendiğiniz hesaplar.',
        u.is_admin ? 'Kaldır' : 'Yönetici yap', async () => {
          await ensureProfile(uid);
          await must(sb.from('profiles').update({ is_admin: !u.is_admin }).eq('id', uid), 'Yetki');
          await audit(u.is_admin ? 'revoke_admin' : 'grant_admin', uid); yenile();
        }, { typeToConfirm: u.is_admin ? null : 'YÖNETİCİ' }) }, u.is_admin ? 'Yöneticiliği kaldır' : 'Yönetici yap'),
      u.has_sync ? h('button', { class: 'btn bad', onclick: () => confirmBox('Eşitleme kaydını sil', 'Kullanıcının hesaba yedeklenmiş kişisel kayıtları sunucudan silinir. Telefonundaki veri silinmez; bir sonraki eşitlemede telefondan yeniden yüklenebilir.', 'Sil', async () => {
        await must(sb.rpc('admin_delete_user_data', { uid }), 'Eşitleme'); await audit('delete_user_data', uid); yenile();
      }) }, 'Eşitleme kaydını sil') : null,
      h('button', { class: 'btn bad', disabled: ben ? true : null, onclick: () => confirmBox('Hesabı tamamen sil', `${u.email || u.nickname} hesabı ve bütün içeriği (dua istekleri, mesajlar, hatim grupları, eşitleme kaydı) kalıcı olarak silinir. Geri alınamaz.`, 'Kalıcı olarak sil', async () => {
        await must(sb.rpc('admin_delete_user', { uid }), 'Hesap silme'); await audit('delete_user', uid, { email: u.email, nickname: u.nickname });
        clear($('#modal-root')); state.users.delete(uid); if (state.view === 'users') go('users');
      }, { typeToConfirm: 'SİL' }) }, 'Hesabı sil')),
    proKutusu(uid),
    h('h3', null, `Uyarılar (${uyarilar.length})`),
    uyarilar.length ? uyarilar.map((w) => h('div', { class: 'row card', style: { padding: '8px 12px' } }, h('div', { class: 'grow body' }, w.message),
      h('span', { class: 'subtle' }, `${fmtDate(w.created_at)} · ${w.seen_at ? 'okundu' : 'okunmadı'}`),
      h('button', { class: 'btn sm bad', onclick: () => act(async () => { await must(sb.from('user_warnings').delete().eq('id', w.id), 'Uyarı'); await audit('delete_warning', uid, { id: w.id }); yenile(); }) }, 'Sil'))) : h('div', { class: 'subtle' }, 'Yok'),
    h('h3', null, `Dua istekleri (${dualar.length})`),
    contentList(dualar.map((d) => ({ ...d, kind: 'dua_request' })), yenile),
    h('h3', null, `Sohbet mesajları (${mesajlar.length})`),
    contentList(mesajlar.map((m) => ({ ...m, kind: 'chat_message' })), yenile),
    h('h3', null, `Açtığı hatim grupları (${gruplar.length})`),
    gruplar.length ? gruplar.map((g) => h('div', { class: 'subtle' }, `${g.title} — ${fmtDate(g.created_at)}`)) : h('div', { class: 'subtle' }, 'Yok'),
    h('h3', null, `Yaptığı şikâyetler (${sikayetEttigi.length})`),
    sikayetEttigi.length ? sikayetEttigi.map((r) => h('div', { class: 'subtle' }, `#${r.id} · ${r.status} · ${short(r.reason, 80)}`)) : h('div', { class: 'subtle' }, 'Yok'));
  modal(`Kullanıcı: ${u.nickname || u.email || uid.slice(0, 8)}`, body);
}

// ── ücretsiz Pro (RevenueCat promosyon hakkı, sunucu işlevi admin-pro) ────
function proKutusu(uid) {
  const kutu = h('div', { class: 'card col' }, h('h3', null, 'Pro'), h('div', { class: 'subtle' }, 'Durum okunuyor…'));
  const cagir = async (body) => {
    const r = await sb.functions.invoke('admin-pro', { body: { uid, ...body } });
    if (r.error) {
      let mesaj = r.error.message;
      try { const j = await r.error.context.json(); if (j && j.error) mesaj = j.error; } catch (_) { /* gövde yok */ }
      throw new Error(mesaj);
    }
    return r.data;
  };
  const ciz = (d) => {
    const bitis = d.active ? (d.expiresAt > Date.now() + 50 * 365 * 86400000 ? 'süresiz' : `bitiş: ${fmtDate(new Date(d.expiresAt).toISOString())}`) : null;
    const ver = (sure, ad) => h('button', { class: 'btn sm', onclick: () => act(async () => { ciz(await cagir({ action: 'grant', duration: sure })); }) }, ad);
    clear(kutu).append(
      h('h3', null, 'Pro'),
      h('div', null, d.active ? h('span', { class: 'badge gold' }, `Pro etkin — ${bitis}`) : h('span', { class: 'badge' }, 'Pro yok'),
        d.linked ? null : h('span', { class: 'subtle', style: { marginLeft: '8px' } }, 'Kullanıcı Pro destekli sürümle (1.0.1+) henüz giriş yapmamış; verilen Pro ilk girişte geçerli olur.')),
      h('div', { class: 'subtle' }, 'Verilen Pro, satın alınmış gibi çalışır: reklamsız + bütün Pro özellikleri, aynı hesapla giriş yapılan her telefonda. Süre dolunca kendiliğinden biter. (Uygulamanın 1.0.1 ve sonrası sürümlerinde.)'),
      h('div', { class: 'row' }, h('span', { class: 'subtle' }, 'Ücretsiz Pro ver:'), ver('week', '1 hafta'), ver('month', '1 ay'), ver('year', '1 yıl'), ver('lifetime', 'Süresiz'),
        d.active ? h('button', { class: 'btn sm bad', onclick: () => confirmBox('Pro\'yu geri al', 'Panelden verilen Pro hemen kalkar. (Kullanıcının kendi satın aldığı abonelik etkilenmez.)', 'Geri al', async () => { ciz(await cagir({ action: 'revoke' })); }) }, 'Geri al') : null));
  };
  cagir({ action: 'status' }).then(ciz).catch((e) => { clear(kutu).append(h('h3', null, 'Pro'), h('div', { class: 'badge bad', style: { whiteSpace: 'normal' } }, `Pro durumu okunamadı: ${e.message}`)); });
  return kutu;
}

function contentList(items, after) {
  if (!items.length) return h('div', { class: 'subtle' }, 'Yok');
  return h('div', { class: 'col' }, items.map((c) => h('div', { class: 'card', style: { padding: '10px 12px' } },
    h('div', { class: 'row' }, h('span', { class: 'subtle grow' }, `${fmtDate(c.created_at)}${c.prayer_count !== undefined ? ` · ${c.prayer_count} dua` : ''}`),
      c.is_hidden ? h('span', { class: 'badge warn' }, 'gizli') : null,
      h('button', { class: 'btn sm', onclick: () => act(async () => { await hideContent(c, !c.is_hidden); after(); }) }, c.is_hidden ? 'Göster' : 'Gizle'),
      h('button', { class: 'btn sm bad', onclick: () => confirmBox('Sil', 'Kalıcı olarak silinsin mi?', 'Sil', async () => { await deleteContent(c); after(); }) }, 'Sil')),
    h('div', { class: 'body' }, c.body))));
}

// ── DUA İSTEKLERİ ─────────────────────────────────────────────────────────
const DUA_KAT = { saglik: 'Sağlık', aile: 'Aile', sinav_is: 'Sınav / İş', vefat: 'Vefat', genel: 'Genel' };
async function viewDuas(main) {
  const ara = h('input', { placeholder: 'Metinde ara…', class: 'inline', style: { width: '260px' } });
  const gor = h('select', { class: 'inline' }, [['all', 'Hepsi'], ['visible', 'Görünür'], ['hidden', 'Gizli']].map(([v, l]) => h('option', { value: v }, l)));
  const kat = h('select', { class: 'inline' }, h('option', { value: '' }, 'Tüm kategoriler'), Object.entries(DUA_KAT).map(([v, l]) => h('option', { value: v }, l)));
  main.appendChild(header('Dua istekleri', 'Dua panosundaki bütün istekler (gizlenenler dahil)', h('div', { class: 'row' }, ara, gor, kat)));
  const wrap = h('div', { class: 'col' }); main.appendChild(wrap);
  const yukle = async () => {
    let q = sb.from('dua_requests').select('*').order('created_at', { ascending: false }).limit(500);
    if (gor.value !== 'all') q = q.eq('is_hidden', gor.value === 'hidden');
    if (kat.value) q = q.eq('category', kat.value);
    if (ara.value.trim()) q = q.ilike('body', `%${ara.value.trim()}%`);
    const rows = await must(q, 'Dua istekleri');
    clear(wrap).appendChild(rows.length ? h('div', { class: 'tablewrap' }, h('table', null,
      h('thead', null, h('tr', null, ['Tarih', 'Yazar', 'Kategori', 'Metin', 'Dua', '', ''].map((x) => h('th', null, x)))),
      h('tbody', null, rows.map((d) => h('tr', null,
        h('td', { class: 'subtle' }, fmtDate(d.created_at)), h('td', null, h('a', { href: '#', onclick: (e) => { e.preventDefault(); userDetail(d.author_id); } }, who(d.author_id))),
        h('td', null, h('span', { class: 'badge' }, DUA_KAT[d.category] || d.category)), h('td', { class: 'body', style: { maxWidth: '420px' } }, d.body),
        h('td', null, num(d.prayer_count)), h('td', null, d.is_hidden ? h('span', { class: 'badge warn' }, 'gizli') : h('span', { class: 'badge ok' }, 'görünür')),
        h('td', null, h('div', { class: 'row' },
          h('button', { class: 'btn sm', onclick: () => editDua(d, yukle) }, 'Düzenle'),
          h('button', { class: 'btn sm', onclick: () => act(async () => { await hideContent({ ...d, kind: 'dua_request' }, !d.is_hidden); await yukle(); }) }, d.is_hidden ? 'Göster' : 'Gizle'),
          h('button', { class: 'btn sm bad', onclick: () => confirmBox('Dua isteğini sil', 'Kalıcı olarak silinir.', 'Sil', async () => { await deleteContent({ ...d, kind: 'dua_request' }); await yukle(); }) }, 'Sil')))))))) : h('div', { class: 'card empty' }, 'Kayıt yok.'));
  };
  let zaman = null;
  ara.addEventListener('input', () => { clearTimeout(zaman); zaman = setTimeout(() => yukle().catch((e) => fail(e)), 350); });
  gor.addEventListener('change', () => yukle().catch((e) => fail(e))); kat.addEventListener('change', () => yukle().catch((e) => fail(e)));
  await yukle();
}
function editDua(d, after) {
  const metin = h('textarea', { value: d.body, maxlength: 280 });
  const kat = h('select', null, Object.entries(DUA_KAT).map(([v, l]) => h('option', { value: v, selected: v === d.category ? true : null }, l)));
  modal('Dua isteğini düzenle', h('div', { class: 'col' }, h('label', { class: 'f' }, 'Kategori', kat), h('label', { class: 'f' }, 'Metin (en fazla 280)', metin)), (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    h('button', { class: 'btn pri', onclick: async () => {
      try {
        await must(sb.from('dua_requests').update({ body: metin.value.trim(), category: kat.value }).eq('id', d.id), 'Düzenleme');
        await audit('edit', `dua_requests:${d.id}`, { from: short(d.body, 300), to: short(metin.value, 300) });
        kapat(); toast('Kaydedildi.', 'ok'); await after();
      } catch (e) { fail(e, 'Düzenleme'); }
    } }, 'Kaydet')]);
}

// ── SOHBET ────────────────────────────────────────────────────────────────
async function viewChat(main) {
  const odalar = await must(sb.from('chat_rooms').select('*').order('sort_order'), 'Odalar');
  const secili = sessionStorage.getItem('chat.room') || (odalar[0] && odalar[0].id);
  main.appendChild(header('Sohbet', 'Odalar ve mesajlar', h('button', { class: 'btn pri', onclick: () => editRoom(null) }, 'Yeni oda')));
  main.appendChild(h('div', { class: 'tabs' }, odalar.map((o) => h('button', { class: `tab ${o.id === secili ? 'on' : ''}`, onclick: () => { sessionStorage.setItem('chat.room', o.id); go('chat'); } }, o.title))));
  const oda = odalar.find((o) => o.id === secili);
  if (!oda) { main.appendChild(h('div', { class: 'card empty' }, 'Oda yok.')); return; }
  main.appendChild(h('div', { class: 'card row', style: { marginBottom: '14px' } },
    h('div', { class: 'grow' }, h('b', null, oda.title), h('div', { class: 'subtle' }, `${oda.description || ''} · /${oda.slug} · sıra ${oda.sort_order}`)),
    h('button', { class: 'btn sm', onclick: () => editRoom(oda) }, 'Düzenle'),
    h('button', { class: 'btn sm bad', onclick: () => confirmBox('Odayı sil', `"${oda.title}" ve içindeki BÜTÜN mesajlar silinir.`, 'Sil', async () => {
      await must(sb.from('chat_rooms').delete().eq('id', oda.id), 'Oda'); await audit('delete_room', oda.id, { title: oda.title }); sessionStorage.removeItem('chat.room'); go('chat');
    }, { typeToConfirm: 'SİL' }) }, 'Odayı sil')));
  const ara = h('input', { placeholder: 'Mesajlarda ara…', class: 'inline', style: { width: '280px' } });
  const wrap = h('div', { class: 'col' });
  main.appendChild(h('div', { class: 'row', style: { marginBottom: '10px' } }, ara));
  main.appendChild(wrap);
  const yukle = async () => {
    let q = sb.from('chat_messages').select('*').eq('room_id', oda.id).order('created_at', { ascending: false }).limit(300);
    if (ara.value.trim()) q = q.ilike('body', `%${ara.value.trim()}%`);
    const rows = await must(q, 'Mesajlar');
    clear(wrap).appendChild(rows.length ? h('div', { class: 'tablewrap' }, h('table', null,
      h('thead', null, h('tr', null, ['Tarih', 'Yazan', 'Mesaj', '', ''].map((x) => h('th', null, x)))),
      h('tbody', null, rows.map((m) => h('tr', null,
        h('td', { class: 'subtle' }, fmtDate(m.created_at)),
        h('td', null, h('a', { href: '#', onclick: (e) => { e.preventDefault(); userDetail(m.author_id); } }, m.nickname)),
        h('td', { class: 'body', style: { maxWidth: '520px' } }, m.body),
        h('td', null, m.is_hidden ? h('span', { class: 'badge warn' }, 'gizli') : null),
        h('td', null, h('div', { class: 'row' },
          h('button', { class: 'btn sm', onclick: () => act(async () => { await hideContent({ ...m, kind: 'chat_message' }, !m.is_hidden); await yukle(); }) }, m.is_hidden ? 'Göster' : 'Gizle'),
          h('button', { class: 'btn sm bad', onclick: () => confirmBox('Mesajı sil', 'Kalıcı olarak silinir.', 'Sil', async () => { await deleteContent({ ...m, kind: 'chat_message' }); await yukle(); }) }, 'Sil')))))))) : h('div', { class: 'card empty' }, 'Mesaj yok.'));
  };
  let z = null; ara.addEventListener('input', () => { clearTimeout(z); z = setTimeout(() => yukle().catch((e) => fail(e)), 350); });
  await yukle();
}
function editRoom(oda) {
  const baslik = h('input', { value: oda ? oda.title : '' });
  const slug = h('input', { value: oda ? oda.slug : '', placeholder: 'ör. genel-sohbet' });
  const aciklama = h('textarea', { value: oda ? oda.description : '' });
  const sira = h('input', { type: 'number', value: oda ? oda.sort_order : 0 });
  modal(oda ? 'Odayı düzenle' : 'Yeni oda', h('div', { class: 'col' }, h('label', { class: 'f' }, 'Başlık', baslik), h('label', { class: 'f' }, 'Kısa ad (adres, benzersiz)', slug), h('label', { class: 'f' }, 'Açıklama', aciklama), h('label', { class: 'f' }, 'Sıra', sira)), (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    h('button', { class: 'btn pri', onclick: async () => {
      try {
        const kayit = { title: baslik.value.trim(), slug: slug.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'), description: aciklama.value.trim(), sort_order: Number(sira.value) || 0 };
        if (!kayit.title || !kayit.slug) throw new Error('Başlık ve kısa ad gerekli.');
        if (oda) await must(sb.from('chat_rooms').update(kayit).eq('id', oda.id), 'Oda'); else await must(sb.from('chat_rooms').insert(kayit), 'Oda');
        await audit(oda ? 'edit_room' : 'create_room', oda ? oda.id : kayit.slug, kayit);
        kapat(); go('chat');
      } catch (e) { fail(e, 'Oda'); }
    } }, 'Kaydet')]);
}

// ── HATİM GRUPLARI ────────────────────────────────────────────────────────
async function viewKhatm(main) {
  main.appendChild(header('Hatim grupları', 'Grupları düzenle, cüz dağılımını yönet'));
  const gruplar = await must(sb.from('khatm_circles').select('*').order('created_at', { ascending: false }).limit(500), 'Hatim');
  if (!gruplar.length) { main.appendChild(h('div', { class: 'card empty' }, 'Henüz hatim grubu yok.')); return; }
  const ids = gruplar.map((g) => g.id);
  const cuzler = await must(sb.from('khatm_juz_claims').select('circle_id,claimed_by,completed').in('circle_id', ids), 'Cüz');
  const ozet = new Map();
  for (const c of cuzler) { const o = ozet.get(c.circle_id) || { alinan: 0, biten: 0 }; if (c.claimed_by) o.alinan += 1; if (c.completed) o.biten += 1; ozet.set(c.circle_id, o); }
  main.appendChild(h('div', { class: 'tablewrap' }, h('table', null,
    h('thead', null, h('tr', null, ['Başlık', 'Kuran', 'Görünürlük', 'Alınan / biten', 'Durum', 'Açılış', ''].map((x) => h('th', null, x)))),
    h('tbody', null, gruplar.map((g) => { const o = ozet.get(g.id) || { alinan: 0, biten: 0 }; return h('tr', { class: 'click', onclick: () => khatmDetail(g) },
      h('td', null, h('b', null, g.title), g.purpose ? h('div', { class: 'subtle' }, short(g.purpose, 80)) : null), h('td', null, who(g.created_by)),
      h('td', null, h('span', { class: 'badge' }, g.is_public ? 'herkese açık' : 'davetle')), h('td', null, `${o.alinan}/30 · ${o.biten}/30`),
      h('td', null, g.completed_at ? h('span', { class: 'badge ok' }, 'tamamlandı') : h('span', { class: 'badge info' }, 'sürüyor')),
      h('td', { class: 'subtle' }, fmtDate(g.created_at)), h('td', null, h('span', { class: 'subtle mono' }, g.invite_code))); })))));
}
async function khatmDetail(g) {
  const cuzler = await must(sb.from('khatm_juz_claims').select('*').eq('circle_id', g.id).order('juz_no'), 'Cüz');
  const baslik = h('input', { value: g.title, maxlength: 60 });
  const amac = h('textarea', { value: g.purpose || '', maxlength: 200 });
  const acik = h('input', { type: 'checkbox', checked: g.is_public, class: 'inline' });
  const izgara = h('div', { class: 'juz' }, cuzler.map((c) => h('button', { class: c.completed ? 'c' : c.claimed_by ? 't' : '', title: c.claimed_nickname ? `${c.claimed_nickname}${c.completed ? ' — okundu' : ' — okuyor'}` : 'boş', onclick: () => juzAction(g, c) }, String(c.juz_no))));
  modal(`Hatim grubu: ${g.title}`, h('div', { class: 'col' },
    h('label', { class: 'f' }, 'Başlık', baslik), h('label', { class: 'f' }, 'Amaç', amac),
    h('label', { class: 'row', style: { gap: '8px' } }, acik, 'Herkese açık listede görünsün'),
    h('div', { class: 'subtle' }, `Davet kodu: ${g.invite_code} · Açan: `, who(g.created_by)),
    h('h3', null, 'Cüzler (dokun: boşalt / okundu işaretle)'), izgara,
    h('div', { class: 'subtle' }, 'Yeşil: okundu · Kahverengi: alınmış, okunuyor · Koyu: boş')), (kapat) => [
    h('button', { class: 'btn bad', onclick: () => confirmBox('Grubu sil', `"${g.title}" ve bütün cüz kayıtları silinir.`, 'Sil', async () => {
      await must(sb.from('khatm_circles').delete().eq('id', g.id), 'Hatim'); await audit('delete_khatm', g.id, { title: g.title }); kapat(); go('khatm');
    }) }, 'Grubu sil'),
    h('span', { class: 'grow' }),
    h('button', { class: 'btn', onclick: kapat }, 'Kapat'),
    h('button', { class: 'btn pri', onclick: async () => {
      try {
        await must(sb.from('khatm_circles').update({ title: baslik.value.trim(), purpose: amac.value.trim(), is_public: acik.checked }).eq('id', g.id), 'Hatim');
        await audit('edit_khatm', g.id, { title: baslik.value.trim() }); kapat(); toast('Kaydedildi.', 'ok'); go('khatm');
      } catch (e) { fail(e, 'Hatim'); }
    } }, 'Kaydet')]);
}
function juzAction(g, c) {
  modal(`${c.juz_no}. cüz`, h('div', { class: 'col' }, h('div', null, c.claimed_nickname ? `Alan: ${c.claimed_nickname}${c.completed ? ` — okundu (${fmtDate(c.completed_at)})` : ' — okuyor'}` : 'Boş')), (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    c.claimed_by ? h('button', { class: 'btn bad', onclick: async () => {
      try { await must(sb.from('khatm_juz_claims').update({ claimed_by: null, claimed_nickname: null, completed: false, completed_at: null }).eq('circle_id', g.id).eq('juz_no', c.juz_no), 'Cüz'); await audit('release_juz', g.id, { juz: c.juz_no }); kapat(); khatmDetail(g); } catch (e) { fail(e, 'Cüz'); }
    } }, 'Cüzü boşalt') : null,
    c.claimed_by && !c.completed ? h('button', { class: 'btn pri', onclick: async () => {
      try { await must(sb.from('khatm_juz_claims').update({ completed: true, completed_at: new Date().toISOString() }).eq('circle_id', g.id).eq('juz_no', c.juz_no), 'Cüz'); await audit('complete_juz', g.id, { juz: c.juz_no }); kapat(); khatmDetail(g); } catch (e) { fail(e, 'Cüz'); }
    } }, 'Okundu işaretle') : null]);
}

// ── İÇERİK ────────────────────────────────────────────────────────────────
const TURLER = [
  ['announcement', 'Duyurular', 'Uygulamada Topluluk → Duyurular ekranında, herkese.'],
  ['dua', 'Dualar', 'Dualar listesine ve "Günün Duası" sırasına katılır. Âyet seçersen metin ve meal uygulamadaki Kur\'an\'dan okunur.'],
  ['verse', 'Günün âyeti havuzu', 'Havuz boşsa günün âyeti bütün Kur\'an\'dan seçilir; en az bir âyet eklersen yalnız havuzdan seçilir.'],
  ['knowledge', 'Günün bilgisi', 'Ana sayfadaki "Günün Bilgisi" ve Bilgiler ekranına katılır.'],
  ['info_article', 'Bilgi yazıları', 'Topluluk → Bilgi yazıları ekranında listelenir.'],
  ['share_card', 'Hazır kartlar', 'Paylaşım kartı ekranında "Topluluk" sekmesinde görünür.'],
  ['builtin', 'Yerleşik içerik', 'Uygulamaya gömülü dua, bilgi ve kartlar: gizle ya da düzenleyerek değiştir.'],
];
let katalog = null;
async function getCatalog() {
  if (!katalog) { const r = await fetch('catalog.json', { cache: 'no-cache' }); katalog = await r.json(); }
  return katalog;
}
async function viewContent(main) {
  const tur = sessionStorage.getItem('content.type') || 'announcement';
  const dil = sessionStorage.getItem('content.locale') || 'tr';
  const dilSec = h('select', { class: 'inline', onchange: (e) => { sessionStorage.setItem('content.locale', e.target.value); go('content'); } }, LOCALES.map(([v, l]) => h('option', { value: v, selected: v === dil ? true : null }, l)));
  main.appendChild(header('İçerik', 'Yeni derleme gerekmez: kaydettiğin içerik uygulamaya birkaç saat içinde (ya da uygulama yeniden açılınca) gelir.', tur === 'builtin' ? null : h('div', { class: 'row' }, dilSec, h('button', { class: 'btn pri', onclick: () => editContent({ type: tur, locale: dil }) }, 'Yeni ekle'))));
  main.appendChild(h('div', { class: 'tabs' }, TURLER.map(([id, ad]) => h('button', { class: `tab ${tur === id ? 'on' : ''}`, onclick: () => { sessionStorage.setItem('content.type', id); go('content'); } }, ad))));
  main.appendChild(h('p', { class: 'subtle' }, (TURLER.find((x) => x[0] === tur) || [])[2] || ''));
  if (tur === 'builtin') { await viewBuiltin(main); return; }
  const rows = await must(sb.from('content_items').select('*').eq('type', tur).eq('locale', dil).order('sort_order').order('created_at', { ascending: false }), 'İçerik');
  if (!rows.length) { main.appendChild(h('div', { class: 'card empty' }, 'Bu dilde içerik yok. "Yeni ekle" ile başla.')); return; }
  main.appendChild(h('div', { class: 'col' }, rows.map((c) => h('div', { class: 'card col' },
    h('div', { class: 'row' }, h('b', { class: 'grow' }, c.title || '(başlıksız)'), c.is_published ? h('span', { class: 'badge ok' }, 'yayında') : h('span', { class: 'badge' }, 'taslak'), h('span', { class: 'subtle' }, `sıra ${c.sort_order} · ${fmtDate(c.updated_at)}`)),
    tur === 'verse' ? h('div', null, `Sure ${c.extra.surah}, âyet ${c.extra.ayah}`) : h('div', { class: 'body' }, short(c.body, 400)),
    Object.keys(c.extra || {}).length && tur !== 'verse' ? h('div', { class: 'subtle mono' }, JSON.stringify(c.extra)) : null,
    h('div', { class: 'row' },
      h('button', { class: 'btn sm', onclick: () => editContent(c) }, 'Düzenle'),
      h('button', { class: 'btn sm', onclick: () => act(async () => { await must(sb.from('content_items').update({ is_published: !c.is_published }).eq('id', c.id), 'Yayın'); await audit(c.is_published ? 'unpublish' : 'publish', c.id); go('content'); }) }, c.is_published ? 'Yayından kaldır' : 'Yayınla'),
      h('button', { class: 'btn sm bad', onclick: () => confirmBox('İçeriği sil', 'Kalıcı olarak silinir; uygulamadan da kalkar.', 'Sil', async () => { await must(sb.from('content_items').delete().eq('id', c.id), 'İçerik'); await audit('delete_content', c.id, { type: c.type, title: c.title }); go('content'); }) }, 'Sil'))))));
}

async function editContent(c, { hideTarget = null } = {}) {
  const cat = await getCatalog();
  const tur = c.type; const ex = c.extra || {};
  const f = {
    locale: h('select', null, LOCALES.map(([v, l]) => h('option', { value: v, selected: v === (c.locale || 'tr') ? true : null }, l))),
    title: h('input', { value: c.title || '', maxlength: 120 }),
    body: h('textarea', { value: c.body || '', maxlength: 4000, style: { minHeight: '140px' } }),
    sort: h('input', { type: 'number', value: c.sort_order || 0 }),
    pub: h('input', { type: 'checkbox', checked: c.is_published !== false, class: 'inline' }),
    surah: h('input', { type: 'number', min: 1, max: 114, value: ex.surah || '' }),
    ayah: h('input', { type: 'number', min: 1, value: ex.ayah || '' }),
    to: h('input', { type: 'number', min: 1, value: ex.to || '' }),
    arabic: h('textarea', { value: ex.arabic || '', dir: 'rtl', style: { minHeight: '60px' } }),
    reference: h('input', { value: ex.reference || '' }),
    category: h('select', null, cat.duaCategories.map((k) => h('option', { value: k.id, selected: k.id === ex.category ? true : null }, k.label))),
    topic: h('select', null, cat.knowledgeTopics.map((k) => h('option', { value: k.id, selected: k.id === ex.topic ? true : null }, k.label))),
  };
  const alan = (l, el, ipucu) => h('label', { class: 'f' }, l, el, ipucu ? h('span', { class: 'subtle' }, ipucu) : null);
  const govde = h('div', { class: 'col' }, h('div', { class: 'grid g2' }, alan('Dil', f.locale), alan('Sıra (küçük önce)', f.sort)));
  if (tur === 'verse') {
    govde.appendChild(h('div', { class: 'grid g2' }, alan('Sure (1-114)', f.surah), alan('Âyet', f.ayah)));
    govde.appendChild(alan('Not (uygulamada görünmez)', f.title));
  } else {
    govde.appendChild(alan(tur === 'share_card' ? 'Başlık (kart üst yazısı)' : 'Başlık', f.title));
    if (tur === 'dua') {
      govde.appendChild(alan('Kategori', f.category));
      govde.appendChild(h('div', { class: 'grid g2' }, alan('Sure (isteğe bağlı)', f.surah, 'Kur\'an duası ise: metin ve meal otomatik'), alan('Âyet', f.ayah)));
      govde.appendChild(alan('Bitiş âyeti (isteğe bağlı)', f.to));
    }
    if (tur === 'knowledge') govde.appendChild(alan('Konu', f.topic));
    govde.appendChild(alan(tur === 'dua' ? 'Türkçe metin (âyet seçtiysen boş bırakılabilir)' : 'Metin', f.body));
    if (tur === 'dua' || tur === 'share_card') { govde.appendChild(alan('Arapça (isteğe bağlı)', f.arabic)); govde.appendChild(alan('Kaynak / künye (ör. Bakara 201)', f.reference)); }
  }
  govde.appendChild(h('label', { class: 'row', style: { gap: '8px' } }, f.pub, 'Yayında'));
  if (hideTarget) govde.appendChild(h('div', { class: 'badge warn', style: { whiteSpace: 'normal' } }, `Kaydedince yerleşik "${hideTarget}" gizlenecek ve yerine bu gelecek (bütün dillerde).`));

  modal(c.id ? 'İçeriği düzenle' : 'Yeni içerik', govde, (kapat) => [
    h('button', { class: 'btn', onclick: kapat }, 'Vazgeç'),
    h('button', { class: 'btn pri', onclick: async (e) => {
      try {
        const extra = {};
        const n = (el) => (el.value.trim() ? Number(el.value) : null);
        if (tur === 'verse') {
          const s = n(f.surah); const a = n(f.ayah);
          if (!s || s < 1 || s > 114 || !a || a < 1) throw new Error('Geçerli sure (1-114) ve âyet girin.');
          Object.assign(extra, { surah: s, ayah: a });
        }
        if (tur === 'dua') {
          extra.category = f.category.value;
          const s = n(f.surah); const a = n(f.ayah); const to = n(f.to);
          if (s || a) { if (!s || !a) throw new Error('Sure ve âyeti birlikte girin.'); Object.assign(extra, { surah: s, ayah: a }); if (to && to > a) extra.to = to; } else if (!f.body.value.trim()) throw new Error('Metin ya da âyet gerekli.');
        }
        if (tur === 'knowledge') extra.topic = f.topic.value;
        if (tur === 'dua' || tur === 'share_card') { if (f.arabic.value.trim()) extra.arabic = f.arabic.value.trim(); if (f.reference.value.trim()) extra.reference = f.reference.value.trim(); }
        const title = f.title.value.trim() || (tur === 'verse' ? `Sure ${extra.surah}:${extra.ayah}` : '');
        if (!title) throw new Error('Başlık gerekli.');
        if (['announcement', 'info_article', 'knowledge', 'share_card'].includes(tur) && !f.body.value.trim()) throw new Error('Metin gerekli.');
        const kayit = { type: tur, locale: f.locale.value, title, body: f.body.value.trim(), extra, sort_order: Number(f.sort.value) || 0, is_published: f.pub.checked };
        e.target.disabled = true;
        if (c.id) await must(sb.from('content_items').update(kayit).eq('id', c.id), 'İçerik');
        else await must(sb.from('content_items').insert({ ...kayit, created_by: state.user.id }), 'İçerik');
        if (hideTarget) await setHidden(hideTarget, true);
        await audit(c.id ? 'edit_content' : 'create_content', c.id || title, { type: tur, locale: kayit.locale });
        kapat(); toast('Kaydedildi. Uygulamaya birkaç saat içinde gelir.', 'ok'); go('content');
      } catch (err) { e.target.disabled = false; fail(err, 'İçerik'); }
    } }, 'Kaydet')]);
}

async function setHidden(target, hide) {
  if (hide) {
    await must(sb.from('content_items').insert(LOCALES.map(([loc]) => ({ type: 'hide', locale: loc, title: target, body: '', extra: { target }, created_by: state.user.id }))), 'Gizleme');
  } else {
    await must(sb.from('content_items').delete().eq('type', 'hide').eq('title', target), 'Gösterme');
  }
  await audit(hide ? 'hide_builtin' : 'show_builtin', target);
}
async function viewBuiltin(main) {
  const cat = await getCatalog();
  const gizli = new Set((await must(sb.from('content_items').select('title').eq('type', 'hide').eq('locale', 'tr'), 'Gizli')).map((r) => r.title));
  const tur = sessionStorage.getItem('builtin.kind') || 'dua';
  const ara = h('input', { placeholder: 'Ara…', class: 'inline', style: { width: '260px' } });
  main.appendChild(h('div', { class: 'row', style: { marginBottom: '12px' } },
    h('div', { class: 'tabs', style: { margin: 0 } }, [['dua', `Dualar (${cat.duas.length})`], ['knowledge', `Bilgiler (${cat.knowledge.length})`], ['card', `Kartlar (${cat.cards.length})`]].map(([id, ad]) => h('button', { class: `tab ${tur === id ? 'on' : ''}`, onclick: () => { sessionStorage.setItem('builtin.kind', id); go('content'); } }, ad))),
    h('span', { class: 'grow' }), ara, h('span', { class: 'subtle' }, `${gizli.size} gizli`)));
  const wrap = h('div', { class: 'tablewrap' }); main.appendChild(wrap);
  const kaynak = tur === 'dua' ? cat.duas : tur === 'knowledge' ? cat.knowledge : cat.cards;
  const ciz = () => {
    const s = ara.value.trim().toLocaleLowerCase('tr');
    const rows = kaynak.filter((x) => !s || [x.title, x.body, x.eyebrow, x.id].some((v) => v && v.toLocaleLowerCase('tr').includes(s)));
    clear(wrap).appendChild(h('table', null, h('thead', null, h('tr', null, ['Kimlik', 'Başlık', 'İçerik', 'Durum', ''].map((x) => h('th', null, x)))),
      h('tbody', null, rows.map((x) => {
        const hedef = `${tur}:${x.id}`; const g = gizli.has(hedef);
        const metin = x.kind === 'quran' || x.kind === 'verse' ? `Kur'an: sure ${x.surah}, âyet ${x.ayah}${x.to ? `-${x.to}` : ''}` : x.body;
        return h('tr', null, h('td', { class: 'mono subtle' }, x.id), h('td', null, h('b', null, x.title || x.eyebrow || '')),
          h('td', { class: 'body', style: { maxWidth: '460px' } }, short(metin, 220)),
          h('td', null, g ? h('span', { class: 'badge warn' }, 'gizli') : h('span', { class: 'badge ok' }, 'görünür')),
          h('td', null, h('div', { class: 'row' },
            h('button', { class: 'btn sm', onclick: () => act(async () => { await setHidden(hedef, !g); go('content'); }) }, g ? 'Göster' : 'Gizle'),
            !g ? h('button', { class: 'btn sm', onclick: () => editContent(tur === 'dua'
              ? { type: 'dua', locale: 'tr', title: x.title, body: x.body, extra: { category: x.category, ...(x.surah ? { surah: x.surah, ayah: x.ayah, ...(x.to ? { to: x.to } : {}) } : {}) } }
              : tur === 'knowledge' ? { type: 'knowledge', locale: 'tr', title: x.title, body: x.body, extra: { topic: x.topic } }
                : { type: 'share_card', locale: 'tr', title: x.eyebrow, body: x.body || '', extra: { ...(x.arabic ? { arabic: x.arabic } : {}), ...(x.surah ? { reference: `${x.surah}:${x.ayah}` } : {}) } }, { hideTarget: hedef }) }, 'Düzenle') : null)));
      }))));
  };
  ara.addEventListener('input', ciz); ciz();
}

// ── YASAKLI KELİMELER ─────────────────────────────────────────────────────
async function viewWords(main) {
  main.appendChild(header('Yasaklı kelimeler', 'Bu kelimeleri içeren dua isteği, mesaj ve takma ad sunucuda reddedilir.'));
  const yeni = h('input', { placeholder: 'Kelime ekle…', class: 'inline', style: { width: '260px' } });
  const ekle = async () => {
    const w = yeni.value.trim().toLocaleLowerCase('tr'); if (!w) return;
    try { await must(sb.from('banned_words').insert({ word: w, added_by: state.user.id }), 'Kelime'); await audit('add_word', w); go('words'); } catch (e) { fail(e, 'Kelime'); }
  };
  yeni.addEventListener('keydown', (e) => { if (e.key === 'Enter') ekle(); });
  main.appendChild(h('div', { class: 'row', style: { marginBottom: '14px' } }, yeni, h('button', { class: 'btn pri', onclick: ekle }, 'Ekle')));
  const rows = await must(sb.from('banned_words').select('*').order('word'), 'Kelimeler');
  main.appendChild(rows.length ? h('div', { class: 'card row' }, rows.map((r) => h('span', { class: 'badge', style: { display: 'inline-flex', gap: '6px', alignItems: 'center', fontSize: '14px' } }, r.word,
    h('button', { class: 'btn sm', 'aria-label': `${r.word} kaldır`, onclick: () => act(async () => { await must(sb.from('banned_words').delete().eq('word', r.word), 'Kelime'); await audit('remove_word', r.word); go('words'); }) }, '×')))) : h('div', { class: 'card empty' }, 'Liste boş.'));
}

// ── AYARLAR VE GÜNLÜK ─────────────────────────────────────────────────────
async function viewSettings(main) {
  main.appendChild(header('Ayarlar ve işlem günlüğü'));
  const ayarlar = await must(sb.from('admin_settings').select('*'), 'Ayarlar');
  const vendor = h('input', { value: (ayarlar.find((a) => a.key === 'asc_vendor_number') || {}).value || '', placeholder: 'ör. 89123456', class: 'inline', style: { width: '200px' } });
  main.appendChild(h('div', { class: 'card col', style: { marginBottom: '18px' } },
    h('h2', null, 'App Store satıcı numarası'),
    h('p', { class: 'subtle', style: { margin: 0 } }, 'App Store Connect → Payments and Financial Reports sayfasının sol üst köşesinde yazan numara. Girince Pano\'daki App Store indirme ve satış grafikleri dolmaya başlar.'),
    h('div', { class: 'row' }, vendor, h('button', { class: 'btn pri', onclick: () => act(async () => {
      await must(sb.from('admin_settings').upsert({ key: 'asc_vendor_number', value: vendor.value.trim(), updated_at: new Date().toISOString() }), 'Ayar');
      await audit('set_vendor', null);
    }) }, 'Kaydet'))));
  const gunluk = await must(sb.from('admin_audit').select('*').order('created_at', { ascending: false }).limit(200), 'Günlük');
  main.appendChild(h('h2', null, 'İşlem günlüğü (son 200)'));
  main.appendChild(gunluk.length ? h('div', { class: 'tablewrap' }, h('table', null, h('thead', null, h('tr', null, ['Zaman', 'Yönetici', 'İşlem', 'Hedef', 'Ayrıntı'].map((x) => h('th', null, x)))),
    h('tbody', null, gunluk.map((g) => h('tr', null, h('td', { class: 'subtle' }, fmtDate(g.created_at)), h('td', null, who(g.admin_id)), h('td', null, h('span', { class: 'badge' }, g.action)),
      h('td', { class: 'mono' }, short(g.target || '', 40)), h('td', { class: 'subtle body', style: { maxWidth: '380px' } }, short(JSON.stringify(g.detail), 200))))))) : h('div', { class: 'card empty' }, 'Henüz işlem yok.'));
}

boot().catch((e) => { console.error(e); loginScreen('Panel açılamadı: bağlantıyı kontrol edip sayfayı yenileyin.'); });
})();
