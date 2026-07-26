# Legal and privacy release checklist

This checklist is a release gate, not legal advice. The service operator and qualified counsel must complete and sign it for each target jurisdiction. Operator variables are documented in [`docs/legal/operator-config.md`](docs/legal/operator-config.md); the technical data inventory lives in [`docs/legal/data-processing-matrix.md`](docs/legal/data-processing-matrix.md).

- [ ] Confirm the operator's legal name, privacy contact, hosting locations, and support process (`LEGAL_*` env vars).
- [ ] Approve Terms, Privacy, and Cookie documents v1.2 and their effective dates/versions.
- [ ] Confirm the legal basis and retention period for account, learning, analytics (24 months), tutor memory, English Assistant chats, and microphone/AI processing.
- [ ] Verify ElevenLabs, OpenAI, Supabase, Google OAuth (when enabled), subprocessors, transfer safeguards, and provider terms.
- [ ] Confirm that voice permission is requested only after a user gesture and that text mode is a complete alternative.
- [ ] Verify the product does not retain raw audio or full tutor transcripts by default; test deletion/export paths.
- [ ] Test versioned consent records for registration, email confirmation, OAuth, and re-consent in Settings.
- [ ] Test essential-only cookie choice before analytics scripts/events load, and test changing the choice in Settings.
- [ ] Review accessibility of legal navigation, tables, headings, keyboard focus, and screen-reader status messages.
- [ ] Record approver, jurisdiction, document versions, date, and unresolved risks before production launch.
