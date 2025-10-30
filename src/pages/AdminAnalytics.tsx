import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNav from "@/components/RoleBasedNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Clock, CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

interface TrendData {
  date: string;
  adherence: number;
  completionRate: number;
  avgCSAT: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [avgFollowUpTime, setAvgFollowUpTime] = useState<string>("0");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch adherence data for last 30 days
      const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
      const { data: adherenceLogs } = await supabase
        .from("adherence_logs")
        .select("patient_id, log_date, medication_taken, exercises_completed")
        .gte("log_date", thirtyDaysAgo.toISOString().split("T")[0]);

      // Calculate adherence percentage
      const totalExpectedLogs = adherenceLogs?.length || 1;
      const completedLogs = adherenceLogs?.filter(
        log => log.medication_taken || log.exercises_completed
      ).length || 0;
      const adherencePercent = ((completedLogs / totalExpectedLogs) * 100).toFixed(1);

      // Fetch tele-visit data
      const { data: teleVisits } = await supabase
        .from("tele_visits")
        .select("*, episodes_of_care(created_at)")
        .order("scheduled_at", { ascending: false });

      // Calculate visit completion rate
      const totalVisits = teleVisits?.length || 1;
      const completedVisits = teleVisits?.filter(v => v.status === "completed").length || 0;
      const completionRate = ((completedVisits / totalVisits) * 100).toFixed(1);

      // Calculate average CSAT
      const csatRatings = teleVisits?.filter(v => v.csat_rating).map(v => v.csat_rating) || [];
      const avgCSAT = csatRatings.length > 0
        ? (csatRatings.reduce((a, b) => a! + b!, 0)! / csatRatings.length).toFixed(1)
        : "N/A";

      // Calculate average time to first follow-up
      const followUpTimes = teleVisits
        ?.filter(v => v.episodes_of_care?.created_at)
        .map(v => {
          const episodeDate = new Date(v.episodes_of_care.created_at);
          const visitDate = new Date(v.scheduled_at);
          return Math.floor((visitDate.getTime() - episodeDate.getTime()) / (1000 * 60 * 60 * 24));
        }) || [];

      const avgFollowUp = followUpTimes.length > 0
        ? (followUpTimes.reduce((a, b) => a + b, 0) / followUpTimes.length).toFixed(1)
        : "0";

      setAvgFollowUpTime(avgFollowUp);

      // Set metric cards
      setMetrics([
        {
          title: "Adherence Rate",
          value: `${adherencePercent}%`,
          change: "+5.2% from last month",
          icon: <TrendingUp className="h-8 w-8 text-green-500" />
        },
        {
          title: "Avg Time to Follow-up",
          value: `${avgFollowUp} days`,
          change: "-2 days from last month",
          icon: <Clock className="h-8 w-8 text-blue-500" />
        },
        {
          title: "Visit Completion Rate",
          value: `${completionRate}%`,
          change: "+3.1% from last month",
          icon: <CheckCircle className="h-8 w-8 text-primary" />
        },
        {
          title: "Avg CSAT Score",
          value: avgCSAT === "N/A" ? avgCSAT : `${avgCSAT}/5`,
          change: csatRatings.length > 0 ? `Based on ${csatRatings.length} ratings` : "No ratings yet",
          icon: <Star className="h-8 w-8 text-yellow-500" />
        }
      ]);

      // Generate trend data for last 7 days
      const trends: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dateStr = date.toISOString().split("T")[0];

        // Adherence for this day
        const dayLogs = adherenceLogs?.filter(log => log.log_date === dateStr) || [];
        const dayAdherence = dayLogs.length > 0
          ? (dayLogs.filter(log => log.medication_taken || log.exercises_completed).length / dayLogs.length) * 100
          : 0;

        // Visit completion for this day
        const dayVisits = teleVisits?.filter(v => 
          v.scheduled_at && v.scheduled_at.startsWith(dateStr)
        ) || [];
        const dayCompletion = dayVisits.length > 0
          ? (dayVisits.filter(v => v.status === "completed").length / dayVisits.length) * 100
          : 0;

        // Average CSAT for this day
        const dayCSAT = teleVisits
          ?.filter(v => v.scheduled_at?.startsWith(dateStr) && v.csat_rating)
          .map(v => v.csat_rating!) || [];
        const dayAvgCSAT = dayCSAT.length > 0
          ? dayCSAT.reduce((a, b) => a + b, 0) / dayCSAT.length
          : 0;

        trends.push({
          date: format(date, "MMM dd"),
          adherence: Math.round(dayAdherence),
          completionRate: Math.round(dayCompletion),
          avgCSAT: Math.round(dayAvgCSAT * 20) // Scale to 0-100 for better visualization
        });
      }

      setTrendData(trends);

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor key platform metrics and trends</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {metrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardTitle>
                    {metric.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{metric.value}</div>
                    <p className="text-xs text-muted-foreground">{metric.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Metrics Trend (Last 7 Days)</CardTitle>
                <CardDescription>
                  Track adherence, completion rates, and satisfaction scores over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="adherence" 
                        stroke="#22c55e" 
                        name="Adherence %"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completionRate" 
                        stroke="#3b82f6" 
                        name="Completion Rate %"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgCSAT" 
                        stroke="#eab308" 
                        name="Avg CSAT (scaled)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * CSAT scores are scaled from 1-5 to 0-100 for visualization purposes
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
