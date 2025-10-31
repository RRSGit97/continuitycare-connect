-- Drop existing profile SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create more restrictive SELECT policies

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Patients can view their assigned specialists' profiles
CREATE POLICY "Patients can view assigned specialists"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM episodes_of_care e
    JOIN providers pr ON pr.id = e.specialist_id
    WHERE pr.user_id = profiles.id
    AND e.patient_id = get_patient_id_for_user(auth.uid())
  )
);

-- 4. Providers can view their patients' profiles (with consent for local providers)
CREATE POLICY "Specialists can view their patients"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'specialist'::app_role)
  AND EXISTS (
    SELECT 1
    FROM episodes_of_care e
    JOIN patients p ON p.id = e.patient_id
    WHERE p.user_id = profiles.id
    AND e.specialist_id = get_provider_id_for_user(auth.uid())
  )
);

-- 5. Local providers can view patient profiles only with active consent
CREATE POLICY "Local providers can view consented patients"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'local_provider'::app_role)
  AND EXISTS (
    SELECT 1
    FROM patients p
    WHERE p.user_id = profiles.id
    AND has_active_consent(get_provider_id_for_user(auth.uid()), p.id)
  )
);