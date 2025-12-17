import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// Import and run the sickness data fix
import { runSicknessDataFix } from "@/utils";

// Run fix once on app load
runSicknessDataFix().catch(console.error);
import CompanyProvider from "./providers/CompanyProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Require2FASetup from "./components/auth/Require2FASetup";
import { NotificationsProvider } from "./components/notifications/NotificationsContext";
import AuthInviteGuard from "./components/auth/AuthInviteGuard";
import CreatePassword from "./pages/CreatePassword";
import Setup2FA from "./pages/Setup2FA";

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
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/create-password" element={<CreatePassword />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  <Route path="/invite/accept" element={<AcceptInviteToken />} />
                  <Route path="/setup-2fa" element={<ProtectedRoute><Setup2FA /></ProtectedRoute>} />
                  <Route path="/" element={<ProtectedRoute><Require2FASetup><Index /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/invites" element={<ProtectedRoute adminOnly={true}><Require2FASetup><InviteManagement /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/employees" element={<ProtectedRoute><Require2FASetup><Employees /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/employees/sickness/import" element={<ProtectedRoute><Require2FASetup><SicknessImport /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/client-reports" element={<ProtectedRoute><Require2FASetup><ClientReports /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/employee/new" element={<ProtectedRoute><Require2FASetup><EmployeeForm /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/employee/:id" element={<ProtectedRoute><Require2FASetup><EmployeeDetails /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/employee/edit/:id" element={<ProtectedRoute><Require2FASetup><EmployeeForm /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/settings/timesheets" element={<ProtectedRoute><Require2FASetup><TimesheetSettings /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Require2FASetup><Notifications /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/payroll-processing" element={<ProtectedRoute><Require2FASetup><PayrollProcessing /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/security" element={<ProtectedRoute><Require2FASetup><Security /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Require2FASetup><Profile /></Require2FASetup></ProtectedRoute>} />
                  
                  {/* Company Settings Routes */}
                  <Route path="/settings/company/general" element={<ProtectedRoute><Require2FASetup><CompanySettings /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/settings/company/sickness" element={<ProtectedRoute><Require2FASetup><CompanySettings /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/settings/company/locations" element={<ProtectedRoute><Require2FASetup><CompanySettings /></Require2FASetup></ProtectedRoute>} />
                  <Route path="/settings/company/departments" element={<ProtectedRoute><Require2FASetup><CompanySettings /></Require2FASetup></ProtectedRoute>} />
                  
                  {/* Company Management Route - allow all authenticated users */}
                  <Route path="/settings/companies" element={<ProtectedRoute><Require2FASetup><CompanyManagement /></Require2FASetup></ProtectedRoute>} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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