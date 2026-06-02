GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_id_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_provider_id_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_consent(uuid, uuid) TO authenticated;