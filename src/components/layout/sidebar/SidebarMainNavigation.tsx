import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckSquare, ChartBar, Clock, FileText, Home, Receipt, Users, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { CompaniesMenu } from "./CompaniesMenu";

interface SidebarMainNavigationProps {
  location: { pathname: string; search: string };
}

export function SidebarMainNavigation({ location }: SidebarMainNavigationProps) {
  // Functions to check active state
  const isTabActive = (tab: string) => {
    const params = new URLSearchParams(location.search);
    const currentTab = params.get("tab");
    if (!currentTab && tab === "overview" && !location.pathname.includes("/")) {
      return true; // Default tab is overview
    }
    return currentTab === tab;
  };

  const isRouteActive = (route: string) => {
    return location.pathname.includes(route);
  };

  // Function to create a URL that navigates to the home page with a specific tab
  const getTabUrl = (tab: string) => {
    return `/?tab=${tab}`;
  };

  return (
    <div className="mt-2 space-y-1 px-2">
      <div className="px-2 py-2">
        <CompaniesMenu />
      </div>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("overview") && !isRouteActive("/employees") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("overview")}>
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("companies") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("companies")}>
          <Building className="h-4 w-4" />
          Companies
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("tasks") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("tasks")}>
          <CheckSquare className="h-4 w-4" />
          Tasks
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isRouteActive("/employees") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to="/employees">
          <Users className="h-4 w-4" />
          Employees
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("timesheets") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("timesheets")}>
          <Clock className="h-4 w-4" />
          Timesheets
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("payroll") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("payroll")}>
          <Receipt className="h-4 w-4" />
          Payroll Input
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isRouteActive("/payroll-processing") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to="/payroll-processing">
          <Receipt className="h-4 w-4" />
          Payroll Processing
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("documents") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("documents")}>
          <FileText className="h-4 w-4" />
          Documents
        </Link>
      </Button>
      
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isTabActive("reports") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
        <Link to={getTabUrl("reports")}>
          <ChartBar className="h-4 w-4" />
          Bureau Reports
        </Link>
      </Button>
    </div>
  );
}
