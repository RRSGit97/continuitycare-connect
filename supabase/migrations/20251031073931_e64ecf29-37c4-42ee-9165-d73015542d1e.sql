-- Drop the permissive audit_logs INSERT policy
DROP POLICY IF EXISTS "Only service role can insert audit logs" ON public.audit_logs;

-- Create a new restrictive policy that prevents direct inserts
-- Audit logs should only be inserted via triggers
CREATE POLICY "Prevent direct audit log inserts"
ON public.audit_logs
FOR INSERT
WITH CHECK (false);

-- Add audit triggers to key tables
-- These triggers will use the existing audit_log_changes() function

-- Patients table
DROP TRIGGER IF EXISTS audit_patients_changes ON public.patients;
CREATE TRIGGER audit_patients_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Providers table
DROP TRIGGER IF EXISTS audit_providers_changes ON public.providers;
CREATE TRIGGER audit_providers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Episodes of care table
DROP TRIGGER IF EXISTS audit_episodes_changes ON public.episodes_of_care;
CREATE TRIGGER audit_episodes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.episodes_of_care
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Care plans table
DROP TRIGGER IF EXISTS audit_care_plans_changes ON public.care_plans;
CREATE TRIGGER audit_care_plans_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Bookings table
DROP TRIGGER IF EXISTS audit_bookings_changes ON public.bookings;
CREATE TRIGGER audit_bookings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Consent records table
DROP TRIGGER IF EXISTS audit_consent_changes ON public.consent_records;
CREATE TRIGGER audit_consent_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.consent_records
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Messages table
DROP TRIGGER IF EXISTS audit_messages_changes ON public.messages;
CREATE TRIGGER audit_messages_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Adherence logs table
DROP TRIGGER IF EXISTS audit_adherence_changes ON public.adherence_logs;
CREATE TRIGGER audit_adherence_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.adherence_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();