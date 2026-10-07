/**
 * BEŞ yönetici paneli — kullanıcıya ücretsiz Pro ver / geri al (D38).
 *
 * RevenueCat "promosyon hakkı" (grant_entitlement) kullanılır: verilen Pro,
 * satın alınmış Pro gibi çalışır (reklamsız + bütün Pro özellikleri), aynı
 * hesapla giriş yapılan her telefonda geçerlidir, süresi gelince kendiliğinden
 * biter. RevenueCat müşteri kimliği = Supabase kullanıcı kimliği (uygulama
 * girişte `Purchases.logIn(uid)` yapar).
 *
 * Gövde: { action: 'status' | 'grant' | 'revoke', uid, duration?: 'week'|'month'|'year'|'lifetime' }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const IZINLI = ['https://kusgrupgames.github.io'];
const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && IZINLI.includes(origin) ? origin : IZINLI[0],
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const KEY = Deno.env.get('REVENUECAT_SECRET_KEY') ?? '';
const PROJ = Deno.env.get('REVENUECAT_PROJECT_ID') ?? '';
const RC = `https://api.revenuecat.com/v2/projects/${PROJ}`;
const SURE: Record<string, number> = { week: 7, month: 30, year: 365, lifetime: 365 * 75 };

async function rc(method: string, path: string, body?: unknown) {
  const r = await fetch(`${RC}${path}`, {
    method, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let data: unknown = null; try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}
let entitlementId: string | null = null;
async function proEntitlement(): Promise<string> {
  if (entitlementId) return entitlementId;
  const r = await rc('GET', '/entitlements');
  const e = (r.data as { items?: { id: string; lookup_key: string }[] }).items?.find((x) => x.lookup_key === 'pro');
  if (!e) throw new Error('RevenueCat\'te "pro" hakkı bulunamadı');
  entitlementId = e.id;
  return e.id;
}
async function status(uid: string) {
  const r = await rc('GET', `/customers/${encodeURIComponent(uid)}/active_entitlements`);
  if (r.status === 404) return { active: false, expiresAt: null, linked: false };
  if (!r.ok) throw new Error(`RevenueCat ${r.status}`);
  const ent = await proEntitlement();
  const item = (r.data as { items?: { entitlement_id: string; expires_at: number | null }[] }).items?.find((i) => i.entitlement_id === ent);
  return { active: Boolean(item), expiresAt: item?.expires_at ?? null, linked: true };
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: { user } } = await sb.auth.getUser(jwt);
  if (!user) return json({ error: 'oturum yok' }, 401);
  const { data: p } = await sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!p?.is_admin) return json({ error: 'yönetici yetkisi gerekli' }, 403);
  if (!KEY || !PROJ) return json({ error: 'RevenueCat anahtarı tanımlı değil' }, 500);

  const { action, uid, duration } = await req.json().catch(() => ({})) as { action?: string; uid?: string; duration?: string };
  if (!uid || !/^[0-9a-f-]{36}$/i.test(uid)) return json({ error: 'geçersiz kullanıcı' }, 400);
  const { data: hedef } = await sb.auth.admin.getUserById(uid);
  if (!hedef?.user) return json({ error: 'kullanıcı bulunamadı' }, 404);

  try {
    if (action === 'status') return json(await status(uid));
    const ent = await proEntitlement();
    if (action === 'grant') {
      const gun = SURE[duration ?? ''];
      if (!gun) return json({ error: 'geçersiz süre' }, 400);
      const c = await rc('POST', '/customers', { id: uid });
      if (!c.ok && c.status !== 409) throw new Error(`müşteri oluşturulamadı (${c.status})`);
      const g = await rc('POST', `/customers/${encodeURIComponent(uid)}/actions/grant_entitlement`, { entitlement_id: ent, expires_at: Date.now() + gun * 86400000 });
      if (!g.ok) throw new Error(`Pro verilemedi (${g.status}): ${JSON.stringify(g.data).slice(0, 200)}`);
      await sb.from('admin_audit').insert({ admin_id: user.id, action: 'grant_pro', target: uid, detail: { duration } });
      return json(await status(uid));
    }
    if (action === 'revoke') {
      const r = await rc('POST', `/customers/${encodeURIComponent(uid)}/actions/revoke_granted_entitlement`, { entitlement_id: ent });
      if (!r.ok && r.status !== 404) throw new Error(`geri alınamadı (${r.status})`);
      await sb.from('admin_audit').insert({ admin_id: user.id, action: 'revoke_pro', target: uid, detail: {} });
      return json(await status(uid));
    }
    return json({ error: 'geçersiz işlem' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 502);
  }
});
