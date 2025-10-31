-- Drop the weak anonymous access policy
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Add a restrictive default deny policy for anonymous users
-- This ensures no access before authentication is verified
CREATE POLICY "Deny all anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.role() = 'authenticated'::text AND false)
WITH CHECK (auth.role() = 'authenticated'::text AND false);

-- The existing granular policies will handle authenticated access:
-- - Users can view own profile
-- - Admins can view all profiles  
-- - Patients can view assigned specialists
-- - Specialists can view their patients
-- - Local providers can view consented patients