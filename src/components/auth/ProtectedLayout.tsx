import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/providers";
import { Loader2 } from "lucide-react";

interface ProtectedLayoutProps {
  adminOnly?: boolean;
}

/**
 * Combined layout component that handles:
 * 1. Authentication check (from ProtectedRoute)
 * 2. 2FA setup requirement (from Require2FASetup)
 * 
 * Use as a layout route to wrap protected pages.
 */
const ProtectedLayout = ({ adminOnly = false }: ProtectedLayoutProps) => {
  const { user, isLoading, isAdmin, requires2FASetup } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  console.log(
    "ProtectedLayout - User:",
    user?.email,
    "Admin:",
    isAdmin,
    "Admin only:",
    adminOnly,
    "Loading:",
    isLoading,
    "Requires 2FA:",
    requires2FASetup
  );

  useEffect(() => {
    // Safety timeout to prevent infinite loading states
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("ProtectedLayout - Loading timeout reached, forcing redirect to auth");
        setLoadingTimeout(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Show loading spinner while checking auth
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If loading timeout occurred or user is not logged in, redirect to login
  if (loadingTimeout || !user) {
    console.log(
      "ProtectedLayout - Redirecting to auth page due to:",
      loadingTimeout ? "timeout" : "no user"
    );
    return <Navigate to="/auth" replace />;
  }

  // If route requires admin access but user is not admin
  if (adminOnly && !isAdmin) {
    console.log("Access denied: Route requires admin but user is not an admin");
    return <Navigate to="/" replace />;
  }

  // Check 2FA requirement (skip for /setup-2fa page itself)
  if (requires2FASetup && location.pathname !== "/setup-2fa") {
    console.log("User requires 2FA setup, redirecting to /setup-2fa");
    return <Navigate to="/setup-2fa" replace />;
  }

  // Render child routes
  return <Outlet />;
};

export default ProtectedLayout;
