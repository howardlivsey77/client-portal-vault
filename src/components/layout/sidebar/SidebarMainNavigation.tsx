
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckSquare, ChartBar, Clock, FileText, Home, Receipt, Users, Building, UserCog, Stethoscope, FileBarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/providers";
import { useCompany } from "@/providers/CompanyProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarMainNavigationProps {
  location: { pathname: string; search: string };
  isExpanded?: boolean;
}

type AllowedRole = 'admin' | 'payroll' | 'user';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  allowedRoles?: AllowedRole[]; // If set, only these roles can see the item
  hiddenForRoles?: AllowedRole[]; // If set, hide from these roles
}

export function SidebarMainNavigation({ location, isExpanded = true }: SidebarMainNavigationProps) {
  const { isAdmin } = useAuth();
  const { currentRole } = useCompany();

  const isTabActive = (tab: string) => {
    const params = new URLSearchParams(location.search);
    const currentTab = params.get("tab");
    if (!currentTab && tab === "overview" && !location.pathname.includes("/")) {
      return true;
    }
    return currentTab === tab;
  };

  const isRouteActive = (route: string) => {
    return location.pathname.includes(route);
  };

  const getTabUrl = (tab: string) => {
    return `/?tab=${tab}`;
  };

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      to: getTabUrl("overview"),
      isActive: isTabActive("overview") && !isRouteActive("/employees"),
    },
    {
      icon: Building,
      label: "Companies",
      to: getTabUrl("companies"),
      isActive: isTabActive("companies"),
      allowedRoles: ['admin'], // Super admins only
    },
    {
      icon: Building,
      label: "Company Settings",
      to: "/settings/company/general",
      isActive: isRouteActive("/settings/company"),
    },
    {
      icon: CheckSquare,
      label: "Tasks",
      to: getTabUrl("tasks"),
      isActive: isTabActive("tasks"),
      hiddenForRoles: ['payroll'], // Hidden from payroll users
    },
    {
      icon: Users,
      label: "Employees",
      to: "/employees",
      isActive: isRouteActive("/employees") && !isRouteActive("/employees/sickness/import"),
    },
    {
      icon: Stethoscope,
      label: "Sickness Import",
      to: "/employees/sickness/import",
      isActive: isRouteActive("/employees/sickness/import"),
      allowedRoles: ['admin'], // Super admins only
    },
    {
      icon: Clock,
      label: "Timesheets",
      to: getTabUrl("timesheets"),
      isActive: isTabActive("timesheets"),
    },
    {
      icon: Receipt,
      label: "Payroll Input",
      to: getTabUrl("payroll"),
      isActive: isTabActive("payroll"),
      hiddenForRoles: ['payroll'], // Hidden from payroll users
    },
    {
      icon: Receipt,
      label: "Payroll Processing",
      to: "/payroll-processing",
      isActive: isRouteActive("/payroll-processing"),
      allowedRoles: ['admin', 'payroll'], // Admins and payroll users
    },
    {
      icon: FileText,
      label: "Documents",
      to: getTabUrl("documents"),
      isActive: isTabActive("documents"),
      hiddenForRoles: ['payroll'], // Hidden from payroll users
    },
    {
      icon: ChartBar,
      label: "Bureau Reports",
      to: getTabUrl("reports"),
      isActive: isTabActive("reports"),
      allowedRoles: ['admin', 'payroll'], // Admins and payroll users
    },
    {
      icon: FileBarChart,
      label: "Client Reports",
      to: "/client-reports",
      isActive: isRouteActive("/client-reports"),
    },
    {
      icon: UserCog,
      label: "Users",
      to: "/invites",
      isActive: isRouteActive("/invites"),
      allowedRoles: ['admin'], // Super admins only
    },
  ];

  // Filter items based on role
  const filteredItems = navItems.filter(item => {
    const effectiveRole = isAdmin ? 'admin' : (currentRole || 'user');
    
    // Check allowedRoles - if set, user must have one of these roles
    if (item.allowedRoles) {
      if (!item.allowedRoles.includes(effectiveRole as AllowedRole)) {
        return false;
      }
    }
    
    // Check hiddenForRoles - if set, hide from these specific roles
    if (item.hiddenForRoles && !isAdmin) {
      if (item.hiddenForRoles.includes(effectiveRole as AllowedRole)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("mt-2 space-y-1", isExpanded ? "px-2" : "px-1")}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const button = (
            <Button 
              variant="ghost" 
              className={cn(
                "monday-sidebar-item w-full",
                isExpanded ? "justify-start" : "justify-center px-0",
                item.isActive && "bg-foreground text-background"
              )} 
              asChild
            >
              <Link to={item.to}>
                <Icon className={cn("h-4 w-4", isExpanded && "mr-2")} />
                {isExpanded && <span className="truncate">{item.label}</span>}
              </Link>
            </Button>
          );

          if (!isExpanded) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return <div key={item.label}>{button}</div>;
        })}
      </div>
    </TooltipProvider>
  );
}
