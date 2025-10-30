-- Extend profiles table with additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale text default 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mfa_enabled boolean default false;

-- Create patients table
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  date_of_birth date,
  gender text,
  blood_type text,
  allergies text[],
  medical_conditions text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create providers table
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specialty text NOT NULL,
  license_number text,
  license_country text,
  years_of_experience integer,
  languages text[],
  bio text,
  consultation_fee numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create episodes_of_care table
CREATE TABLE public.episodes_of_care (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  specialist_id uuid REFERENCES public.providers(id) NOT NULL,
  surgery_type text NOT NULL,
  surgery_date date NOT NULL,
  surgery_location text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  expected_recovery_weeks integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.episodes_of_care ENABLE ROW LEVEL SECURITY;

-- Create care_plans table
CREATE TABLE public.care_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid REFERENCES public.episodes_of_care(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  instructions text,
  medications jsonb,
  exercises jsonb,
  dietary_restrictions text[],
  follow_up_schedule jsonb,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;

-- Create adherence_logs table
CREATE TABLE public.adherence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id uuid REFERENCES public.care_plans(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  medication_taken boolean,
  exercises_completed boolean,
  pain_level integer CHECK (pain_level BETWEEN 0 AND 10),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.adherence_logs ENABLE ROW LEVEL SECURITY;

-- Create consent_records table
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES public.providers(id),
  version text NOT NULL,
  consent_text text NOT NULL,
  accepted boolean NOT NULL DEFAULT false,
  signed_at timestamp with time zone,
  ip_address inet,
  locale text DEFAULT 'en',
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Create tele_visits table
CREATE TABLE public.tele_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid REFERENCES public.episodes_of_care(id) ON DELETE CASCADE NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_url text,
  notes text,
  recording_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tele_visits ENABLE ROW LEVEL SECURITY;

-- Create attachments table
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid REFERENCES public.episodes_of_care(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  description text,
  attachment_type text CHECK (attachment_type IN ('medical_report', 'lab_result', 'image', 'prescription', 'other')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES public.providers(id) NOT NULL,
  episode_id uuid REFERENCES public.episodes_of_care(id),
  booking_date timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Add updated_at triggers
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes_of_care
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON public.care_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_tele_visits_updated_at BEFORE UPDATE ON public.tele_visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();