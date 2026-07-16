-- Teacher Features Migration

-- 1. Add teacher_id and class_name to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS class_name TEXT;

-- 2. Add RLS policy to let teachers manage student profiles (set/unset teacher_id and class_name)
CREATE POLICY "Teachers can update their student profiles" ON public.profiles
  FOR UPDATE
  USING (
    public.is_staff() AND role = 'student' AND (teacher_id IS NULL OR teacher_id = auth.uid())
  )
  WITH CHECK (
    public.is_staff() AND role = 'student' AND (teacher_id = auth.uid() OR teacher_id IS NULL)
  );

-- 3. Create module assignments table
CREATE TABLE IF NOT EXISTS public.teacher_module_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, module_id)
);

ALTER TABLE public.teacher_module_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage assignments" ON public.teacher_module_assignments
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view their assignments" ON public.teacher_module_assignments
  FOR SELECT USING (auth.uid() = student_id);

-- 4. Create custom quizzes table
CREATE TABLE IF NOT EXISTS public.teacher_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.teacher_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their quizzes" ON public.teacher_quizzes
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view assigned quizzes" ON public.teacher_quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.teacher_id = public.teacher_quizzes.teacher_id
    )
  );
