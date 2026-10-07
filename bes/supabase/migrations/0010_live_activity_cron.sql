-- BEŞ — canlı etkinlik push görevini 30 sn'de bir çalıştırır (0009'dan sonra).
-- Gizli anahtar bu dosyada YOK: kurulumda 'CRON_SECRET_BURAYA' yerine Edge
-- Function gizli değişkeni CRON_SECRET'in değeri yazılır (vault'ta saklanır).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('CRON_SECRET_BURAYA', 'live_activity_cron_secret')
  where not exists (select 1 from vault.secrets where name = 'live_activity_cron_secret');

select cron.unschedule('live-activity-push') where exists (select 1 from cron.job where jobname = 'live-activity-push');
select cron.schedule('live-activity-push', '30 seconds', $$
  select net.http_post(
    url := 'https://gqvoaryuwhtxwbkjudhk.supabase.co/functions/v1/live-activity-push',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'live_activity_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
$$);

-- Kullanılmayan kayıtları her gece temizle (gizlilik sayfası: "birkaç gün içinde").
select cron.unschedule('live-activity-prune') where exists (select 1 from cron.job where jobname = 'live-activity-prune');
select cron.schedule('live-activity-prune', '17 3 * * *', $$
  delete from public.live_activity_push
   where updated_at < now() - interval '3 days' and (next_at is null or next_at < now() - interval '1 day')
$$);
