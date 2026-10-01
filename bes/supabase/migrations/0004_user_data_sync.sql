-- BEŞ — hesapla eşitleme (D35). 0003'ten SONRA, SQL Editor'e yapıştırılıp
-- çalıştırılır. Tekrar çalıştırılabilir.
--
-- Giriş yapan kullanıcının kişisel kayıtları (Kur'an konumu, yer imleri,
-- ibadet defteri, zikir, kaza, hatim, oruç, hatırlatıcılar, favoriler, kurs
-- ilerlemesi, ayarlar) tek satırda, JSON olarak durur. Birleştirme istemcide
-- (src/features/sync/cloud.ts, üç yönlü); sunucu yalnız saklar.
--
-- Erişim: yalnız satırın sahibi okur ve yazar (RLS). Hesap silinince satır
-- `on delete cascade` ile gider; ayrıca delete_my_account() da siler.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  device_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists user_data_select_own on public.user_data;
create policy user_data_select_own on public.user_data
  for select to authenticated using (user_id = auth.uid());

drop policy if exists user_data_insert_own on public.user_data;
create policy user_data_insert_own on public.user_data
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists user_data_update_own on public.user_data;
create policy user_data_update_own on public.user_data
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_data_delete_own on public.user_data;
create policy user_data_delete_own on public.user_data
  for delete to authenticated using (user_id = auth.uid());

-- Kötüye kullanıma karşı üst sınır: tek satır 2 MB'ı geçemez (yıllarca
-- kullanımda bile kişisel kayıtlar bunun çok altında kalır).
alter table public.user_data drop constraint if exists user_data_payload_size;
alter table public.user_data add constraint user_data_payload_size
  check (pg_column_size(payload) < 2 * 1024 * 1024);

grant select, insert, update, delete on public.user_data to authenticated;
