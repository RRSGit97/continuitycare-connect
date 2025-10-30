import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNav from "@/components/RoleBasedNav";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface ConsentRecord {
  id: string;
  patient_id: string;
  version: string;
  accepted: boolean;
  signed_at: string | null;
  locale: string;
  expires_at: string | null;
  patients: {
    user_id: string;
  };
  patient_profile?: {
    full_name: string;
    email: string;
  };
}

export default function AdminConsent() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConsents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consent_records')
        .select(`
          *,
          patients!inner (
            user_id
          )
        `)
        .is('provider_id', null)
        .order('signed_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data) {
        const userIds = data.map(c => c.patients.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        const enrichedData = data.map(consent => ({
          ...consent,
          patient_profile: profileMap.get(consent.patients.user_id)
        }));

        setConsents(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching consents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch consent records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async (consentId: string) => {
    try {
      // Mark consent as expired by setting expires_at to now
      const { error } = await supabase
        .from('consent_records')
        .update({ expires_at: new Date().toISOString() })
        .eq('id', consentId);

      if (error) throw error;

      toast({
        title: "Consent Revoked",
        description: "The consent has been marked as inactive",
      });

      fetchConsents();
    } catch (error) {
      console.error('Error revoking consent:', error);
      toast({
        title: "Error",
        description: "Failed to revoke consent",
        variant: "destructive",
      });
    }
  };

  const isActive = (consent: ConsentRecord) => {
    if (!consent.accepted) return false;
    if (!consent.expires_at) return true;
    return new Date(consent.expires_at) > new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNav />
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Consent Management</CardTitle>
            <CardDescription>
              View and manage patient consent records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Signed At</TableHead>
                    <TableHead>Locale</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No consent records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    consents.map((consent) => (
                      <TableRow key={consent.id}>
                        <TableCell className="font-medium">
                          {consent.patient_profile?.full_name || 'N/A'}
                        </TableCell>
                        <TableCell>{consent.patient_profile?.email || 'N/A'}</TableCell>
                        <TableCell>
                          {consent.accepted ? (
                            isActive(consent) ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Expired
                              </Badge>
                            )
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Declined
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{consent.version}</TableCell>
                        <TableCell>
                          {consent.signed_at
                            ? new Date(consent.signed_at).toLocaleString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{consent.locale}</TableCell>
                        <TableCell>
                          {consent.accepted && isActive(consent) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke Consent?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark the consent as inactive. The user will be
                                    required to accept consent again on their next login.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRevoke(consent.id)}
                                  >
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
