import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Check, Clock, Edit2, Save, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Milestone {
  day: number;
  title: string;
  tasks: string[];
  notes?: string;
  goals?: string[];
  red_flags?: string[];
}

interface MilestonesData {
  vitals_required?: string[];
  days: Milestone[];
}

interface CarePlan {
  id: string;
  title: string;
  status: string;
  milestones: MilestonesData | Milestone[] | null;
  approved_at: string | null;
}

interface PlanTimelineEditorProps {
  carePlan: CarePlan;
  onUpdate: () => void;
}

export const PlanTimelineEditor = ({ carePlan, onUpdate }: PlanTimelineEditorProps) => {
  // Extract days array from milestones structure
  const getDaysArray = (milestones: MilestonesData | Milestone[] | null): Milestone[] => {
    if (!milestones) return [];
    if (Array.isArray(milestones)) return milestones;
    return (milestones as MilestonesData).days || [];
  };

  const [editing, setEditing] = useState(false);
  const [editedMilestones, setEditedMilestones] = useState<Milestone[]>(getDaysArray(carePlan.milestones));
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("care_plans")
        .update({
          milestones: {
            days: editedMilestones,
            vitals_required: (carePlan.milestones as MilestonesData)?.vitals_required || []
          } as any,
          status: "pending_approval",
        })
        .eq("id", carePlan.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timeline updated. Pending approval to publish to patient.",
      });

      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating timeline:", error);
      toast({
        title: "Error",
        description: "Failed to update timeline",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("care_plans")
        .update({
          status: "active",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", carePlan.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Care plan approved and published to patient",
      });

      onUpdate();
    } catch (error) {
      console.error("Error approving plan:", error);
      toast({
        title: "Error",
        description: "Failed to approve care plan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...editedMilestones];
    updated[index] = { ...updated[index], [field]: value };
    setEditedMilestones(updated);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      pending_approval: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || ""}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{carePlan.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(carePlan.status)}
                {carePlan.approved_at && (
                  <span className="text-xs text-muted-foreground">
                    Approved: {new Date(carePlan.approved_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!editing && carePlan.status !== "active" && (
                <>
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Timeline
                  </Button>
                  {carePlan.status === "pending_approval" && (
                    <Button onClick={handleApprove} size="sm" disabled={submitting}>
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Publish
                    </Button>
                  )}
                </>
              )}
              {editing && (
                <>
                  <Button onClick={handleSave} size="sm" disabled={submitting}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {(editing ? editedMilestones : getDaysArray(carePlan.milestones)).map((milestone, index) => (
              <AccordionItem key={index} value={`day-${milestone.day}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-semibold">Day {milestone.day}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{milestone.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {editing ? (
                      <>
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, "title", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Tasks (comma-separated)</Label>
                          <Textarea
                            value={milestone.tasks.join(", ")}
                            onChange={(e) =>
                              updateMilestone(
                                index,
                                "tasks",
                                e.target.value.split(",").map((t) => t.trim())
                              )
                            }
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            value={milestone.notes || ""}
                            onChange={(e) => updateMilestone(index, "notes", e.target.value)}
                            rows={2}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Tasks
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {milestone.tasks.map((task, i) => (
                              <li key={i} className="text-sm">{task}</li>
                            ))}
                          </ul>
                        </div>
                        {milestone.notes && (
                          <div>
                            <h4 className="font-semibold mb-2">Notes</h4>
                            <p className="text-sm text-muted-foreground">{milestone.notes}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};
