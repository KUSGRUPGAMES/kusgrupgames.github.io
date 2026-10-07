/**
 * BEŞ — Diyanet ilçe vakitleri (5 Ekim).
 *
 * GET ?id=<Diyanet ilçe kimliği> → { id, days: { "YYYY-MM-DD": [imsak, güneş, öğle, ikindi, akşam, yatsı] } }
 *
 * Kaynak: Diyanet İşleri Başkanlığı'nın yayımladığı aylık vakitler
 * (ezanvakti.emushaf.net aynası). Sonuç diyanet_times'ta önbelleklenir;
 * önümüzdeki 20 gün önbellekteyse kaynağa hiç gidilmez. Kaynağa
 * ulaşılamazsa elde ne varsa döner; uygulama yoksa kendi hesabına düşer.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
});

function bugunTR(): string {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
}

async function oku(id: string) {
  const { data } = await sb.from('diyanet_times').select('day, times, fetched_at').eq('ilce_id', id).gte('day', bugunTR()).order('day').limit(40);
  return (data ?? []) as { day: string; times: string[]; fetched_at: string }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[0-9]{3,6}$/.test(id)) return json({ error: 'geçersiz ilçe' }, 400);

  let satirlar = await oku(id);
  // Ay sonunda kaynak az gün verir: aynı ilçe için en çok 6 saatte bir sorulur.
  const sonCekim = Math.max(0, ...satirlar.map((x) => Date.parse(x.fetched_at)));
  if (satirlar.length < 20 && Date.now() - sonCekim > 6 * 3600_000) {
    try {
      const r = await fetch(`https://ezanvakti.emushaf.net/vakitler/${id}`, { headers: { 'User-Agent': 'BES-namaz-vakitleri/1.0 (kusgrupgames@gmail.com)' } });
      const metin = await r.text();
      if (r.ok && metin.startsWith('[')) {
        const liste = JSON.parse(metin) as Record<string, string>[];
        const yeni = liste.map((g) => {
          const [d, m, y] = g.MiladiTarihKisa.split('.');
          return { ilce_id: id, day: `${y}-${m}-${d}`, times: [g.Imsak, g.Gunes, g.Ogle, g.Ikindi, g.Aksam, g.Yatsi], fetched_at: new Date().toISOString() };
        }).filter((x) => x.times.every((t) => /^\d{2}:\d{2}$/.test(t)));
        if (yeni.length) await sb.from('diyanet_times').upsert(yeni);
        satirlar = await oku(id);
      }
    } catch { /* kaynağa ulaşılamadı: önbellekteki döner */ }
  }
  return json({ id, source: 'diyanet', days: Object.fromEntries(satirlar.map((s) => [s.day, s.times])) });
});
