import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, MessageCircle, FileCheck, AlertCircle } from "lucide-react";

const ProviderDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Local Provider Portal</h1>
          <Button variant="outline" size="sm">Profile</Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Care Coordination</h2>
          <p className="text-muted-foreground">Support post-operative international patients locally</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <UserCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Assigned Patients</CardTitle>
              <CardDescription>Monitor local care coordination</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Patients</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <MessageCircle className="h-8 w-8 text-secondary mb-2" />
              <CardTitle>Specialist Communication</CardTitle>
              <CardDescription>Coordinate with treating specialists</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Messages</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <FileCheck className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Care Protocols</CardTitle>
              <CardDescription>Review treatment plans and instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Protocols</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <CardTitle>Urgent Updates</CardTitle>
              <CardDescription>Report patient status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Submit Update</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
