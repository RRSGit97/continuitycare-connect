import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface SignInTestResult {
  email: string;
  password: string;
  success: boolean;
  error?: string;
}

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testingSignIn, setTestingSignIn] = useState(false);
  const [signInResults, setSignInResults] = useState<SignInTestResult[]>([]);
  const { toast } = useToast();

  const runSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-test-data', {
        method: 'POST',
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: "Test data seeded successfully",
      });
    } catch (error) {
      console.error('Seed error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runProviderSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-provider-data', {
        method: 'POST',
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: "Local provider seeded successfully",
      });
    } catch (error) {
      console.error('Seed error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed provider data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAuditSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-audit-data', {
        method: 'POST',
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: "Audit test data generated successfully",
      });
    } catch (error) {
      console.error('Seed error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate audit data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAnalyticsSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-analytics-data', {
        method: 'POST',
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Success",
        description: "Analytics demo data generated successfully",
      });
    } catch (error) {
      console.error('Seed error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testAllSignIns = async () => {
    setTestingSignIn(true);
    setSignInResults([]);

    const testUsers = [
      { email: 'patient-a@test.com', password: 'password123' },
      { email: 'patient-b@test.com', password: 'password123' },
      { email: 'specialist@test.com', password: 'password123' },
      { email: 'local-provider@test.com', password: 'password123' },
      { email: 'admin@test.com', password: 'password123' },
      { email: 'provider-local@test.com', password: 'password123' },
    ];

    const results: SignInTestResult[] = [];

    for (const user of testUsers) {
      try {
        // Sign out first to ensure clean state
        await supabase.auth.signOut();
        
        // Try to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password,
        });

        if (error) {
          results.push({
            email: user.email,
            password: user.password,
            success: false,
            error: error.message,
          });
        } else {
          results.push({
            email: user.email,
            password: user.password,
            success: true,
          });
          // Sign out after successful test
          await supabase.auth.signOut();
        }
      } catch (error) {
        results.push({
          email: user.email,
          password: user.password,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setSignInResults(results);
    setTestingSignIn(false);

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    toast({
      title: successCount === totalCount ? "All Tests Passed" : "Some Tests Failed",
      description: `${successCount}/${totalCount} users can sign in successfully`,
      variant: successCount === totalCount ? "default" : "destructive",
    });
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Seed Test Data</CardTitle>
          <CardDescription>
            Click the button below to populate the database with test users and sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Test Users Created:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>patient-a@test.com (password: password123)</li>
              <li>patient-b@test.com (password: password123)</li>
              <li>specialist@test.com (password: password123)</li>
              <li>local-provider@test.com (password: password123)</li>
              <li>admin@test.com (password: password123)</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={runSeed} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Seeding..." : "Seed All Users"}
            </Button>
            
            <Button onClick={runProviderSeed} disabled={loading} className="flex-1" variant="outline">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Seeding..." : "Seed Local Provider Only"}
            </Button>
          </div>

          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Local Provider Test:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click "Seed Local Provider Only"</li>
              <li>Sign in as provider-local@test.com (password: password123)</li>
              <li>View Patient A data in provider portal</li>
              <li>Toggle consent off in Admin Console → Consent Management</li>
              <li>Refresh provider portal - Patient A should disappear</li>
            </ol>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">Admin Audit Testing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Generate audit log entries to test the admin dashboard features
            </p>
            <Button onClick={runAuditSeed} disabled={loading} className="w-full" variant="secondary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Generating..." : "Generate Audit Data"}
            </Button>
            <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Audit Test Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click "Generate Audit Data" above</li>
                <li>Sign in as admin@test.com (password: password123)</li>
                <li>Go to Admin Dashboard → Audit Log Explorer</li>
                <li>Filter by entity, actor, and date ranges</li>
                <li>Export audit logs to CSV</li>
                <li>Go to Monthly Compliance Report</li>
                <li>Select current month and generate report</li>
                <li>Export compliance report to CSV</li>
              </ol>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">Analytics Dashboard Testing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Generate demo data to test analytics charts and metrics
            </p>
            <Button onClick={runAnalyticsSeed} disabled={loading} className="w-full" variant="secondary">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Generating..." : "Generate Analytics Data"}
            </Button>
            <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Analytics Test Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Click "Generate Analytics Data" above</li>
                <li>Sign in as admin@test.com (password: password123)</li>
                <li>Go to Admin Dashboard → Analytics</li>
                <li>View KPI cards showing key metrics</li>
                <li>Check the 7-day trend line chart</li>
                <li>Verify adherence %, completion rate, and CSAT scores</li>
              </ol>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-lg mb-2">Sign-In Testing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Test all user accounts to verify they can sign in with their passwords
            </p>
            <Button onClick={testAllSignIns} disabled={testingSignIn} className="w-full" variant="secondary">
              {testingSignIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testingSignIn ? "Testing..." : "Test All Sign-Ins"}
            </Button>

            {signInResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {signInResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{result.email}</p>
                        <p className="text-xs text-muted-foreground">Password: {result.password}</p>
                      </div>
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-500">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedData;
