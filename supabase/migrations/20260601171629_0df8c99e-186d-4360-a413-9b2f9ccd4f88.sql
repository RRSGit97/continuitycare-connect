
-- Fix: Remove permissive ALL policies that grant full access to all authenticated users
-- Replace with RESTRICTIVE policies that only deny anonymous, preserving the role-scoped policies

-- audit_logs
DROP POLICY IF EXISTS "Block anonymous access to audit_logs" ON public.audit_logs;
CREATE POLICY "Require authentication for audit_logs"
ON public.audit_logs AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- episodes_of_care
DROP POLICY IF EXISTS "Block anonymous access to episodes" ON public.episodes_of_care;
CREATE POLICY "Require authentication for episodes"
ON public.episodes_of_care AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- care_plans
DROP POLICY IF EXISTS "Block anonymous access to care_plans" ON public.care_plans;
CREATE POLICY "Require authentication for care_plans"
ON public.care_plans AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- adherence_logs
DROP POLICY IF EXISTS "Block anonymous access to adherence_logs" ON public.adherence_logs;
CREATE POLICY "Require authentication for adherence_logs"
ON public.adherence_logs AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- tele_visits
DROP POLICY IF EXISTS "Block anonymous access to tele_visits" ON public.tele_visits;
CREATE POLICY "Require authentication for tele_visits"
ON public.tele_visits AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- attachments
DROP POLICY IF EXISTS "Block anonymous access to attachments" ON public.attachments;
CREATE POLICY "Require authentication for attachments"
ON public.attachments AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- bookings
DROP POLICY IF EXISTS "Block anonymous access to bookings" ON public.bookings;
CREATE POLICY "Require authentication for bookings"
ON public.bookings AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- messages
DROP POLICY IF EXISTS "Block anonymous access to messages" ON public.messages;
CREATE POLICY "Require authentication for messages"
ON public.messages AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- consent_records
DROP POLICY IF EXISTS "Block anonymous access to consent_records" ON public.consent_records;
CREATE POLICY "Require authentication for consent_records"
ON public.consent_records AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- providers
DROP POLICY IF EXISTS "Block anonymous access to providers" ON public.providers;
CREATE POLICY "Require authentication for providers"
ON public.providers AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- care_plan_templates
DROP POLICY IF EXISTS "Block anonymous access to templates" ON public.care_plan_templates;
CREATE POLICY "Require authentication for templates"
ON public.care_plan_templates AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- profiles: replace broken deny policy with effective restrictive policy
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;
CREATE POLICY "Require authentication for profiles"
ON public.profiles AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- user_roles: lock down inserts/updates/deletes to admins only via restrictive policy
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify user_roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));
