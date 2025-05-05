
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  File, 
  FileText, 
  FolderOpen,
  Home, 
  Settings, 
  Share, 
  Users,
  CheckSquare
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
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-400"></div>
          <span>Client Portal</span>
        </div>
      </div>
      
      <nav className="flex flex-1 flex-col py-6">
        <div className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dashboard
        </div>
        <div className="mt-2 space-y-1 px-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to={getTabUrl("overview")}>
              <Home className="mr-2 h-4 w-4" />
              Overview
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/employees">
              <Users className="mr-2 h-4 w-4" />
              Employees
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start bg-sidebar-accent" asChild>
            <Link to={getTabUrl("documents")}>
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to={getTabUrl("tasks")}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Tasks
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to={getTabUrl("shared")}>
              <Share className="mr-2 h-4 w-4" />
              Shared with me
            </Link>
          </Button>
        </div>
        
        <div className="mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </div>
        <div className="mt-2 space-y-1 px-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/">
              <FolderOpen className="mr-2 h-4 w-4" />
              Contracts
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/">
              <FolderOpen className="mr-2 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/">
              <FolderOpen className="mr-2 h-4 w-4" />
              Invoices
            </Link>
          </Button>
        </div>
        
        <div className="mt-auto px-2 space-y-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/">
              <Users className="mr-2 h-4 w-4" />
              Team Access
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </nav>
    </aside>
  );
}
