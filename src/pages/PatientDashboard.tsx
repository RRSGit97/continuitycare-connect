import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import RoleBasedNav from "@/components/RoleBasedNav";
import { ClipboardList, Activity, AlertCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const vitalsSchema = z.object({
  bp_systolic: z.number().min(60).max(250),
  bp_diastolic: z.number().min(40).max(150),
  heart_rate: z.number().min(40).max(200),
  spo2: z.number().min(70).max(100),
});

const symptomSchema = z.object({
  description: z.string().trim().min(1).max(1000),
  severity: z.enum(["mild", "moderate", "severe"]),
});

interface CarePlan {
  id: string;
  title: string;
  medications?: Array<{ name: string; dosage: string; frequency: string }>;
  exercises?: Array<{ name: string; sets?: number; reps?: number; frequency: string }>;
}

const PatientDashboard = () => {
  const { userId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [todayLog, setTodayLog] = useState<any>(null);
  
  const [vitals, setVitals] = useState({
    bp_systolic: "",
    bp_diastolic: "",
    heart_rate: "",
    spo2: "",
  });

  const [symptom, setSymptom] = useState({
    description: "",
    severity: "mild",
  });

  useEffect(() => {
    if (userId) {
      fetchPatientData();
    }
  }, [userId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Get patient ID
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!patient) return;
      setPatientId(patient.id);

      // Get active episode and care plan
      const { data: episodes } = await supabase
        .from("episodes_of_care")
        .select(`
          id,
          care_plans (
            id,
            title,
            medications,
            exercises
          )
        `)
        .eq("patient_id", patient.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (episodes && episodes.length > 0 && episodes[0].care_plans) {
        const plans = episodes[0].care_plans as any[];
        if (plans.length > 0) {
          setCarePlan(plans[0]);

          // Get today's log
          const today = new Date().toISOString().split("T")[0];
          const { data: log } = await supabase
            .from("adherence_logs")
            .select("*")
            .eq("patient_id", patient.id)
            .eq("care_plan_id", plans[0].id)
            .eq("log_date", today)
            .maybeSingle();

          setTodayLog(log);
        }
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !carePlan) return;

    try {
      setSubmitting(true);

      const vitalsData = {
        bp_systolic: parseInt(vitals.bp_systolic),
        bp_diastolic: parseInt(vitals.bp_diastolic),
        heart_rate: parseInt(vitals.heart_rate),
        spo2: parseInt(vitals.spo2),
      };

      const validation = vitalsSchema.safeParse(vitalsData);
      if (!validation.success) {
        toast({
          title: "Invalid Input",
          description: "Please check your vitals values",
          variant: "destructive",
        });
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      if (todayLog) {
        // Update existing log
        const { error } = await supabase
          .from("adherence_logs")
          .update(vitalsData)
          .eq("id", todayLog.id);

        if (error) throw error;
      } else {
        // Create new log
        const { data, error } = await supabase
          .from("adherence_logs")
          .insert({
            patient_id: patientId,
            care_plan_id: carePlan.id,
            log_date: today,
            ...vitalsData,
          })
          .select()
          .single();

        if (error) throw error;
        setTodayLog(data);
      }

      toast({
        title: "Success",
        description: "Vitals recorded successfully",
      });

      setVitals({ bp_systolic: "", bp_diastolic: "", heart_rate: "", spo2: "" });
      fetchPatientData();
    } catch (error) {
      console.error("Error saving vitals:", error);
      toast({
        title: "Error",
        description: "Failed to save vitals",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !carePlan) return;

    try {
      setSubmitting(true);

      const validation = symptomSchema.safeParse(symptom);
      if (!validation.success) {
        toast({
          title: "Invalid Input",
          description: "Please provide symptom details",
          variant: "destructive",
        });
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const symptomNote = `[${symptom.severity.toUpperCase()}] ${symptom.description}`;

      if (todayLog) {
        // Append to existing notes
        const updatedNotes = todayLog.notes
          ? `${todayLog.notes}\n${symptomNote}`
          : symptomNote;

        const { error } = await supabase
          .from("adherence_logs")
          .update({
            notes: updatedNotes,
            symptom_description: symptom.description,
            symptom_severity: symptom.severity,
          })
          .eq("id", todayLog.id);

        if (error) throw error;
      } else {
        // Create new log with symptom
        const { data, error } = await supabase
          .from("adherence_logs")
          .insert({
            patient_id: patientId,
            care_plan_id: carePlan.id,
            log_date: today,
            notes: symptomNote,
            symptom_description: symptom.description,
            symptom_severity: symptom.severity,
          })
          .select()
          .single();

        if (error) throw error;
        setTodayLog(data);
      }

      toast({
        title: "Success",
        description: "Symptom reported successfully",
      });

      setSymptom({ description: "", severity: "mild" });
      fetchPatientData();
    } catch (error) {
      console.error("Error reporting symptom:", error);
      toast({
        title: "Error",
        description: "Failed to report symptom",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Patient Dashboard</h2>
          <p className="text-muted-foreground">Track your daily recovery progress</p>
        </div>

        {!carePlan ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No active care plan found. Please contact your specialist.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Today's Tasks */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <ClipboardList className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Your daily recovery checklist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {carePlan.medications && carePlan.medications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Medications</h4>
                    <div className="space-y-2">
                      {carePlan.medications.map((med, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{med.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {med.dosage} - {med.frequency}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {carePlan.exercises && carePlan.exercises.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Exercises</h4>
                    <div className="space-y-2">
                      {carePlan.exercises.map((exercise, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {exercise.sets && exercise.reps
                                ? `${exercise.sets} sets × ${exercise.reps} reps - ${exercise.frequency}`
                                : exercise.frequency}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!carePlan.medications || carePlan.medications.length === 0) &&
                  (!carePlan.exercises || carePlan.exercises.length === 0) && (
                    <p className="text-sm text-muted-foreground">No tasks for today</p>
                  )}
              </CardContent>
            </Card>

            {/* Vitals Entry */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Activity className="h-8 w-8 text-secondary mb-2" />
                <CardTitle>Record Vitals</CardTitle>
                <CardDescription>Log your vital signs</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVitalsSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="bp_systolic" className="text-xs">BP Systolic</Label>
                      <Input
                        id="bp_systolic"
                        type="number"
                        placeholder="120"
                        value={vitals.bp_systolic}
                        onChange={(e) => setVitals({ ...vitals, bp_systolic: e.target.value })}
                        required
                        min="60"
                        max="250"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bp_diastolic" className="text-xs">BP Diastolic</Label>
                      <Input
                        id="bp_diastolic"
                        type="number"
                        placeholder="80"
                        value={vitals.bp_diastolic}
                        onChange={(e) => setVitals({ ...vitals, bp_diastolic: e.target.value })}
                        required
                        min="40"
                        max="150"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heart_rate" className="text-xs">Heart Rate</Label>
                      <Input
                        id="heart_rate"
                        type="number"
                        placeholder="72"
                        value={vitals.heart_rate}
                        onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
                        required
                        min="40"
                        max="200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spo2" className="text-xs">SpO2 (%)</Label>
                      <Input
                        id="spo2"
                        type="number"
                        placeholder="98"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                        required
                        min="70"
                        max="100"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Vitals
                  </Button>
                </form>

                {todayLog && (
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <p>Last recorded: {new Date(todayLog.created_at).toLocaleTimeString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Symptom */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <AlertCircle className="h-8 w-8 text-accent mb-2" />
                <CardTitle>Report Symptom</CardTitle>
                <CardDescription>Track any concerns</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSymptomSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select
                      value={symptom.severity}
                      onValueChange={(value) => setSymptom({ ...symptom, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your symptom..."
                      value={symptom.description}
                      onChange={(e) => setSymptom({ ...symptom, description: e.target.value })}
                      required
                      maxLength={1000}
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Report Symptom
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
