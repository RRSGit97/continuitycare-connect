import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import RoleBasedNav from "@/components/RoleBasedNav";
import { TemplatesList } from "@/components/specialist/TemplatesList";
import { AssignPlanDialog } from "@/components/specialist/AssignPlanDialog";
import { PlanTimelineEditor } from "@/components/specialist/PlanTimelineEditor";
import { EpisodesWithVisitLinks } from "@/components/specialist/EpisodesWithVisitLinks";
import { Loader2, ClipboardList, Users, FileText } from "lucide-react";

const SpecialistDashboard = () => {
  const { userId } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get provider ID
      const { data: provider } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!provider) return;

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("care_plan_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Fetch episodes for this specialist
      const { data: episodesData, error: episodesError } = await supabase
        .from("episodes_of_care")
        .select(`
          *,
          patients!inner (
            id,
            user_id
          )
        `)
        .eq("specialist_id", provider.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (episodesError) throw episodesError;

      // Fetch profiles separately
      const episodesWithProfiles = await Promise.all(
        (episodesData || []).map(async (episode: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", episode.patients.user_id)
            .single();

          return {
            ...episode,
            patients: {
              ...episode.patients,
              profiles: profile,
            },
          };
        })
      );

      setEpisodes(episodesWithProfiles);

      // Fetch care plans for this specialist
      const { data: plansData, error: plansError } = await supabase
        .from("care_plans")
        .select(`
          *,
          episodes_of_care!inner (
            specialist_id,
            patient_id
          )
        `)
        .eq("episodes_of_care.specialist_id", provider.id)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;
      setCarePlans(plansData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load specialist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setAssignDialogOpen(true);
  };

  const handleAssignSuccess = () => {
    fetchData();
    setActiveTab("plans");
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Specialist Console</h2>
          <p className="text-muted-foreground">Manage care plan templates and patient assignments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="episodes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Episodes
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Care Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <TemplatesList
              templates={templates}
              onSelectTemplate={handleSelectTemplate}
              onCreateNew={() => toast({ title: "Coming soon", description: "Template creation UI" })}
            />
          </TabsContent>

          <TabsContent value="episodes" className="mt-6">
            <EpisodesWithVisitLinks episodes={episodes} />
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <div className="space-y-6">
              {carePlans.map((plan) => (
                <PlanTimelineEditor key={plan.id} carePlan={plan} onUpdate={fetchData} />
              ))}
              {carePlans.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No care plans created yet. Assign a template to get started.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <AssignPlanDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          template={selectedTemplate}
          episodes={episodes}
          onSuccess={handleAssignSuccess}
        />
      </main>
    </div>
  );
};

export default SpecialistDashboard;
