import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, LogOut, User, Shield, Stethoscope, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RoleBasedNav = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const getDashboardPath = () => {
    const dashboardMap: Record<string, string> = {
      patient: '/dashboard/patient',
      specialist: '/dashboard/specialist',
      local_provider: '/dashboard/provider',
      admin: '/dashboard/admin'
    };
    return role ? dashboardMap[role] : '/';
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'patient':
        return <User className="h-4 w-4" />;
      case 'specialist':
        return <Stethoscope className="h-4 w-4" />;
      case 'local_provider':
        return <Users className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      patient: 'Patient',
      specialist: 'Specialist',
      local_provider: 'Local Provider',
      admin: 'Administrator'
    };
    return role ? labels[role] : 'User';
  };

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">ContinuityLink</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(getDashboardPath())}
          >
            Dashboard
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {getRoleIcon()}
                {getRoleLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              {role === 'admin' && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/consent')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Consent Management
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default RoleBasedNav;
