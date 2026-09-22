-- Şartname §71 — tablo ayrıcalıkları.
--
-- RLS satırı filtreler, GRANT ise tabloya erişimi açar; ikisi birlikte
-- gerekir. Supabase varsayılan olarak `public` şemasına geniş grant verir;
-- burada bunu **açıkça** yazıyoruz ki yetki yüzeyinin ne olduğu görünsün.

grant usage on schema public to anon, authenticated;

-- Okuma: yayınlanmış içerik anonim kullanıcıya da açıktır (uygulama hesapsız
-- çalışır, §57). Satır filtresini RLS yapar.
grant select on
  public.sources, public.surahs, public.ayahs, public.translations,
  public.tafsirs, public.hadiths, public.duas, public.names_of_allah,
  public.articles, public.daily_picks, public.religious_days
to anon, authenticated;

-- Kullanıcıya ait tablolar: tam erişim, satır sahipliğini RLS zorlar.
grant select, insert, update, delete on
  public.user_settings, public.user_locations, public.favorites,
  public.bookmarks, public.reading_progress, public.khatm_progress,
  public.dhikr_presets, public.dhikr_sessions, public.qada_counters,
  public.qada_entries, public.worship_log, public.fasting_log,
  public.reminders, public.devices, public.profiles
to authenticated;

-- Abonelik yalnız okunur (§67: doğrulama sunucuda).
grant select on public.subscriptions to authenticated;

-- Topluluk.
grant select, insert, delete on public.prayer_requests to authenticated;
grant select, insert, delete on public.prayer_amins to authenticated;
grant select, insert on public.reports to authenticated;
grant select, insert, delete on public.blocks to authenticated;

-- Editör/yönetici tabloları: grant `authenticated`'e verilir, ayrımı RLS
-- içindeki `has_role()` yapar.
grant select, insert, update, delete on
  public.content_revisions, public.knowledge_documents, public.knowledge_chunks,
  public.push_campaigns
to authenticated;
grant select on public.audit_log to authenticated;

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert on public.ai_messages to authenticated;

-- Dizi (sequence) kullanımı: insert yapabilen tablolar için gerekir.
grant usage, select on all sequences in schema public to authenticated;

-- `rate_limits` bilerek dışarıda: yalnız servis anahtarı erişir.
revoke all on public.rate_limits from anon, authenticated;
