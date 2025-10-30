import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Users, BarChart3, Shield } from "lucide-react";
import RoleBasedNav from "@/components/RoleBasedNav";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">System Administration</h2>
          <p className="text-muted-foreground">Manage platform users and settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all platform users and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/users")}>
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-secondary mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View platform usage and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/analytics")}>
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>Audit logs and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/audit")}>
                View Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Settings className="h-8 w-8 text-primary mb-2" />
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure platform parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Configure</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
