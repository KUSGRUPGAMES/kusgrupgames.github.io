-- Şartname §55, §57, §69, §70 — tetikleyiciler, görünümler, hesap silme.

-- Yeni kullanıcı için profil ve ayar satırını otomatik aç (§57).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- `updated_at` bakımı.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'user_settings', 'reading_progress', 'qada_counters',
    'worship_log', 'subscriptions', 'sources', 'articles'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      t || '_touch', t);
  end loop;
end $$;

-- "Dua ettim" sayacını tetikleyiciyle tut: istemci sayacı yazamaz (§55).
create or replace function public.sync_amin_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.prayer_requests set amin_count = amin_count + 1 where id = new.request_id;
  elsif tg_op = 'DELETE' then
    update public.prayer_requests set amin_count = greatest(0, amin_count - 1) where id = old.request_id;
  end if;
  return null;
end;
$$;

drop trigger if exists prayer_amins_count on public.prayer_amins;
create trigger prayer_amins_count
  after insert or delete on public.prayer_amins
  for each row execute function public.sync_amin_count();

-- Şikâyet sayacı; eşik aşılırsa talep otomatik gizlenir (§55).
create or replace function public.sync_report_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare threshold constant integer := 3;
begin
  update public.prayer_requests
     set report_count = report_count + 1,
         status = case when report_count + 1 >= threshold then 'hidden'::moderation_status else status end
   where id = new.request_id;
  return null;
end;
$$;

drop trigger if exists reports_count on public.reports;
create trigger reports_count
  after insert on public.reports
  for each row execute function public.sync_report_count();

-- Akış görünümü: **yazar kimliği yoktur** (§55 anonimlik).
create or replace view public.prayer_feed
with (security_invoker = true) as
  select r.id,
         r.body,
         r.category,
         r.amin_count,
         r.published_at,
         exists (
           select 1 from public.prayer_amins a
           where a.request_id = r.id and a.user_id = auth.uid()
         ) as i_prayed,
         (r.author_id = auth.uid()) as is_mine
    from public.prayer_requests r
   where r.status = 'approved';

grant select on public.prayer_feed to authenticated;

-- Hesap silme (§69). Kullanıcı kendi verisini tek çağrıda siler; `auth.users`
-- silinince tüm `on delete cascade` zinciri boşalır.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Oturum yok';
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id)
  values (uid, 'account_delete', 'auth.users', uid::text);
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- Veri dışa aktarma (§69): kullanıcının tüm satırları tek JSON belgede.
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile',          (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'settings',         (select to_jsonb(s) from public.user_settings s where s.user_id = auth.uid()),
    'locations',        (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) from public.user_locations l where l.user_id = auth.uid()),
    'favorites',        (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from public.favorites f where f.user_id = auth.uid()),
    'bookmarks',        (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) from public.bookmarks b where b.user_id = auth.uid()),
    'reading_progress', (select to_jsonb(r) from public.reading_progress r where r.user_id = auth.uid()),
    'dhikr_sessions',   (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) from public.dhikr_sessions d where d.user_id = auth.uid()),
    'qada',             (select coalesce(jsonb_agg(to_jsonb(q)), '[]'::jsonb) from public.qada_counters q where q.user_id = auth.uid()),
    'worship_log',      (select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb) from public.worship_log w where w.user_id = auth.uid()),
    'fasting_log',      (select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb) from public.fasting_log g where g.user_id = auth.uid()),
    'reminders',        (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.reminders m where m.user_id = auth.uid())
  );
$$;

revoke all on function public.export_my_data() from public;
grant execute on function public.export_my_data() to authenticated;
