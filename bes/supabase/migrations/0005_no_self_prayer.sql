-- BEŞ — kişi kendi dua isteğine "dua ettim" işaretleyemez (1 Ekim).
-- 0004'ten SONRA çalıştırılır; tekrar çalıştırılabilir.
-- İstemci düğmeyi göstermiyor; bu, değiştirilmiş bir istemciye karşı sayacın
-- ("X kişi senin için dua etti") şişirilmesini engeller.

create or replace function public.dua_prayers_not_self()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.dua_requests r where r.id = new.request_id and r.author_id = new.user_id) then
    raise exception 'kendi isteğine dua işaretlenemez' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists dua_prayers_not_self_trg on public.dua_prayers;
create trigger dua_prayers_not_self_trg
  before insert on public.dua_prayers
  for each row execute function public.dua_prayers_not_self();
