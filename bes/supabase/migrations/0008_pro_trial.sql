-- BEŞ — giriş yapana bir kerelik 14 günlük Pro denemesi (1 Ekim kararı).
-- 0007'den SONRA çalıştırılır; tekrar çalıştırılabilir.
--
-- Deneme sunucuda tutulur: uygulamayı silip kurmak ya da başka telefonda
-- giriş yapmak süreyi sıfırlamaz. Uygulama denemeyi yalnız satış açıkken
-- (1.0.1, `extra.proSales`) başlatır; 1.0'da Pro herkese ücretsizdir.

create table if not exists public.pro_trials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null
);
alter table public.pro_trials enable row level security;
drop policy if exists "kendi denemesini görür" on public.pro_trials;
create policy "kendi denemesini görür" on public.pro_trials
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
grant select on public.pro_trials to authenticated;

-- Yazma yalnız bu işlevle: varsa dokunmaz, yoksa 14 gün açar; bitişi döner.
create or replace function public.start_pro_trial()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare bitis timestamptz;
begin
  if auth.uid() is null then raise exception 'oturum yok' using errcode = '42501'; end if;
  insert into public.pro_trials (user_id, ends_at) values (auth.uid(), now() + interval '14 days')
    on conflict (user_id) do nothing;
  select ends_at into bitis from public.pro_trials where user_id = auth.uid();
  return bitis;
end;
$$;
revoke all on function public.start_pro_trial() from public, anon;
grant execute on function public.start_pro_trial() to authenticated;
