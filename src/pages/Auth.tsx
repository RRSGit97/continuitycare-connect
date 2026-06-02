import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = "patient" | "specialist" | "local_provider" | "admin";

type DemoUser = {
  label: string;
  email: string;
  password: string;
  role: UserRole;
};

const demoUsers: DemoUser[] = [
  { label: "Patient A", email: "patient-a@test.com", password: "password123", role: "patient" },
  { label: "Patient B", email: "patient-b@test.com", password: "password123", role: "patient" },
  { label: "Specialist", email: "specialist@test.com", password: "password123", role: "specialist" },
  { label: "Local Provider", email: "local-provider@test.com", password: "password123", role: "local_provider" },
  { label: "Admin", email: "admin@test.com", password: "password123", role: "admin" },
];

const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV;

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        redirectToDashboard(session.user.id);
      }
    };
    checkSession();
  }, []);

  const redirectToDashboard = async (userId: string) => {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (userRoles && userRoles.length > 0) {
      const userRole = userRoles[0].role;
      const dashboardMap: Record<string, string> = {
        patient: '/dashboard/patient',
        specialist: '/dashboard/specialist',
        local_provider: '/dashboard/provider',
        admin: '/dashboard/admin'
      };
      navigate(dashboardMap[userRole] || '/');
    }
  };

  const selectDemoUser = (demoUser: DemoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        redirectToDashboard(data.user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message || "Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Welcome to ContinuityLink. Redirecting to your dashboard...",
        });
        redirectToDashboard(data.user.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">ContinuityLink</CardTitle>
          <CardDescription>Post-operative tele-care for international patients</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                {SHOW_DEMO_ACCOUNTS && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium">Demo accounts</p>
                    <p className="text-xs text-muted-foreground">
                      Select a role to autofill demo credentials, then click Sign In.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {demoUsers.map((demoUser) => (
                      <Button
                        key={demoUser.email}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => selectDemoUser(demoUser)}
                        className="justify-start text-xs"
                      >
                        {demoUser.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Shared password: <span className="font-mono">password123</span>
                  </p>
                </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  New accounts are created as patients. Specialist, provider, and admin
                  roles must be granted by an administrator.
                </p>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
