/**
 * BEŞ yönetici paneli — dış metrikler (D36).
 *
 * Tarayıcı gizli anahtar görmez: panel bu işlevi yöneticinin oturumuyla çağırır,
 * işlev yöneticiyi doğrular, RevenueCat ve App Store Connect'ten okur, günlük
 * kesiti `metrics_daily` tablosuna yazar (geçmiş böyle birikir) ve döner.
 *
 * Gizli değişkenler (Supabase → Edge Functions → Secrets):
 *   REVENUECAT_SECRET_KEY, REVENUECAT_PROJECT_ID,
 *   ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY (.p8 içeriği)
 * App Store satıcı numarası gizli değildir: panelden `admin_settings`e yazılır.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const IZINLI = ['https://kusgrupgames.github.io'];
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && IZINLI.includes(origin) ? origin : IZINLI[0],
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const gun = (d: Date) => d.toISOString().slice(0, 10);

async function revenueCat() {
  const key = Deno.env.get('REVENUECAT_SECRET_KEY');
  const proj = Deno.env.get('REVENUECAT_PROJECT_ID');
  if (!key || !proj) return { configured: false };
  const r = await fetch(`https://api.revenuecat.com/v2/projects/${proj}/metrics/overview`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`RevenueCat ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json() as { currency: string; metrics: { id: string; name: string; value: number; unit: string; period: string; description: string }[] };
  const bugun = gun(new Date());
  const satirlar = d.metrics.map((m) => ({ day: bugun, source: 'revenuecat', metric: m.id, value: m.value, updated_at: new Date().toISOString() }));
  await sb.from('metrics_daily').upsert(satirlar);
  return { configured: true, currency: d.currency, metrics: d.metrics };
}

// ── App Store Connect: ES256 JWT ──────────────────────────────────────────
const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = ''; for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
async function ascToken(): Promise<string | null> {
  const kid = Deno.env.get('ASC_KEY_ID'); const iss = Deno.env.get('ASC_ISSUER_ID'); const pem = Deno.env.get('ASC_PRIVATE_KEY');
  if (!kid || !iss || !pem) return null;
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const govde = `${b64url(JSON.stringify({ alg: 'ES256', kid, typ: 'JWT' }))}.${b64url(JSON.stringify({ iss, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' }))}`;
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(govde));
  return `${govde}.${b64url(imza)}`;
}

const INDIRME = new Set(['1', '1F', '1T', 'F1']);
const YENIDEN = new Set(['3', '3F', '3T', 'F3']);
const GUNCELLEME = new Set(['7', '7F', '7T', 'F7']);
const UYGULAMA_ICI = new Set(['IA1', 'IA9', 'IAY', 'IAC', 'FI1', 'IA1-M', 'IAY-M']);

async function appStore(gunSayisi: number) {
  const token = await ascToken();
  const { data: ayar } = await sb.from('admin_settings').select('value').eq('key', 'asc_vendor_number').maybeSingle();
  const vendor = ayar?.value?.trim();
  if (!token || !vendor) return { configured: false, missing: !token ? 'key' : 'vendor' };

  const { data: mevcut } = await sb.from('metrics_daily').select('day').eq('source', 'appstore').eq('metric', 'downloads');
  const var_ = new Set((mevcut ?? []).map((r: { day: string }) => r.day));
  const istenen: string[] = [];
  for (let i = 2; i < gunSayisi + 2; i++) {
    const g = gun(new Date(Date.now() - i * 86400000));
    if (!var_.has(g)) istenen.push(g);
  }
  let cekilen = 0; const hatalar: string[] = [];
  for (const g of istenen.slice(0, 12)) {
    const u = `https://api.appstoreconnect.apple.com/v1/salesReports?filter[frequency]=DAILY&filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[version]=1_1&filter[vendorNumber]=${encodeURIComponent(vendor)}&filter[reportDate]=${g}`;
    const r = await fetch(u, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/a-gzip' } });
    const toplam = { downloads: 0, redownloads: 0, updates: 0, iap_units: 0 } as Record<string, number>;
    if (r.status === 404) { /* o gün satış/indirme yok */ } else if (!r.ok) {
      hatalar.push(`${g}: ${r.status} ${(await r.text()).slice(0, 160)}`); continue;
    } else {
      const metin = await new Response(r.body!.pipeThrough(new DecompressionStream('gzip'))).text();
      const [baslik, ...satirlar] = metin.trim().split('\n');
      const s = baslik.split('\t');
      const iTur = s.indexOf('Product Type Identifier'); const iAdet = s.indexOf('Units');
      const iGelir = s.indexOf('Developer Proceeds'); const iPara = s.indexOf('Currency of Proceeds');
      for (const satir of satirlar) {
        const c = satir.split('\t'); const tur = c[iTur]; const adet = Number(c[iAdet]) || 0;
        if (INDIRME.has(tur)) toplam.downloads += adet;
        else if (YENIDEN.has(tur)) toplam.redownloads += adet;
        else if (GUNCELLEME.has(tur)) toplam.updates += adet;
        else if (UYGULAMA_ICI.has(tur)) toplam.iap_units += adet;
        const gelir = (Number(c[iGelir]) || 0) * adet;
        if (gelir) toplam[`proceeds_${c[iPara]}`] = (toplam[`proceeds_${c[iPara]}`] ?? 0) + gelir;
      }
    }
    await sb.from('metrics_daily').upsert(Object.entries(toplam).map(([metric, value]) => ({
      day: g, source: 'appstore', metric, value, updated_at: new Date().toISOString(),
    })));
    cekilen += 1;
  }
  return { configured: true, fetchedDays: cekilen, pendingDays: Math.max(0, istenen.length - cekilen), errors: hatalar };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...h, 'Content-Type': 'application/json' } });

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await sb.auth.getUser(jwt);
  if (!user) return json({ error: 'oturum yok' }, 401);
  const { data: p } = await sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!p?.is_admin) return json({ error: 'yönetici yetkisi gerekli' }, 403);

  const sonuc: Record<string, unknown> = {}; const hatalar: string[] = [];
  try { sonuc.revenuecat = await revenueCat(); } catch (e) { hatalar.push(String(e)); }
  try { sonuc.appstore = await appStore(30); } catch (e) { hatalar.push(String(e)); }
  sonuc.googleplay = { configured: false };
  sonuc.admob = { configured: false };
  return json({ ...sonuc, errors: hatalar, at: new Date().toISOString() });
});
