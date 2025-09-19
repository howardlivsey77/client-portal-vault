import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import AcceptInviteToken from "./pages/AcceptInviteToken";
import InviteManagement from "./pages/InviteManagement";
import Employees from "./pages/Employees";
import EmployeeForm from "./pages/EmployeeForm";
import EmployeeDetails from "./pages/EmployeeDetails";
import TimesheetSettings from "./pages/TimesheetSettings";
import Notifications from "./pages/Notifications";
import PayrollProcessing from "./pages/PayrollProcessing";
import Security from "./pages/Security";
import Profile from "./pages/Profile";
import CompanySettings from "./features/company-settings/CompanySettings";
import CompanyManagement from "./features/company-management/CompanyManagement";
import NotFound from "./pages/NotFound";
import SicknessImport from "./pages/SicknessImport";
import ClientReports from "./pages/ClientReports";
import AuthProvider from "./providers/AuthProvider";
import CompanyProvider from "./providers/CompanyProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { NotificationsProvider } from "./components/notifications/NotificationsContext";
import AuthInviteGuard from "./components/auth/AuthInviteGuard";
import CreatePassword from "./pages/CreatePassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <NotificationsProvider>
              <AuthInviteGuard />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/create-password" element={<CreatePassword />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                <Route path="/invite/accept" element={<AcceptInviteToken />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/invites" element={<ProtectedRoute adminOnly={true}><InviteManagement /></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                <Route path="/employees/sickness/import" element={<ProtectedRoute><SicknessImport /></ProtectedRoute>} />
                <Route path="/client-reports" element={<ProtectedRoute><ClientReports /></ProtectedRoute>} />
                <Route path="/employee/new" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
                <Route path="/employee/:id" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
                <Route path="/employee/edit/:id" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
                <Route path="/settings/timesheets" element={<ProtectedRoute><TimesheetSettings /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/payroll-processing" element={<ProtectedRoute><PayrollProcessing /></ProtectedRoute>} />
                <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                {/* Company Settings Routes */}
                <Route path="/settings/company/general" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
                <Route path="/settings/company/sickness" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
                <Route path="/settings/company/locations" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
                <Route path="/settings/company/departments" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
                
                {/* Company Management Route - allow all authenticated users */}
                <Route path="/settings/companies" element={<ProtectedRoute><CompanyManagement /></ProtectedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationsProvider>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;