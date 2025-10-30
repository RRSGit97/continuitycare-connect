-- Add CSAT rating to tele_visits table
ALTER TABLE public.tele_visits
ADD COLUMN csat_rating integer CHECK (csat_rating >= 1 AND csat_rating <= 5);

COMMENT ON COLUMN public.tele_visits.csat_rating IS 'Customer satisfaction rating (1-5) collected after visit completion';