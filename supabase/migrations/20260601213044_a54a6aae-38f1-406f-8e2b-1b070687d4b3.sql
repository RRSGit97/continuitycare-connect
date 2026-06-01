-- Force handle_new_user to always assign 'patient' role, ignoring client metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Always default to 'patient'. Privileged roles must be granted by an admin.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'patient');

  INSERT INTO public.patients (user_id) VALUES (new.id);

  RETURN new;
END;
$function$;

-- Revoke EXECUTE on SECURITY DEFINER helper functions from public roles.
-- These are called from RLS policies (which run as the policy's table owner) and
-- do not need to be invokable directly by anon/authenticated users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_patient_id_for_user(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_provider_id_for_user(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_active_consent(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_log_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated, public;