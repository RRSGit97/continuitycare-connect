import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
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

          <Button onClick={runSeed} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Seeding..." : "Run Seed Script"}
          </Button>

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
