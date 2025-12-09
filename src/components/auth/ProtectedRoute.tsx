
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/providers";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  console.log("Protected Route - User:", user?.email, "Admin:", isAdmin, "Admin only route:", adminOnly, "Loading:", isLoading);
  
  useEffect(() => {
    // Safety timeout to prevent infinite loading states
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Protected Route - Loading timeout reached, forcing redirect to auth");
        setLoadingTimeout(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // If loading timeout occurred or user is not logged in, redirect to login
  if (loadingTimeout || !user) {
    console.log("Protected Route - Redirecting to auth page due to:", 
      loadingTimeout ? "timeout" : "no user");
    return <Navigate to="/auth" replace />;
  }
  
  // If route requires admin access but user is not admin
  if (adminOnly && !isAdmin) {
    console.log("Access denied: Route requires admin but user is not an admin");
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
