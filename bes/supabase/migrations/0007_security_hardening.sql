-- BEŞ — güvenlik sağlamlaştırması (D36, yönetici paneli öncesi denetim).
-- 0006'dan SONRA çalıştırılır; tekrar çalıştırılabilir.
--
-- Canlı veritabanında denenerek bulunan açıklar:
--  1. KRİTİK: profil koruması yalnız UPDATE'te çalışıyordu; kullanıcı profilini
--     ilk kez oluştururken `is_admin = true` yazıp yönetici olabiliyordu.
--  2. Kullanıcı kendi dua isteğini/mesajını güncelleyerek yöneticinin gizlediği
--     içeriği geri açabiliyor, dua sayacını şişirebiliyor, yasaklı kelime
--     süzgecini (yalnız INSERT'te) atlatabiliyordu.
--  3. Mesajdaki ve cüzdeki takma ad istemciden geliyordu: başkasının adıyla
--     ("Yönetici" dahil) yazılabiliyordu.
--  4. Şikâyet, hatim grubu ve dua isteği eklerken sunucunun alanları
--     (durum, sayaç, tamamlanma) istemciden yazılabiliyordu.
--
-- Kural: "ayrıcalıklı mı" sorusu `auth.role()` ile sorulur. PostgREST'ten gelen
-- kullanıcı isteği 'authenticated'/'anon'dur; SQL Editor ve Management API'de
-- JWT yoktur (null) — proje sahibinin elle yaptığı işlem engellenmez.

create or replace function public.is_end_user_request()
returns boolean language sql stable as $$
  select coalesce(auth.role(), '') in ('authenticated', 'anon') and not public.is_admin(auth.uid());
$$;

create or replace function public.nickname_allowed(n text)
returns boolean language sql stable security definer set search_path = public as $$
  select not public.contains_banned_word(n)
     and lower(n) !~ '(yönetici|yonetici|admin|moderat|beş ekibi|bes ekibi|kuş grup|kus grup)';
$$;

-- ── 1. profiller: ekleme ve güncellemede ayrıcalıklı alanlar korunur ────
create or replace function public.profiles_guard_privileged_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_end_user_request() then
    if tg_op = 'INSERT' then
      new.is_admin := false; new.banned := false; new.muted_until := null; new.ban_reason := null;
      new.created_at := now();
    else
      new.is_admin := old.is_admin; new.banned := old.banned;
      new.muted_until := old.muted_until; new.ban_reason := old.ban_reason;
      new.created_at := old.created_at;
    end if;
    if (tg_op = 'INSERT' or new.nickname is distinct from old.nickname) and not public.nickname_allowed(new.nickname) then
      raise exception 'Bu takma ad kullanılamaz.' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_guard_privileged_fields_trg on public.profiles;
create trigger profiles_guard_privileged_fields_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_privileged_fields();

-- ── 2. dua istekleri ────────────────────────────────────────────────────
create or replace function public.dua_requests_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_end_user_request() then return new; end if;
  if tg_op = 'INSERT' then
    new.prayer_count := 0; new.is_hidden := false; new.created_at := now();
  else
    new.author_id := old.author_id; new.prayer_count := old.prayer_count; new.created_at := old.created_at;
    -- Kendi isteğini gizleyebilir (silme yerine), gizleneni açamaz.
    new.is_hidden := old.is_hidden or new.is_hidden;
    if new.body is distinct from old.body and public.contains_banned_word(new.body) then
      raise exception 'Metin uygun olmayan bir kelime içeriyor.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists dua_requests_guard_trg on public.dua_requests;
create trigger dua_requests_guard_trg
  before insert or update on public.dua_requests
  for each row execute function public.dua_requests_guard();

-- ── 3. sohbet mesajları: takma ad profilden; gizlenen geri açılmaz ─────
create or replace function public.chat_messages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare ad text;
begin
  if not public.is_end_user_request() then return new; end if;
  if tg_op = 'INSERT' then
    select nickname into ad from public.profiles where id = new.author_id;
    if ad is null then raise exception 'Önce bir takma ad seç.' using errcode = '22023'; end if;
    new.nickname := ad; new.is_hidden := false; new.created_at := now();
  else
    new.author_id := old.author_id; new.room_id := old.room_id; new.nickname := old.nickname;
    new.created_at := old.created_at;
    new.is_hidden := old.is_hidden or new.is_hidden;
    if new.body is distinct from old.body and public.contains_banned_word(new.body) then
      raise exception 'Mesaj uygun olmayan bir kelime içeriyor.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists chat_messages_guard_trg on public.chat_messages;
create trigger chat_messages_guard_trg
  before insert or update on public.chat_messages
  for each row execute function public.chat_messages_guard();

-- ── 4. cüz: takma ad profilden ──────────────────────────────────────────
create or replace function public.khatm_claim_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.claimed_by is not null and new.claimed_by is distinct from old.claimed_by
     and public.is_restricted(new.claimed_by) then
    raise exception 'Hesabın kısıtlı: cüz alamazsın.';
  end if;
  if public.is_end_user_request() then
    new.claimed_nickname := case when new.claimed_by is null then null
      else (select nickname from public.profiles where id = new.claimed_by) end;
    if new.claimed_by is not null and new.claimed_nickname is null then
      raise exception 'Önce bir takma ad seç.' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

-- ── 5. hatim grubu ve şikâyet: sunucu alanları istemciden yazılamaz ────
create or replace function public.khatm_circles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_end_user_request() then
    new.completed_at := null; new.created_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists khatm_circles_guard_trg on public.khatm_circles;
create trigger khatm_circles_guard_trg
  before insert on public.khatm_circles
  for each row execute function public.khatm_circles_guard();

create or replace function public.reports_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_end_user_request() then
    new.status := 'open'; new.resolved_by := null; new.resolved_at := null;
    new.resolution_note := null; new.created_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists reports_guard_trg on public.reports;
create trigger reports_guard_trg
  before insert on public.reports
  for each row execute function public.reports_guard();
