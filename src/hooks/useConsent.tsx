import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConsentData {
  hasActiveConsent: boolean;
  loading: boolean;
  checkConsent: () => Promise<void>;
}

export const useConsent = (userId: string | null, patientId: string | null): ConsentData => {
  const [hasActiveConsent, setHasActiveConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkConsent = async () => {
    if (!userId || !patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('patient_id', patientId)
        .is('provider_id', null) // General platform consent
        .eq('accepted', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('signed_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      setHasActiveConsent(data && data.length > 0);
    } catch (error) {
      console.error('Error checking consent:', error);
      toast({
        title: "Error",
        description: "Failed to check consent status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConsent();
  }, [userId, patientId]);

  return { hasActiveConsent, loading, checkConsent };
};
