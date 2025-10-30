-- Block all anonymous access to sensitive tables
CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to patients"
  ON public.patients FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to providers"
  ON public.providers FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to episodes"
  ON public.episodes_of_care FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to care_plans"
  ON public.care_plans FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to adherence_logs"
  ON public.adherence_logs FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to consent_records"
  ON public.consent_records FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to tele_visits"
  ON public.tele_visits FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to attachments"
  ON public.attachments FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to bookings"
  ON public.bookings FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Block anonymous access to audit_logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'authenticated');