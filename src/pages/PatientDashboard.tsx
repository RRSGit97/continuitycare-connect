import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, MessageSquare, User, Video } from "lucide-react";

const PatientDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Patient Portal</h1>
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground">Manage your post-operative care and appointments</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Video className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Upcoming Consultations</CardTitle>
              <CardDescription>Schedule and join video calls</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Schedule</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 text-secondary mb-2" />
              <CardTitle>Medical Records</CardTitle>
              <CardDescription>Access your treatment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Records</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communicate with your care team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Open Messages</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CalendarDays className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Care Plan</CardTitle>
              <CardDescription>Track your recovery progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Plan</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
