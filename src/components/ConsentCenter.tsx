import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ConsentCenterProps {
  patientId: string;
  onConsentAccepted: () => void;
  consentText?: string;
  consentVersion?: string;
}

const DEFAULT_CONSENT_TEXT = `# Terms of Service and Privacy Policy

## 1. Acceptance of Terms
By accessing and using ContinuityLink, you agree to be bound by these Terms of Service and our Privacy Policy.

## 2. Data Collection and Usage
We collect and process your personal health information to provide coordinated care services between international specialists and local healthcare providers.

### Information We Collect:
- Personal identification information (name, email, phone)
- Medical history and health records
- Treatment plans and care notes
- Communication logs between healthcare providers

### How We Use Your Data:
- Facilitate communication between your healthcare team
- Maintain accurate medical records
- Provide telemedicine services
- Ensure continuity of care across providers

## 3. Data Protection
- Your data is encrypted in transit and at rest
- Access is restricted based on role-based permissions
- All data access is logged for audit purposes
- We comply with international healthcare data protection regulations

## 4. Your Rights
You have the right to:
- Access your personal data
- Request corrections to your data
- Revoke consent at any time
- Export your medical records

## 5. Data Sharing
Your data is shared only with:
- Assigned healthcare specialists
- Local healthcare providers (with your explicit consent)
- System administrators for support purposes

## 6. Consent Duration
This consent remains active until you revoke it. You may revoke consent at any time through your account settings or by contacting support.

By clicking "I Accept", you acknowledge that you have read, understood, and agree to these terms.`;

export const ConsentCenter = ({ 
  patientId, 
  onConsentAccepted,
  consentText = DEFAULT_CONSENT_TEXT,
  consentVersion = "1.0"
}: ConsentCenterProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      // Get user's locale
      const locale = navigator.language || 'en';
      
      // Note: IP address will be captured by the audit trigger
      const { error } = await supabase
        .from('consent_records')
        .insert({
          patient_id: patientId,
          provider_id: null, // General platform consent
          version: consentVersion,
          consent_text: consentText,
          accepted: true,
          signed_at: new Date().toISOString(),
          locale: locale,
        });

      if (error) throw error;

      toast({
        title: "Consent Accepted",
        description: "Thank you for accepting our terms and privacy policy.",
      });

      onConsentAccepted();
    } catch (error) {
      console.error('Error accepting consent:', error);
      toast({
        title: "Error",
        description: "Failed to record consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      const locale = navigator.language || 'en';
      
      await supabase
        .from('consent_records')
        .insert({
          patient_id: patientId,
          provider_id: null,
          version: consentVersion,
          consent_text: consentText,
          accepted: false,
          signed_at: new Date().toISOString(),
          locale: locale,
        });

      toast({
        title: "Consent Declined",
        description: "You have declined the terms. You will be signed out.",
        variant: "destructive",
      });

      // Sign out the user
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 2000);
    } catch (error) {
      console.error('Error recording decline:', error);
      toast({
        title: "Error",
        description: "Failed to record your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            <CardTitle>Consent Required</CardTitle>
          </div>
          <CardDescription>
            Please review and accept our Terms of Service and Privacy Policy to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh] w-full rounded-md border p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {consentText}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isProcessing}
          >
            I Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            I Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
