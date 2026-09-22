-- Şartname §56 — AI asistanı (retrieval-backed).
--
-- Değişmez kural: **AI çıktısı içerik veritabanına yazılmaz.** Asistan yalnız
-- `knowledge_chunks` içindeki onaylanmış kaynaklardan alıntı yapar; ürettiği
-- metin `ai_messages` içinde kalır, `translations`/`hadiths`/`duas` tablolarına
-- asla akmaz. Bu ayrım şema düzeyinde korunur: AI tablolarından içerik
-- tablolarına hiçbir yazma yolu yoktur.

-- Asistanın okuyabileceği onaylı belgeler. Yalnız 'published' içerikten türetilir.
create table if not exists public.knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references public.sources(id),
  kind          content_kind not null,
  record_id     text not null,
  title         text not null,
  language      text not null default 'tr',
  created_at    timestamptz not null default now(),
  unique (kind, record_id, language)
);

-- Parçalar + gömme vektörü. Boyut 1536: OpenAI text-embedding-3-small ölçüsü;
-- sağlayıcı değişirse yeni sütun eklenir, mevcut veri bozulmaz. ⛔B8
create table if not exists public.knowledge_chunks (
  id            bigserial primary key,
  document_id   uuid not null references public.knowledge_documents(id) on delete cascade,
  ordinal       integer not null,
  body          text not null,
  embedding     vector(1536),
  created_at    timestamptz not null default now(),
  unique (document_id, ordinal)
);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists public.ai_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id            bigserial primary key,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  body          text not null,
  -- Asistan yanıtının dayandığı parçalar. Boş olamaz: kaynaksız yanıt verilmez (§56).
  citations     jsonb not null default '[]'::jsonb,
  -- Fetva/hüküm sorusu reddedildiyse nedeni (§56).
  refusal       text,
  created_at    timestamptz not null default now()
);
create index if not exists ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

-- Asistan yanıtı kaynaksız da olamaz, reddedilmiş de olmayabilir — ikisinden
-- biri dolu olmalı. Kullanıcı mesajları bu kuraldan muaftır.
do $$ begin
  alter table public.ai_messages
    add constraint ai_messages_cited_or_refused
    check (role = 'user' or refusal is not null or jsonb_array_length(citations) > 0);
exception when duplicate_object then null; end $$;
