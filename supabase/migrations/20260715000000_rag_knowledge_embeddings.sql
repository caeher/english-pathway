-- Enable pgvector for RAG knowledge base
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge embeddings table for curriculum fragments
CREATE TABLE public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX knowledge_embeddings_metadata_idx
  ON public.knowledge_embeddings USING gin (metadata);

CREATE INDEX knowledge_embeddings_embedding_idx
  ON public.knowledge_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Cosine similarity search for adaptive content retrieval
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
GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, INTEGER, JSONB) TO service_role;

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read knowledge embeddings"
  ON public.knowledge_embeddings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage knowledge embeddings"
  ON public.knowledge_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
