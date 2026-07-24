CREATE TABLE public.rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_rate_limit_buckets_expires_at ON public.rate_limit_buckets(expires_at);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_count INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  INSERT INTO public.rate_limit_buckets AS bucket (bucket_key, window_start, count, expires_at)
  VALUES (
    p_bucket_key,
    v_now,
    1,
    v_now + (p_window_ms * INTERVAL '1 millisecond')
  )
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    count = CASE
      WHEN bucket.expires_at <= v_now THEN 1
      ELSE bucket.count + 1
    END,
    window_start = CASE
      WHEN bucket.expires_at <= v_now THEN v_now
      ELSE bucket.window_start
    END,
    expires_at = CASE
      WHEN bucket.expires_at <= v_now THEN v_now + (p_window_ms * INTERVAL '1 millisecond')
      ELSE bucket.expires_at
    END
  RETURNING bucket.count, bucket.expires_at INTO v_count, v_expires_at;

  RETURN jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', GREATEST(0, p_limit - v_count),
    'retryAfterSeconds', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_expires_at - v_now))))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
