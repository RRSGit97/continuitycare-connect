import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, FileText, ClipboardList } from "lucide-react";
import RoleBasedNav from "@/components/RoleBasedNav";

const SpecialistDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Clinical Dashboard</h2>
          <p className="text-muted-foreground">Manage patient care and consultations</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Active Patients</CardTitle>
              <CardDescription>View and manage patient caseload</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Patients</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Calendar className="h-8 w-8 text-secondary mb-2" />
              <CardTitle>Consultation Schedule</CardTitle>
              <CardDescription>Manage appointments and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Schedule</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <ClipboardList className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Clinical Notes</CardTitle>
              <CardDescription>Document patient progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Add Note</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Treatment Plans</CardTitle>
              <CardDescription>Create and update care protocols</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Manage Plans</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SpecialistDashboard;
