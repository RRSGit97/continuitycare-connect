-- Create messages table for provider-specialist communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes_of_care(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Block anonymous access
CREATE POLICY "Block anonymous access to messages"
ON public.messages
FOR ALL
USING (auth.role() = 'authenticated');

-- Senders can view their sent messages
CREATE POLICY "Users can view their sent messages"
ON public.messages
FOR SELECT
USING (sender_id = auth.uid());

-- Recipients can view their received messages
CREATE POLICY "Users can view their received messages"
ON public.messages
FOR SELECT
USING (recipient_id = auth.uid());

-- Local providers can send messages about their patients with consent
CREATE POLICY "Local providers can send messages with consent"
ON public.messages
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'local_provider') 
  AND sender_id = auth.uid()
  AND has_active_consent(get_provider_id_for_user(auth.uid()), patient_id)
);

-- Specialists can send messages about their patients
CREATE POLICY "Specialists can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'specialist')
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM episodes_of_care e
    WHERE e.patient_id = messages.patient_id
    AND e.specialist_id = get_provider_id_for_user(auth.uid())
  )
);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can update their messages"
ON public.messages
FOR UPDATE
USING (recipient_id = auth.uid());

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
ON public.messages
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add audit logging
CREATE TRIGGER audit_messages_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_changes();

-- Create index for performance
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_patient ON public.messages(patient_id);