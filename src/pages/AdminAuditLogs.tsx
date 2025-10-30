import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNav from "@/components/RoleBasedNav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  timestamp: string;
  ip_address: unknown;
  actor_email?: string;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterActor, setFilterActor] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);

      // Apply filters
      if (filterEntity !== "all") {
        query = query.eq("entity", filterEntity);
      }
      
      if (filterDateFrom) {
        query = query.gte("timestamp", new Date(filterDateFrom).toISOString());
      }
      
      if (filterDateTo) {
        const endDate = new Date(filterDateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("timestamp", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch actor emails
      if (data) {
        const actorIds = [...new Set(data.map(log => log.actor_id).filter(Boolean))];
        
        if (actorIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", actorIds);

          const logsWithActors = data.map(log => ({
            ...log,
            actor_email: profiles?.find(p => p.id === log.actor_id)?.email || "System"
          }));

          // Apply actor filter if set
          let filteredLogs = logsWithActors;
          if (filterActor) {
            filteredLogs = logsWithActors.filter(log => 
              log.actor_email?.toLowerCase().includes(filterActor.toLowerCase())
            );
          }

          setLogs(filteredLogs);
        } else {
          setLogs(data);
        }
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEntity, filterDateFrom, filterDateTo]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filterActor]);

  const exportToCSV = () => {
    const headers = ["Timestamp", "Actor", "Action", "Entity", "Entity ID", "IP Address"];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.actor_email || "System",
      log.action,
      log.entity,
      log.entity_id || "",
      log.ip_address || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Audit logs exported to CSV",
    });
  };

  const entities = ["all", "patients", "providers", "episodes_of_care", "care_plans", "bookings", "messages", "consent_records"];

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
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Audit Log Explorer</CardTitle>
                  <CardDescription>
                    Filter and export audit logs for compliance reporting
                  </CardDescription>
                </div>
              </div>
              <Button onClick={exportToCSV} disabled={logs.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(entity => (
                      <SelectItem key={entity} value={entity}>
                        {entity === "all" ? "All Entities" : entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Actor Email</Label>
                <Input
                  placeholder="Filter by actor..."
                  value={filterActor}
                  onChange={(e) => setFilterActor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.actor_email || "System"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>{log.entity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.ip_address ? String(log.ip_address) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
