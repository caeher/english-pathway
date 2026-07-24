CREATE TABLE public.english_assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation' CHECK (char_length(title) BETWEEN 1 AND 120),
  activity_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.english_assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.english_assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_english_assistant_conversations_user_updated
  ON public.english_assistant_conversations(user_id, updated_at DESC);

CREATE INDEX idx_english_assistant_messages_conversation_created
  ON public.english_assistant_messages(conversation_id, created_at ASC);

ALTER TABLE public.english_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own English assistant conversations"
  ON public.english_assistant_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own English assistant messages"
  ON public.english_assistant_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.english_assistant_conversations conversation
      WHERE conversation.id = english_assistant_messages.conversation_id
        AND conversation.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.english_assistant_conversations conversation
      WHERE conversation.id = english_assistant_messages.conversation_id
        AND conversation.user_id = auth.uid()
    )
  );

CREATE TRIGGER english_assistant_conversations_updated_at
  BEFORE UPDATE ON public.english_assistant_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
