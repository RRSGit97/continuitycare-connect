import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import RoleBasedNav from "@/components/RoleBasedNav";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const TeleVisit = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const episodeId = searchParams.get("episode");
  const { userId, role } = useUserRole();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [canJoin, setCanJoin] = useState(false);
  const [episode, setEpisode] = useState<any>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  
  // Pre-join checks
  const [preJoinStage, setPreJoinStage] = useState(true);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [camPermission, setCamPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // In-visit state
  const [inVisit, setInVisit] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [visitStartTime, setVisitStartTime] = useState<Date | null>(null);

  // Post-visit summary state
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  useEffect(() => {
    if (userId && episodeId) {
      checkAccess();
    }
  }, [userId, episodeId]);

  const checkAccess = async () => {
    try {
      setLoading(true);

      // Fetch episode details
      const { data: episodeData, error: episodeError } = await supabase
        .from("episodes_of_care")
        .select(`
          *,
          patients!inner (
            id,
            user_id
          ),
          providers:specialist_id (
            id,
            user_id
          )
        `)
        .eq("id", episodeId)
        .single();

      if (episodeError) throw episodeError;

      setEpisode(episodeData);

      // RBAC: Check if user is either the assigned specialist or the patient
      const isPatient = episodeData.patients.user_id === userId;
      const isSpecialist = episodeData.providers?.user_id === userId;

      if (!isPatient && !isSpecialist) {
        toast({
          title: "Access Denied",
          description: "You are not authorized to join this tele-visit",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setCanJoin(true);
    } catch (error) {
      console.error("Error checking access:", error);
      toast({
        title: "Error",
        description: "Failed to verify access permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDevicePermissions = async () => {
    try {
      // Request camera and microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setMicPermission(true);
      setCamPermission(true);
      setStream(mediaStream);

      // Show preview in video element
      const videoElement = document.getElementById("preview-video") as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = mediaStream;
      }

      toast({
        title: "Devices Ready",
        description: "Camera and microphone are working correctly",
      });
    } catch (error) {
      console.error("Device permission error:", error);
      
      // Check specific permissions
      try {
        const permissions = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName })
        ]);

        setCamPermission(permissions[0].state === 'granted');
        setMicPermission(permissions[1].state === 'granted');
      } catch (permError) {
        setMicPermission(false);
        setCamPermission(false);
      }

      toast({
        title: "Permission Error",
        description: "Please allow camera and microphone access",
        variant: "destructive",
      });
    }
  };

  const startVisit = async () => {
    if (!episode) return;

    try {
      setLoading(true);

      // Create tele_visits record
      const { data: visit, error } = await supabase
        .from("tele_visits")
        .insert({
          episode_id: episode.id,
          scheduled_at: new Date().toISOString(),
          status: "in_progress",
          meeting_url: `mock://visit-${episode.id}-${Date.now()}`, // Mock token for now
          duration_minutes: 30,
        })
        .select()
        .single();

      if (error) throw error;

      setVisitId(visit.id);
      setInVisit(true);
      setPreJoinStage(false);
      setVisitStartTime(new Date());

      toast({
        title: "Visit Started",
        description: "Tele-visit session is now active",
      });
    } catch (error) {
      console.error("Error starting visit:", error);
      toast({
        title: "Error",
        description: "Failed to start tele-visit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endVisit = async () => {
    if (!visitId) return;

    try {
      setLoading(true);

      const duration = visitStartTime 
        ? Math.round((new Date().getTime() - visitStartTime.getTime()) / 60000)
        : 30;

      // Update tele_visits record
      const { error } = await supabase
        .from("tele_visits")
        .update({
          status: "completed",
          duration_minutes: duration,
        })
        .eq("id", visitId);

      if (error) throw error;

      // Stop media stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Show summary form for specialists only
      if (role === "specialist") {
        setInVisit(false);
        setShowSummaryDialog(true);
      } else {
        toast({
          title: "Visit Ended",
          description: `Session completed (${duration} minutes)`,
        });
        navigate("/dashboard/patient");
      }
    } catch (error) {
      console.error("Error ending visit:", error);
      toast({
        title: "Error",
        description: "Failed to end tele-visit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitSummary = async () => {
    if (!visitId || !episode) return;

    try {
      setLoading(true);

      // Create summary text content
      const summaryContent = `CLINICAL SUMMARY\n\nDate: ${new Date().toLocaleString()}\nEpisode: ${episode.surgery_type}\nVisit ID: ${visitId}\n\n--- Clinical Summary ---\n${clinicalSummary}\n\n--- Next Steps ---\n${nextSteps}`;
      
      const fileName = `clinical-summary-${visitId}.txt`;
      const storagePath = `summaries/${fileName}`;

      // Insert attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from("attachments")
        .insert({
          episode_id: episode.id,
          file_name: fileName,
          file_type: "text/plain",
          file_size: summaryContent.length,
          storage_path: storagePath,
          attachment_type: "clinical_summary",
          description: "Clinical summary and next steps from tele-visit",
          uploaded_by: userId,
        })
        .select()
        .single();

      if (attachmentError) throw attachmentError;

      // Log to audit_logs
      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert({
          actor_id: userId,
          action: "CREATE_CLINICAL_SUMMARY",
          entity: "tele_visits",
          entity_id: visitId,
          new_data: {
            attachment_id: attachment.id,
            clinical_summary: clinicalSummary,
            next_steps: nextSteps,
            episode_id: episode.id,
          },
        });

      if (auditError) console.error("Audit log error:", auditError);

      toast({
        title: "Summary Saved",
        description: "Clinical summary has been recorded",
      });

      navigate("/dashboard/specialist");
    } catch (error) {
      console.error("Error saving summary:", error);
      toast({
        title: "Error",
        description: "Failed to save clinical summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleCam = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !camEnabled;
      });
      setCamEnabled(!camEnabled);
    }
  };

  if (loading && !episode) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!canJoin) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedNav />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to access this tele-visit.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNav />
      
      <main className="container mx-auto px-4 py-8">
        {preJoinStage ? (
          // Pre-join screen
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tele-Visit Pre-Join Check</CardTitle>
                <CardDescription>
                  Episode: {episode?.surgery_type} - {new Date(episode?.surgery_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video Preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  <video
                    id="preview-video"
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Device Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5" />
                      <span>Microphone</span>
                    </div>
                    {micPermission === null ? (
                      <Badge variant="outline">Not checked</Badge>
                    ) : micPermission ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Blocked
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5" />
                      <span>Camera</span>
                    </div>
                    {camPermission === null ? (
                      <Badge variant="outline">Not checked</Badge>
                    ) : camPermission ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Blocked
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={checkDevicePermissions}
                    variant="outline"
                    className="flex-1"
                  >
                    Test Devices
                  </Button>
                  <Button 
                    onClick={startVisit}
                    disabled={!micPermission || !camPermission || loading}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Join Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // In-visit screen
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Tele-Visit in Progress</h2>
                <p className="text-muted-foreground">
                  {episode?.surgery_type} - {role === "specialist" ? "Patient" : "Specialist"} Consultation
                </p>
              </div>
              <Badge className="bg-red-100 text-red-800">
                <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse mr-2" />
                LIVE
              </Badge>
            </div>

            {/* Video Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <video
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (el && stream) el.srcObject = stream;
                      }}
                    />
                    <div className="absolute bottom-4 left-4">
                      <Badge>You</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {role === "specialist" ? "Patient" : "Specialist"} Video
                      </p>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="outline">
                        {role === "specialist" ? "Patient" : "Specialist"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={toggleMic}
                    variant={micEnabled ? "outline" : "destructive"}
                    size="lg"
                    className="rounded-full h-14 w-14 p-0"
                  >
                    {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={toggleCam}
                    variant={camEnabled ? "outline" : "destructive"}
                    size="lg"
                    className="rounded-full h-14 w-14 p-0"
                  >
                    {camEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={endVisit}
                    variant="destructive"
                    size="lg"
                    className="rounded-full h-14 px-8"
                    disabled={loading}
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    End Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Post-Visit Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clinical Summary</DialogTitle>
            <DialogDescription>
              Document the clinical summary and next steps for this tele-visit
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clinical-summary">Clinical Summary</Label>
              <Textarea
                id="clinical-summary"
                placeholder="Document key findings, patient status, and clinical observations..."
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next-steps">Next Steps</Label>
              <Textarea
                id="next-steps"
                placeholder="Outline follow-up actions, medications, appointments, or care plan adjustments..."
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSummaryDialog(false);
                navigate("/dashboard/specialist");
              }}
            >
              Skip
            </Button>
            <Button
              onClick={submitSummary}
              disabled={!clinicalSummary.trim() || !nextSteps.trim() || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Summary
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeleVisit;
