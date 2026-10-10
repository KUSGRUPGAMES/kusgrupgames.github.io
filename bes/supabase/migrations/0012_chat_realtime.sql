-- BEŞ — sohbet odalarında canlı mesaj akışı (11 Ekim).
--
-- `chat_messages` hiçbir migration'da `supabase_realtime` publication'ına
-- eklenmemişti: istemcideki `postgres_changes` aboneliği (chat.ts) hiçbir
-- zaman tetiklenmiyordu, yeni mesajlar yalnız ekrana yeniden girince
-- (ilk `select` sorgusu tazelenince) görünüyordu. Mesaj metni zaten herkese
-- açık (RLS §: "gizli olmayan mesajlar herkese görünür"), bu yüzden
-- publication'a eklemek ek bir veri sızıntısı oluşturmaz.
alter publication supabase_realtime add table public.chat_messages;
