import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import RoleBasedNav from "@/components/RoleBasedNav";
import { 
  Activity, 
  FileText, 
  Heart, 
  AlertCircle, 
  MessageSquare,
  Loader2,
  CheckCircle2,
  Clock
} from "lucide-react";

const ProviderDashboard = () => {
  const { userId, role } = useUserRole();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [patientsWithConsent, setPatientsWithConsent] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [carePlan, setCarePlan] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (userId && role === "local_provider") {
      loadPatientsWithConsent();
    }
  }, [userId, role]);

  const loadPatientsWithConsent = async () => {
    try {
      setLoading(true);

      // Get provider ID
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!provider) return;

      // Get all active consent records
      const { data: consents, error } = await supabase
        .from("consent_records")
        .select(`
          id,
          patient_id,
          accepted,
          expires_at,
          patients!inner (
            id,
            user_id,
            profiles!inner (
              full_name,
              email
            )
          )
        `)
        .eq("provider_id", provider.id)
        .eq("accepted", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) throw error;

      setPatientsWithConsent(consents || []);
    } catch (error) {
      console.error("Error loading patients:", error);
      toast({
        title: "Error",
        description: "Failed to load patients with consent",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPatientData = async (patientId: string) => {
    try {
      setLoading(true);

      // Get latest episode
      const { data: episode } = await supabase
        .from("episodes_of_care")
        .select(`
          *,
          providers:specialist_id (
            id,
            user_id,
            profiles:user_id (
              full_name,
              email
            )
          )
        `)
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (episode) {
        // Get latest care plan
        const { data: plan } = await supabase
          .from("care_plans")
          .select("*")
          .eq("episode_id", episode.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setCarePlan(plan);

        // Get recent vitals (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: vitalData } = await supabase
          .from("adherence_logs")
          .select("*")
          .eq("patient_id", patientId)
          .gte("log_date", sevenDaysAgo.toISOString().split("T")[0])
          .order("log_date", { ascending: false })
          .limit(10);

        setVitals(vitalData || []);

        // Get discharge summary attachments
        const { data: attachmentData } = await supabase
          .from("attachments")
          .select("*")
          .eq("episode_id", episode.id)
          .in("attachment_type", ["clinical_summary", "discharge_summary"])
          .order("created_at", { ascending: false });

        setAttachments(attachmentData || []);
      }

      setSelectedPatient(
        patientsWithConsent.find((p) => p.patient_id === patientId)
      );
    } catch (error) {
      console.error("Error loading patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendUpdateRequest = async () => {
    if (!selectedPatient || !messageBody.trim()) return;

    try {
      setSendingMessage(true);

      // Get latest episode to find specialist
      const { data: episode } = await supabase
        .from("episodes_of_care")
        .select(`
          id,
          providers:specialist_id (
            user_id
          )
        `)
        .eq("patient_id", selectedPatient.patient_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!episode?.providers?.user_id) {
        toast({
          title: "Error",
          description: "No specialist found for this patient",
          variant: "destructive",
        });
        return;
      }

      // Send message
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: episode.providers.user_id,
        patient_id: selectedPatient.patient_id,
        episode_id: episode.id,
        subject: messageSubject || "Update request from local provider",
        body: messageBody,
      });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Update request has been sent to the specialist",
      });

      setMessageSubject("");
      setMessageBody("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send update request",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading && !selectedPatient) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Local Provider Portal</h1>
          <p className="text-muted-foreground">
            View patient data with active consent
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Patient List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Patients with Consent</CardTitle>
              <CardDescription>
                {patientsWithConsent.length} patient(s) authorized
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientsWithConsent.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No patients have granted you access yet
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {patientsWithConsent.map((patient) => (
                    <Button
                      key={patient.patient_id}
                      variant={
                        selectedPatient?.patient_id === patient.patient_id
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => loadPatientData(patient.patient_id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{patient.patients.profiles.full_name}</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Data */}
          {selectedPatient ? (
            <div className="md:col-span-2 space-y-6">
              {/* Care Plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Care Plan</CardTitle>
                      <CardDescription>
                        Latest approved recovery plan
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Update from Specialist</DialogTitle>
                          <DialogDescription>
                            Send a message to the specialist regarding{" "}
                            {selectedPatient.patients.profiles.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject (optional)</Label>
                            <input
                              id="subject"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              placeholder="Update request"
                              value={messageSubject}
                              onChange={(e) => setMessageSubject(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                              id="message"
                              placeholder="Please provide an update on the patient's progress..."
                              value={messageBody}
                              onChange={(e) => setMessageBody(e.target.value)}
                              rows={6}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={sendUpdateRequest}
                          disabled={!messageBody.trim() || sendingMessage}
                          className="w-full"
                        >
                          {sendingMessage && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Send Request
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {carePlan ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">{carePlan.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {carePlan.description}
                        </p>
                      </div>
                      {carePlan.instructions && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Instructions</h4>
                          <p className="text-sm text-muted-foreground">
                            {carePlan.instructions}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(carePlan.created_at).toLocaleDateString()}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          {carePlan.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No active care plan available
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Recent Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Vitals (Last 7 Days)
                  </CardTitle>
                  <CardDescription>Read-only patient vitals data</CardDescription>
                </CardHeader>
                <CardContent>
                  {vitals.length > 0 ? (
                    <div className="space-y-3">
                      {vitals.map((vital) => (
                        <div
                          key={vital.id}
                          className="p-3 border rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {new Date(vital.log_date).toLocaleDateString()}
                            </span>
                            <Heart className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {vital.bp_systolic && vital.bp_diastolic && (
                              <div>
                                <span className="text-muted-foreground">BP: </span>
                                <span className="font-medium">
                                  {vital.bp_systolic}/{vital.bp_diastolic}
                                </span>
                              </div>
                            )}
                            {vital.heart_rate && (
                              <div>
                                <span className="text-muted-foreground">HR: </span>
                                <span className="font-medium">{vital.heart_rate}</span>
                              </div>
                            )}
                            {vital.spo2 && (
                              <div>
                                <span className="text-muted-foreground">SpO2: </span>
                                <span className="font-medium">{vital.spo2}%</span>
                              </div>
                            )}
                            {vital.pain_level && (
                              <div>
                                <span className="text-muted-foreground">Pain: </span>
                                <span className="font-medium">{vital.pain_level}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No recent vitals recorded</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Discharge Summaries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Clinical Documents
                  </CardTitle>
                  <CardDescription>
                    Discharge summaries and clinical notes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {attachments.length > 0 ? (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{attachment.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {attachment.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {new Date(attachment.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No clinical documents available
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="md:col-span-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Select a patient to view their information
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
