-- Restore knowledge embeddings for RAG (removed in 20260716100000_remove_roles_and_learner.sql)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_embeddings_content_hash_idx
  ON public.knowledge_embeddings (content_hash);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_metadata_idx
  ON public.knowledge_embeddings USING gin (metadata);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx
  ON public.knowledge_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_embeddings ke
  WHERE
    (filter = '{}'::jsonb OR ke.metadata @> filter)
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, INTEGER, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, INTEGER, JSONB) TO service_role;

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read knowledge embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Anyone can read knowledge embeddings"
  ON public.knowledge_embeddings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage knowledge embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Service role can manage knowledge embeddings"
  ON public.knowledge_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
