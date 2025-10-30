-- Add vitals fields to adherence_logs table
ALTER TABLE public.adherence_logs 
ADD COLUMN IF NOT EXISTS bp_systolic integer,
ADD COLUMN IF NOT EXISTS bp_diastolic integer,
ADD COLUMN IF NOT EXISTS heart_rate integer,
ADD COLUMN IF NOT EXISTS spo2 integer,
ADD COLUMN IF NOT EXISTS symptom_description text,
ADD COLUMN IF NOT EXISTS symptom_severity text;