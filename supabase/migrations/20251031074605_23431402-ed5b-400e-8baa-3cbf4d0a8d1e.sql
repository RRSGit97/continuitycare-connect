-- Drop the policy that allows users to view their own audit logs
-- This prevents indirect exposure of sensitive data through audit trails
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

-- Keep only the admin policy - audit logs should be admin-only
-- The "Admins can view all audit logs" policy already exists and will remain

-- Add a comment to document this security decision
COMMENT ON TABLE public.audit_logs IS 'Audit logs contain sensitive system activity and data changes. Access is restricted to administrators only to prevent indirect data exposure through audit trails.';