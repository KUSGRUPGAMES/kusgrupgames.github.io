-- BEŞ — hesabı uygulama içinden silme (D32).
-- 0002_moderation_admin_content.sql'den SONRA, aynı şekilde SQL Editor'e
-- yapıştırılıp çalıştırılır. Tekrar çalıştırılabilir.
--
-- App Review 5.1.1(v): hesap açtıran uygulama, silmeyi uygulama içinde
-- sunmak zorunda. İstemci `auth.users`'a dokunamaz; bu işlev `security
-- definer` ile çalışır ve YALNIZ çağıranın kendi satırını siler
-- (`auth.uid()` — parametre almaz, başkasının hesabı hedeflenemez).
--
-- Topluluk tablolarının hepsi `auth.users`'a `on delete cascade` ile bağlı:
-- profil, dua istekleri, "dua ettim" kayıtları, sohbet mesajları, şikâyetler,
-- engellemeler ve kurduğu hatim grupları silinir. Başkasının grubunda aldığı
-- cüzler `on delete set null` — grup bozulmaz, cüz boşa düşer.
--
-- Yönetici izleri (`banned_words.added_by`, `reports.resolved_by`,
-- `content_items.created_by`) cascade DEĞİL; yönetici hesabını silerken
-- yabancı anahtar hatası vermemesi için önce boşaltılır — eklediği kelime ve
-- içerik yerinde kalır.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'oturum yok' using errcode = '28000';
  end if;
  update public.banned_words set added_by = null where added_by = uid;
  update public.reports set resolved_by = null where resolved_by = uid;
  update public.content_items set created_by = null where created_by = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
