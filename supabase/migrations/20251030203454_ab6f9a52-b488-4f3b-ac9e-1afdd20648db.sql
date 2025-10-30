-- Fix 1: Remove public access to providers table
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.providers;

-- Fix 2: Restrict audit log inserts to service role only (via triggers)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Only service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix 3: Add INSERT policies for profiles
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fix 4: Add INSERT policy for patients
CREATE POLICY "Users can create their patient record"
  ON public.patients FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Fix 5: Add INSERT policy for providers
CREATE POLICY "Users can create their provider record"
  ON public.providers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Fix 6: Patients should be able to view providers they have episodes with
CREATE POLICY "Patients can view their assigned providers"
  ON public.providers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      JOIN public.patients p ON p.id = e.patient_id
      WHERE e.specialist_id = providers.id
        AND p.user_id = auth.uid()
    )
  );

-- Fix 7: Patients can view providers they have bookings with
CREATE POLICY "Patients can view providers they booked"
  ON public.providers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.provider_id = providers.id
        AND b.patient_id = public.get_patient_id_for_user(auth.uid())
    )
  );