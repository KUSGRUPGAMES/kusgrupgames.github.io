-- BEŞ — Diyanet'in ilçe bazlı resmî vakitleri için önbellek (5 Ekim).
-- Uygulama vakitleri buradan (Edge Function diyanet-times üzerinden) alır;
-- kaynak her ilçe için en çok günde bir kez sorulur. Erişim yalnız işlevle.
create table if not exists public.diyanet_times (
  ilce_id text not null check (ilce_id ~ '^[0-9]{3,6}$'),
  day date not null,
  -- [imsak, güneş, öğle, ikindi, akşam, yatsı] "HH:MM"
  times text[] not null check (array_length(times, 1) = 6),
  fetched_at timestamptz not null default now(),
  primary key (ilce_id, day)
);
alter table public.diyanet_times enable row level security;
revoke all on public.diyanet_times from anon, authenticated;
