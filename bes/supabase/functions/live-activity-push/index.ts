/**
 * BEŞ — canlı etkinliği (Dinamik Ada / kilit ekranı) vakit girince ilerletir.
 *
 * pg_cron her 30 sn çağırır (0010). Vakti gelmiş her cihaz için:
 *  - listede sıradaki vakit yoksa: etkinliği bitirir, kaydı siler;
 *  - etkinlik 6 saatten eskiyse ve "push ile başlat" jetonu varsa (iOS 17.2+):
 *    eskisini bitirir, sıradaki vakitle yenisini başlatır (iOS 8 saat sınırı);
 *  - değilse: etkinliği sıradaki vakte günceller.
 * İçerik biçimi VakitAktivitesi.swift'teki ContentState ile birebir: tarihler
 * Unix saniyesi (ContentState özel Codable ile böyle okur).
 *
 * Gizli değişkenler: APNS_KEY_ID, APNS_KEY (.p8 içeriği), APPLE_TEAM_ID, CRON_SECRET.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const KEY_ID = Deno.env.get('APNS_KEY_ID') ?? '';
const TEAM = Deno.env.get('APPLE_TEAM_ID') ?? '';
const PEM = Deno.env.get('APNS_KEY') ?? '';
const CRON = Deno.env.get('CRON_SECRET') ?? '';
const YENILE_SN = 6 * 3600;

type Slot = { n: string; t: number; hm: string };
type Satir = {
  device: string; topic: string; env: string; activity_token: string | null; start_token: string | null;
  city: string | null; title: string | null; slots: Slot[] | null; next_at: string | null; started_at: string | null;
};

const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = ''; for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
let jwt: { t: string; at: number } | null = null;
async function apnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (jwt && now - jwt.at < 40 * 60) return jwt.t;
  const der = Uint8Array.from(atob(PEM.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const govde = `${b64url(JSON.stringify({ alg: 'ES256', kid: KEY_ID }))}.${b64url(JSON.stringify({ iss: TEAM, iat: now }))}`;
  const imza = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(govde));
  jwt = { t: `${govde}.${b64url(imza)}`, at: now };
  return jwt.t;
}

async function apns(env: string, topic: string, token: string, aps: Record<string, unknown>): Promise<number> {
  const host = env === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const r = await fetch(`https://${host}/3/device/${token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${await apnsJwt()}`,
      'apns-topic': `${topic}.push-type.liveactivity`,
      'apns-push-type': 'liveactivity',
      'apns-priority': '10',
    },
    body: JSON.stringify({ aps }),
  });
  // eslint-disable-next-line no-console -- Edge Function günlüğü
  if (!r.ok) console.log('apns', r.status, await r.text());
  return r.status;
}

/** Vakit listesinden "şimdi"den sonraki vakti ve ContentState'i kurar. */
export function icerik(slots: Slot[], simdi: number) {
  const i = slots.findIndex((s) => s.t > simdi + 5);
  if (i < 0) return null;
  const s = slots[i]; const sonra = slots[i + 1];
  return {
    hedef: s.t,
    state: {
      name: s.n, target: s.t, hm: s.hm, following: sonra ? `${sonra.n} ${sonra.hm}` : '',
      upcoming: slots.slice(i).map((x) => ({ n: x.n, t: x.t, hm: x.hm })),
    },
  };
}

Deno.serve(async (req) => {
  if (!CRON || req.headers.get('x-cron-secret') !== CRON) return new Response('yasak', { status: 403 });
  if (!KEY_ID || !TEAM || !PEM) return new Response(JSON.stringify({ atlandi: 'APNs anahtarı yok' }), { status: 200 });

  const { data, error } = await sb.from('live_activity_push').select('*')
    .lte('next_at', new Date().toISOString()).not('next_at', 'is', null).limit(500);
  if (error) return new Response(error.message, { status: 500 });

  const simdi = Date.now() / 1000;
  let guncel = 0, yeni = 0, biten = 0;
  for (const r of (data ?? []) as Satir[]) {
    const ic = icerik(r.slots ?? [], simdi);
    const ts = Math.floor(simdi);
    if (!ic) {
      if (r.activity_token) await apns(r.env, r.topic, r.activity_token, { timestamp: ts, event: 'end', 'dismissal-date': ts });
      await sb.from('live_activity_push').update({ next_at: null, activity_token: null }).eq('device', r.device);
      biten++; continue;
    }
    const yas = r.started_at ? simdi - Date.parse(r.started_at) / 1000 : Infinity;
    if (r.start_token && (yas > YENILE_SN || !r.activity_token)) {
      if (r.activity_token) await apns(r.env, r.topic, r.activity_token, { timestamp: ts, event: 'end', 'dismissal-date': ts });
      const st = await apns(r.env, r.topic, r.start_token, {
        timestamp: ts, event: 'start', 'content-state': ic.state, 'stale-date': ic.hedef,
        'attributes-type': 'BesVakitAttributes', attributes: { city: r.city ?? '', title: r.title ?? '' },
        alert: { title: r.city ?? 'BEŞ', body: `${ic.state.name} · ${ic.state.hm}` },
      });
      if (st === 410 || st === 400) await sb.from('live_activity_push').update({ start_token: null }).eq('device', r.device);
      // Yeni etkinliğin jetonu uygulama arka planda uyanınca kaydedilir.
      await sb.from('live_activity_push').update({ activity_token: null, started_at: new Date().toISOString(), next_at: new Date(ic.hedef * 1000).toISOString() }).eq('device', r.device);
      yeni++; continue;
    }
    if (r.activity_token) {
      const st = await apns(r.env, r.topic, r.activity_token, { timestamp: ts, event: 'update', 'content-state': ic.state, 'stale-date': ic.hedef });
      if (st === 410 || st === 400) {
        await sb.from('live_activity_push').update({ activity_token: null, next_at: r.start_token ? new Date(ic.hedef * 1000).toISOString() : null }).eq('device', r.device);
        continue;
      }
    }
    await sb.from('live_activity_push').update({ next_at: new Date(ic.hedef * 1000).toISOString() }).eq('device', r.device);
    guncel++;
  }
  return new Response(JSON.stringify({ guncel, yeni, biten }), { headers: { 'Content-Type': 'application/json' } });
});
