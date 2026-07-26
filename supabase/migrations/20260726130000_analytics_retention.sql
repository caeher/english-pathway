-- Purge optional analytics older than the approved retention window (default 24 months).
CREATE OR REPLACE FUNCTION public.purge_old_analytics_events(retention_days INTEGER DEFAULT 730)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - make_interval(days => retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_old_analytics_events(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_old_analytics_events(INTEGER) TO service_role;
