import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Episode {
  id: string;
  surgery_type: string;
  surgery_date: string;
  patients: {
    id: string;
    profiles?: {
      full_name: string | null;
      email: string;
    };
  };
}

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    medications: any;
    exercises: any;
    milestones: any;
    dietary_restrictions: string[];
    instructions: string;
  } | null;
  episodes: Episode[];
  onSuccess: () => void;
}

export const AssignPlanDialog = ({ open, onOpenChange, template, episodes, onSuccess }: AssignPlanDialogProps) => {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!template || !selectedEpisodeId) return;

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Clone template into new care plan
      const { error } = await supabase
        .from("care_plans")
        .insert({
          episode_id: selectedEpisodeId,
          template_id: template.id,
          created_by: user.id,
          title: template.name,
          description: `Care plan based on ${template.name} template`,
          instructions: template.instructions,
          medications: template.medications,
          exercises: template.exercises,
          milestones: template.milestones,
          dietary_restrictions: template.dietary_restrictions,
          status: "draft", // Requires approval before becoming active
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Care plan assigned successfully. Review and approve to activate.",
      });

      onSuccess();
      onOpenChange(false);
      setSelectedEpisodeId("");
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast({
        title: "Error",
        description: "Failed to assign care plan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Care Plan</DialogTitle>
          <DialogDescription>
            Select an episode to assign the "{template?.name}" template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="episode">Patient Episode</Label>
            <Select value={selectedEpisodeId} onValueChange={setSelectedEpisodeId}>
              <SelectTrigger id="episode">
                <SelectValue placeholder="Select an episode" />
              </SelectTrigger>
              <SelectContent>
                {episodes.map((episode) => (
                  <SelectItem key={episode.id} value={episode.id}>
                    {episode.patients.profiles?.full_name || episode.patients.profiles?.email} - {episode.surgery_type} ({new Date(episode.surgery_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedEpisodeId || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
