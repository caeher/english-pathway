CREATE POLICY "Staff can view student profiles" ON public.profiles
  FOR SELECT USING (public.is_staff() AND role = 'student');
