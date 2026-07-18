ALTER TABLE public.user_consents
  ADD COLUMN IF NOT EXISTS document_version TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS consent_method TEXT NOT NULL DEFAULT 'registration';

ALTER TABLE public.user_consents
  DROP CONSTRAINT IF EXISTS user_consents_user_id_legal_document_id_key;

ALTER TABLE public.user_consents
  ADD CONSTRAINT user_consents_user_document_version_key
  UNIQUE (user_id, legal_document_id, document_version);

ALTER TABLE public.user_consents
  DROP CONSTRAINT IF EXISTS user_consents_consent_method_check;
ALTER TABLE public.user_consents
  ADD CONSTRAINT user_consents_consent_method_check
  CHECK (consent_method IN ('registration', 'settings', 'explicit_reconsent'));

COMMENT ON COLUMN public.user_consents.document_version IS
  'Immutable version snapshot accepted by the user; never inferred from the current document.';
COMMENT ON COLUMN public.user_consents.consent_method IS
  'Affirmative product flow that created this consent record.';
