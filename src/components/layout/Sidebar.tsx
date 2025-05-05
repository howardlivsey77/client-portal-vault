
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  File, 
  FileText, 
  Home, 
  Settings, 
  Share, 
  Users,
  CheckSquare,
  ChartBar,
  Receipt
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  // Function to create a URL that navigates to the home page with a specific tab
  const getTabUrl = (tab: string) => {
    return `/?tab=${tab}`;
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-300 ease-in-out lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-monday-blue to-monday-purple"></div>
          <span className="text-monday-darkblue">Client Portal</span>
        </div>
      </div>
      
      <nav className="flex flex-1 flex-col py-6">
        <div className="px-4 text-xs font-semibold uppercase tracking-wider text-monday-gray">
          Dashboard
        </div>
        <div className="mt-2 space-y-1 px-2">
          <Button 
            variant="ghost" 
            className={cn(
              "monday-sidebar-item w-full justify-start", 
              location.search.includes("overview") && "active"
            )} 
            asChild
          >
            <Link to={getTabUrl("overview")}>
              <Home className="h-4 w-4" />
              Overview
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "monday-sidebar-item w-full justify-start", 
              location.pathname.includes("/employees") && "active"
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
              location.search.includes("documents") && "active"
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
              location.search.includes("tasks") && "active"
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
              location.search.includes("reports") && "active"
            )} 
            asChild
          >
            <Link to={getTabUrl("reports")}>
              <ChartBar className="h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            className={cn(
              "monday-sidebar-item w-full justify-start", 
              location.search.includes("payroll") && "active"
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
              location.search.includes("shared") && "active"
            )} 
            asChild
          >
            <Link to={getTabUrl("shared")}>
              <Share className="h-4 w-4" />
              Shared with me
            </Link>
          </Button>
        </div>
        
        <div className="mt-auto px-2 space-y-1">
          <Button variant="ghost" className="monday-sidebar-item w-full justify-start" asChild>
            <Link to="/">
              <Users className="h-4 w-4" />
              Team Access
            </Link>
          </Button>
          <Button variant="ghost" className="monday-sidebar-item w-full justify-start" asChild>
            <Link to="/">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </nav>
    </aside>
  );
}
