-- Helper function to get patient_id for current user
CREATE OR REPLACE FUNCTION public.get_patient_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.patients WHERE user_id = _user_id;
$$;

-- Helper function to get provider_id for current user
CREATE OR REPLACE FUNCTION public.get_provider_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.providers WHERE user_id = _user_id;
$$;

-- Helper function to check if provider has active consent from patient
CREATE OR REPLACE FUNCTION public.has_active_consent(_provider_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consent_records
    WHERE patient_id = _patient_id
      AND provider_id = _provider_id
      AND accepted = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- RLS Policies for patients table
CREATE POLICY "Patients can view their own record"
  ON public.patients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Patients can update their own record"
  ON public.patients FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all patients"
  ON public.patients FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all patients"
  ON public.patients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for providers table
CREATE POLICY "Providers can view their own record"
  ON public.providers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Providers can update their own record"
  ON public.providers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all providers"
  ON public.providers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all providers"
  ON public.providers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view provider profiles"
  ON public.providers FOR SELECT
  USING (true);

-- RLS Policies for episodes_of_care
CREATE POLICY "Patients can view their own episodes"
  ON public.episodes_of_care FOR SELECT
  USING (patient_id = public.get_patient_id_for_user(auth.uid()));

CREATE POLICY "Specialists can view assigned episodes"
  ON public.episodes_of_care FOR SELECT
  USING (specialist_id = public.get_provider_id_for_user(auth.uid()));

CREATE POLICY "Specialists can update assigned episodes"
  ON public.episodes_of_care FOR UPDATE
  USING (specialist_id = public.get_provider_id_for_user(auth.uid()));

CREATE POLICY "Specialists can create episodes"
  ON public.episodes_of_care FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'specialist') AND
    specialist_id = public.get_provider_id_for_user(auth.uid())
  );

CREATE POLICY "Local providers can view with consent"
  ON public.episodes_of_care FOR SELECT
  USING (
    public.has_role(auth.uid(), 'local_provider') AND
    public.has_active_consent(public.get_provider_id_for_user(auth.uid()), patient_id)
  );

CREATE POLICY "Admins can manage all episodes"
  ON public.episodes_of_care FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for care_plans
CREATE POLICY "Patients can view their care plans"
  ON public.care_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = care_plans.episode_id
        AND e.patient_id = public.get_patient_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Specialists can manage care plans for their episodes"
  ON public.care_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = care_plans.episode_id
        AND e.specialist_id = public.get_provider_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Local providers can view care plans with consent"
  ON public.care_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = care_plans.episode_id
        AND public.has_active_consent(public.get_provider_id_for_user(auth.uid()), e.patient_id)
    )
  );

CREATE POLICY "Admins can manage all care plans"
  ON public.care_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for adherence_logs
CREATE POLICY "Patients can manage their adherence logs"
  ON public.adherence_logs FOR ALL
  USING (patient_id = public.get_patient_id_for_user(auth.uid()));

CREATE POLICY "Specialists can view adherence for their episodes"
  ON public.adherence_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_plans cp
      JOIN public.episodes_of_care e ON e.id = cp.episode_id
      WHERE cp.id = adherence_logs.care_plan_id
        AND e.specialist_id = public.get_provider_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Local providers can view adherence with consent"
  ON public.adherence_logs FOR SELECT
  USING (
    public.has_role(auth.uid(), 'local_provider') AND
    public.has_active_consent(public.get_provider_id_for_user(auth.uid()), patient_id)
  );

CREATE POLICY "Admins can manage all adherence logs"
  ON public.adherence_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for consent_records
CREATE POLICY "Patients can manage their consent records"
  ON public.consent_records FOR ALL
  USING (patient_id = public.get_patient_id_for_user(auth.uid()));

CREATE POLICY "Providers can view consent records related to them"
  ON public.consent_records FOR SELECT
  USING (provider_id = public.get_provider_id_for_user(auth.uid()));

CREATE POLICY "Admins can manage all consent records"
  ON public.consent_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tele_visits
CREATE POLICY "Patients can view their tele visits"
  ON public.tele_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = tele_visits.episode_id
        AND e.patient_id = public.get_patient_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Specialists can manage tele visits for their episodes"
  ON public.tele_visits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = tele_visits.episode_id
        AND e.specialist_id = public.get_provider_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Admins can manage all tele visits"
  ON public.tele_visits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attachments
CREATE POLICY "Patients can view attachments for their episodes"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = attachments.episode_id
        AND e.patient_id = public.get_patient_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Specialists can manage attachments for their episodes"
  ON public.attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = attachments.episode_id
        AND e.specialist_id = public.get_provider_id_for_user(auth.uid())
    )
  );

CREATE POLICY "Local providers can view attachments with consent"
  ON public.attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.episodes_of_care e
      WHERE e.id = attachments.episode_id
        AND public.has_active_consent(public.get_provider_id_for_user(auth.uid()), e.patient_id)
    )
  );

CREATE POLICY "Admins can manage all attachments"
  ON public.attachments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookings
CREATE POLICY "Patients can manage their bookings"
  ON public.bookings FOR ALL
  USING (patient_id = public.get_patient_id_for_user(auth.uid()));

CREATE POLICY "Providers can view their bookings"
  ON public.bookings FOR SELECT
  USING (provider_id = public.get_provider_id_for_user(auth.uid()));

CREATE POLICY "Providers can update their bookings"
  ON public.bookings FOR UPDATE
  USING (provider_id = public.get_provider_id_for_user(auth.uid()));

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);