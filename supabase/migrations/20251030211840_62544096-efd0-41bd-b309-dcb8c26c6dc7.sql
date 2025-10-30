-- Create care plan templates table
CREATE TABLE public.care_plan_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'CABG', 'THR', 'TKR', 'Kidney Transplant', etc.
  duration_days INTEGER NOT NULL DEFAULT 90,
  medications JSONB,
  exercises JSONB,
  milestones JSONB, -- day-by-day timeline with tasks/goals
  dietary_restrictions TEXT[],
  follow_up_schedule JSONB,
  instructions TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add fields to care_plans for workflow tracking
ALTER TABLE public.care_plans
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.care_plan_templates(id),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'active', 'archived'
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS milestones JSONB; -- patient-specific day-by-day timeline

-- Enable RLS
ALTER TABLE public.care_plan_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for care_plan_templates
CREATE POLICY "Block anonymous access to templates"
ON public.care_plan_templates
FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "Specialists can view active templates"
ON public.care_plan_templates
FOR SELECT
USING (
  has_role(auth.uid(), 'specialist') 
  AND is_active = true
);

CREATE POLICY "Specialists can create templates"
ON public.care_plan_templates
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'specialist')
  AND created_by = auth.uid()
);

CREATE POLICY "Specialists can update their templates"
ON public.care_plan_templates
FOR UPDATE
USING (
  has_role(auth.uid(), 'specialist')
  AND created_by = auth.uid()
);

CREATE POLICY "Admins can manage all templates"
ON public.care_plan_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_care_plan_templates_type ON public.care_plan_templates(template_type);
CREATE INDEX idx_care_plan_templates_active ON public.care_plan_templates(is_active);

-- Update trigger for care_plan_templates
CREATE TRIGGER update_care_plan_templates_updated_at
BEFORE UPDATE ON public.care_plan_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Audit trigger
CREATE TRIGGER audit_care_plan_templates
AFTER INSERT OR UPDATE OR DELETE ON public.care_plan_templates
FOR EACH ROW
EXECUTE FUNCTION public.audit_log_changes();