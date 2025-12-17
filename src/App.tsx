import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandProvider } from "@/brand";
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
import ProtectedLayout from "./components/auth/ProtectedLayout";
import { NotificationsProvider } from "./components/notifications/NotificationsContext";
import AuthInviteGuard from "./components/auth/AuthInviteGuard";
import CreatePassword from "./pages/CreatePassword";
import Setup2FA from "./pages/Setup2FA";
import SicknessDataFixer from "./components/admin/SicknessDataFixer";

const queryClient = new QueryClient();

const App = () => (
  <BrandProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CompanyProvider>
              <NotificationsProvider>
                <AuthInviteGuard />
                {/* Controlled sickness data fix - runs once via useEffect */}
                <SicknessDataFixer />
                <Routes>
                  {/* Public routes */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/create-password" element={<CreatePassword />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/invite/accept" element={<AcceptInviteToken />} />
                  
                  {/* Protected route without 2FA requirement */}
                  <Route path="/setup-2fa" element={<ProtectedRoute><Setup2FA /></ProtectedRoute>} />
                  
                  {/* Protected routes with 2FA requirement */}
                  <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/employees/sickness/import" element={<SicknessImport />} />
                    <Route path="/client-reports" element={<ClientReports />} />
                    <Route path="/employee/new" element={<EmployeeForm />} />
                    <Route path="/employee/:id" element={<EmployeeDetails />} />
                    <Route path="/employee/edit/:id" element={<EmployeeForm />} />
                    <Route path="/settings/timesheets" element={<TimesheetSettings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/payroll-processing" element={<PayrollProcessing />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings/company/general" element={<CompanySettings />} />
                    <Route path="/settings/company/sickness" element={<CompanySettings />} />
                    <Route path="/settings/company/locations" element={<CompanySettings />} />
                    <Route path="/settings/company/departments" element={<CompanySettings />} />
                    <Route path="/settings/companies" element={<CompanyManagement />} />
                  </Route>
                  
                  {/* Admin-only routes with 2FA requirement */}
                  <Route element={<ProtectedLayout adminOnly />}>
                    <Route path="/invites" element={<InviteManagement />} />
                  </Route>
                  
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NotificationsProvider>
            </CompanyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </BrandProvider>
);

export default App;
