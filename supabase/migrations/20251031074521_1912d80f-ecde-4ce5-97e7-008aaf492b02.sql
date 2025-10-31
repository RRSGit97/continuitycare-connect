-- Drop the overly permissive anonymous access policy
DROP POLICY IF EXISTS "Block anonymous access to patients" ON public.patients;

-- Drop duplicate admin policy
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;

-- Add more restrictive policies that enforce proper access control

-- 1. Specialists can view their assigned patients
CREATE POLICY "Specialists can view assigned patients"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'specialist'::app_role)
  AND EXISTS (
    SELECT 1
    FROM episodes_of_care e
    WHERE e.patient_id = patients.id
    AND e.specialist_id = get_provider_id_for_user(auth.uid())
  )
);

-- 2. Local providers can view patients only with active consent
CREATE POLICY "Local providers can view consented patients"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'local_provider'::app_role)
  AND has_active_consent(get_provider_id_for_user(auth.uid()), patients.id)
);

-- 3. Deny all other access by default (this ensures no gaps)
CREATE POLICY "Deny unauthorized access to patients"
ON public.patients
FOR ALL
USING (false)
WITH CHECK (false);