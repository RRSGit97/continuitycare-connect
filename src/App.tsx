import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PatientDashboard from "./pages/PatientDashboard";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminConsent from "./pages/AdminConsent";
import AdminUsers from "./pages/AdminUsers";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminReports from "./pages/AdminReports";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SeedData from "./pages/SeedData";
import TeleVisit from "./pages/TeleVisit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/seed" element={<SeedData />} />
          <Route
            path="/dashboard/patient" 
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/specialist" 
            element={
              <ProtectedRoute allowedRoles={["specialist"]}>
                <SpecialistDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/provider" 
            element={
              <ProtectedRoute allowedRoles={["local_provider"]}>
                <ProviderDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/consent" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminConsent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/audit" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAuditLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tele-visit"
            element={
              <ProtectedRoute allowedRoles={["patient", "specialist"]}>
                <TeleVisit />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
