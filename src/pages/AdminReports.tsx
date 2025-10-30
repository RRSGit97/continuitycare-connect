import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNav from "@/components/RoleBasedNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, ArrowLeft, Download, FileBarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RoleAccessCount {
  role: string;
  select_count: number;
  insert_count: number;
  update_count: number;
  delete_count: number;
  total_count: number;
}

export default function AdminReports() {
  const [loading, setLoading] = useState(false);
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState<RoleAccessCount[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateReport = async () => {
    try {
      setLoading(true);

      // Parse the month
      const [year, month] = reportMonth.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch audit logs for the month
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("actor_id, action")
        .gte("timestamp", startDate.toISOString())
        .lte("timestamp", endDate.toISOString());

      if (error) throw error;

      if (!logs || logs.length === 0) {
        toast({
          title: "No Data",
          description: "No audit logs found for the selected month",
        });
        setReportData([]);
        return;
      }

      // Get unique actor IDs
      const actorIds = [...new Set(logs.map(log => log.actor_id).filter(Boolean))];

      // Fetch user roles for these actors
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", actorIds);

      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const roleMap = new Map(
        userRoles?.map(ur => [ur.user_id, ur.role]) || []
      );

      // Aggregate counts by role and action
      const roleCounts = new Map<string, RoleAccessCount>();

      logs.forEach(log => {
        if (!log.actor_id) return;
        
        const role = roleMap.get(log.actor_id) || "unknown";
        
        if (!roleCounts.has(role)) {
          roleCounts.set(role, {
            role,
            select_count: 0,
            insert_count: 0,
            update_count: 0,
            delete_count: 0,
            total_count: 0,
          });
        }

        const counts = roleCounts.get(role)!;
        counts.total_count++;

        switch (log.action.toUpperCase()) {
          case "SELECT":
            counts.select_count++;
            break;
          case "INSERT":
            counts.insert_count++;
            break;
          case "UPDATE":
            counts.update_count++;
            break;
          case "DELETE":
            counts.delete_count++;
            break;
        }
      });

      const reportArray = Array.from(roleCounts.values()).sort(
        (a, b) => b.total_count - a.total_count
      );

      setReportData(reportArray);

      toast({
        title: "Success",
        description: "Compliance report generated successfully",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (reportData.length === 0) {
      toast({
        title: "No Data",
        description: "Generate a report first before exporting",
      });
      return;
    }

    const headers = ["Role", "SELECT", "INSERT", "UPDATE", "DELETE", "Total Accesses"];
    const rows = reportData.map(row => [
      row.role,
      row.select_count,
      row.insert_count,
      row.update_count,
      row.delete_count,
      row.total_count,
    ]);

    const csvContent = [
      `Monthly Compliance Report - ${reportMonth}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${reportMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported to CSV",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedNav />
      <main className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Monthly Compliance Report</CardTitle>
                  <CardDescription>
                    Generate reports showing database access counts by user role
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={exportReport}
                disabled={reportData.length === 0}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 space-y-2">
                <Label>Report Month</Label>
                <Input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  max={new Date().toISOString().slice(0, 7)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={generateReport} disabled={loading}>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>

            {reportData.length > 0 ? (
              <div className="space-y-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">SELECT</TableHead>
                        <TableHead className="text-right">INSERT</TableHead>
                        <TableHead className="text-right">UPDATE</TableHead>
                        <TableHead className="text-right">DELETE</TableHead>
                        <TableHead className="text-right">Total Accesses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row) => (
                        <TableRow key={row.role}>
                          <TableCell className="font-medium capitalize">
                            {row.role}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.select_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.insert_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.update_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.delete_count.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.total_count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData.reduce((sum, row) => sum + row.select_count, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData.reduce((sum, row) => sum + row.insert_count, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData.reduce((sum, row) => sum + row.update_count, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData.reduce((sum, row) => sum + row.delete_count, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {reportData.reduce((sum, row) => sum + row.total_count, 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Report Summary:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Period: {new Date(reportMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</li>
                    <li>Total Database Operations: {reportData.reduce((sum, row) => sum + row.total_count, 0).toLocaleString()}</li>
                    <li>Roles Tracked: {reportData.length}</li>
                    <li>Generated: {new Date().toLocaleString()}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a month and click "Generate Report" to view compliance data
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
