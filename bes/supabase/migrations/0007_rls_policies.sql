-- Şartname §71 — Row Level Security.
--
-- Kural: **her tabloda RLS açıktır.** Politikası olmayan tablo kimseye
-- görünmez; bu kasıtlıdır (varsayılan reddet). Servis anahtarı RLS'i atlar,
-- bu yüzden servis anahtarı istemciye asla gönderilmez (.env.example).

-- ---------------------------------------------------------------- içerik
-- Yayınlanmış içeriği herkes (anonim dahil) okur; yazma yalnız editör.

alter table public.sources            enable row level security;
alter table public.surahs             enable row level security;
alter table public.ayahs              enable row level security;
alter table public.translations       enable row level security;
alter table public.tafsirs            enable row level security;
alter table public.hadiths            enable row level security;
alter table public.duas               enable row level security;
alter table public.names_of_allah     enable row level security;
alter table public.articles           enable row level security;
alter table public.daily_picks        enable row level security;
alter table public.religious_days     enable row level security;
alter table public.content_revisions  enable row level security;

drop policy if exists sources_read on public.sources;
create policy sources_read on public.sources for select using (true);
drop policy if exists sources_write on public.sources;
create policy sources_write on public.sources for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists surahs_read on public.surahs;
create policy surahs_read on public.surahs for select using (true);
drop policy if exists surahs_write on public.surahs;
create policy surahs_write on public.surahs for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists ayahs_read on public.ayahs;
create policy ayahs_read on public.ayahs for select using (true);
drop policy if exists ayahs_write on public.ayahs;
create policy ayahs_write on public.ayahs for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

-- Taslak/incelemedeki metin son kullanıcıya gösterilmez (§73).
drop policy if exists translations_read on public.translations;
create policy translations_read on public.translations for select
  using (status = 'published' or public.has_role('editor'));
drop policy if exists translations_write on public.translations;
create policy translations_write on public.translations for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists tafsirs_read on public.tafsirs;
create policy tafsirs_read on public.tafsirs for select
  using (status = 'published' or public.has_role('editor'));
drop policy if exists tafsirs_write on public.tafsirs;
create policy tafsirs_write on public.tafsirs for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists hadiths_read on public.hadiths;
create policy hadiths_read on public.hadiths for select
  using (status = 'published' or public.has_role('editor'));
drop policy if exists hadiths_write on public.hadiths;
create policy hadiths_write on public.hadiths for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists duas_read on public.duas;
create policy duas_read on public.duas for select
  using (status = 'published' or public.has_role('editor'));
drop policy if exists duas_write on public.duas;
create policy duas_write on public.duas for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists names_read on public.names_of_allah;
create policy names_read on public.names_of_allah for select using (true);
drop policy if exists names_write on public.names_of_allah;
create policy names_write on public.names_of_allah for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists articles_read on public.articles;
create policy articles_read on public.articles for select
  using (status = 'published' or public.has_role('editor'));
drop policy if exists articles_write on public.articles;
create policy articles_write on public.articles for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists daily_picks_read on public.daily_picks;
create policy daily_picks_read on public.daily_picks for select using (true);
drop policy if exists daily_picks_write on public.daily_picks;
create policy daily_picks_write on public.daily_picks for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists religious_days_read on public.religious_days;
create policy religious_days_read on public.religious_days for select
  using (status = 'published' or public.has_role('editor'));
drop policy if exists religious_days_write on public.religious_days;
create policy religious_days_write on public.religious_days for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

-- Sürüm izi yalnız editör görür; kimse silemez (delete politikası yok).
drop policy if exists content_revisions_read on public.content_revisions;
create policy content_revisions_read on public.content_revisions for select
  using (public.has_role('editor'));
drop policy if exists content_revisions_insert on public.content_revisions;
create policy content_revisions_insert on public.content_revisions for insert
  with check (public.has_role('editor'));

-- ------------------------------------------------------------ kullanıcı
-- Kullanıcı yalnız kendi satırını görür ve yazar. İstisnasız.

alter table public.profiles         enable row level security;
alter table public.user_settings    enable row level security;
alter table public.user_locations   enable row level security;
alter table public.favorites        enable row level security;
alter table public.bookmarks        enable row level security;
alter table public.reading_progress enable row level security;
alter table public.khatm_progress   enable row level security;
alter table public.dhikr_presets    enable row level security;
alter table public.dhikr_sessions   enable row level security;
alter table public.qada_counters    enable row level security;
alter table public.qada_entries     enable row level security;
alter table public.worship_log      enable row level security;
alter table public.fasting_log      enable row level security;
alter table public.reminders        enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.devices          enable row level security;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or public.has_role('moderator'));
drop policy if exists profiles_self_write on public.profiles;
create policy profiles_self_write on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert
  with check (id = auth.uid());

-- Kendi satırı kuralını tek tek yazmak yerine döngüyle kurarız; hepsinin
-- `user_id` sütunu aynı anlamı taşır.
do $$
declare t text;
begin
  foreach t in array array[
    'user_settings', 'user_locations', 'favorites', 'bookmarks',
    'reading_progress', 'khatm_progress', 'dhikr_presets', 'dhikr_sessions',
    'qada_counters', 'qada_entries', 'worship_log', 'fasting_log',
    'reminders', 'devices'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_owner', t);
  end loop;
end $$;

-- Abonelik satırını kullanıcı **okur ama yazamaz**: doğrulama sunucudadır (§67).
drop policy if exists subscriptions_read on public.subscriptions;
create policy subscriptions_read on public.subscriptions for select
  using (user_id = auth.uid());

-- ------------------------------------------------------------- topluluk

alter table public.prayer_requests enable row level security;
alter table public.prayer_amins    enable row level security;
alter table public.reports         enable row level security;
alter table public.blocks          enable row level security;
alter table public.rate_limits     enable row level security;

-- Akış: yalnız onaylanmış talepler, engellenenler hariç. Yazar kimliği
-- politikada kullanılır ama sütun istemciye view üzerinden verilir (0008).
drop policy if exists prayer_requests_feed on public.prayer_requests;
create policy prayer_requests_feed on public.prayer_requests for select
  using (
    (status = 'approved'
      and not exists (
        select 1 from public.blocks b
        where b.blocker_id = auth.uid() and b.blocked_id = prayer_requests.author_id
      ))
    or author_id = auth.uid()
    or public.has_role('moderator')
  );

drop policy if exists prayer_requests_insert on public.prayer_requests;
create policy prayer_requests_insert on public.prayer_requests for insert
  with check (author_id = auth.uid() and status = 'pending');

-- Yazar kendi talebini yalnız **silebilir**; onaylanmış metni düzenleyemez
-- (moderasyondan geçmiş metnin sonradan değiştirilmesi kötüye kullanımdır).
drop policy if exists prayer_requests_delete on public.prayer_requests;
create policy prayer_requests_delete on public.prayer_requests for delete
  using (author_id = auth.uid() or public.has_role('moderator'));

drop policy if exists prayer_requests_moderate on public.prayer_requests;
create policy prayer_requests_moderate on public.prayer_requests for update
  using (public.has_role('moderator')) with check (public.has_role('moderator'));

drop policy if exists prayer_amins_own on public.prayer_amins;
create policy prayer_amins_own on public.prayer_amins for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert
  with check (reporter_id = auth.uid());
drop policy if exists reports_read on public.reports;
create policy reports_read on public.reports for select
  using (reporter_id = auth.uid() or public.has_role('moderator'));
drop policy if exists reports_handle on public.reports;
create policy reports_handle on public.reports for update
  using (public.has_role('moderator')) with check (public.has_role('moderator'));

drop policy if exists blocks_own on public.blocks;
create policy blocks_own on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Hız sınırı sayacı yalnız sunucu tarafından yazılır; istemci okuyamaz bile.
-- (Politika yok = kimse erişemez. Edge Function servis anahtarıyla erişir.)

-- ------------------------------------------------------------------ AI

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks    enable row level security;
alter table public.ai_conversations    enable row level security;
alter table public.ai_messages         enable row level security;

-- Bilgi havuzunu istemci **okumaz**: arama Edge Function üzerinden yapılır,
-- böylece gömme vektörleri ve ham metin dışarı sızmaz.
drop policy if exists knowledge_documents_admin on public.knowledge_documents;
create policy knowledge_documents_admin on public.knowledge_documents for all
  using (public.has_role('editor')) with check (public.has_role('editor'));
drop policy if exists knowledge_chunks_admin on public.knowledge_chunks;
create policy knowledge_chunks_admin on public.knowledge_chunks for all
  using (public.has_role('editor')) with check (public.has_role('editor'));

drop policy if exists ai_conversations_own on public.ai_conversations;
create policy ai_conversations_own on public.ai_conversations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists ai_messages_own on public.ai_messages;
create policy ai_messages_own on public.ai_messages for select
  using (exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
  ));
drop policy if exists ai_messages_insert on public.ai_messages;
create policy ai_messages_insert on public.ai_messages for insert
  with check (
    role = 'user' and exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  );
-- Asistan yanıtını yalnız Edge Function (servis anahtarı) yazar.

-- ---------------------------------------------------------------- admin

alter table public.audit_log      enable row level security;
alter table public.push_campaigns enable row level security;

drop policy if exists audit_log_read on public.audit_log;
create policy audit_log_read on public.audit_log for select
  using (public.has_role('admin'));
-- Denetim izine insert yalnız sunucudan; update/delete hiç kimseye yok.

drop policy if exists push_campaigns_admin on public.push_campaigns;
create policy push_campaigns_admin on public.push_campaigns for all
  using (public.has_role('admin')) with check (public.has_role('admin'));
