-- Create audit logging function
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_data jsonb;
  v_new_data jsonb;
  v_action text;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity,
    entity_id,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    v_old_data,
    v_new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create audit triggers for all sensitive tables
CREATE TRIGGER audit_patients_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_providers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_episodes_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.episodes_of_care
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_care_plans_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.care_plans
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_adherence_logs_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.adherence_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_consent_records_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_tele_visits_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tele_visits
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_attachments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.attachments
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_bookings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- Update the handle_new_user trigger to also create patient/provider records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  
  -- Assign role from metadata (or default to patient)
  v_role := coalesce((new.raw_user_meta_data->>'role')::app_role, 'patient');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role);
  
  -- Create patient or provider record based on role
  IF v_role = 'patient' THEN
    INSERT INTO public.patients (user_id)
    VALUES (new.id);
  ELSIF v_role IN ('specialist', 'local_provider') THEN
    INSERT INTO public.providers (user_id, specialty)
    VALUES (new.id, 'General');
  END IF;
  
  RETURN new;
END;
$$;