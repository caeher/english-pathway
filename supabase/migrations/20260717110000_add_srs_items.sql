CREATE TABLE public.srs_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_ref TEXT NOT NULL,
  content JSONB NOT NULL,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30),
  interval_days INTEGER NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
  repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
  due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_ref)
);

CREATE INDEX idx_srs_items_user_due_at ON public.srs_items(user_id, due_at);

ALTER TABLE public.srs_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own SRS items"
  ON public.srs_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER srs_items_updated_at
  BEFORE UPDATE ON public.srs_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
