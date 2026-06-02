-- Restore EXECUTE on SECURITY DEFINER helper functions used inside RLS policies.
-- Without EXECUTE for `authenticated`, policies that call has_role / get_*_id_for_user
-- error out and silently block legitimate queries (e.g. fetching user_roles after sign-in).

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_patient_id_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_id_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_consent(uuid, uuid) TO authenticated;
