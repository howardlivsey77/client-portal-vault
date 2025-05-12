
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { File, FileText, Home, Settings, Users, CheckSquare, ChartBar, Receipt, Clock, BanknoteIcon, Building } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({
  isOpen
}: SidebarProps) {
  const location = useLocation();
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  // Function to check if a tab is active based on URL query parameters
  const isTabActive = (tab: string) => {
    const params = new URLSearchParams(location.search);
    const currentTab = params.get("tab");
    if (!currentTab && tab === "overview" && !location.pathname.includes("/")) {
      return true; // Default tab is overview
    }
    return currentTab === tab;
  };

  // Function to check if a route is active
  const isRouteActive = (route: string) => {
    return location.pathname.includes(route);
  }

  // Function to create a URL that navigates to the home page with a specific tab
  const getTabUrl = (tab: string) => {
    return `/?tab=${tab}`;
  };

  const toggleSettingsSubmenu = () => {
    setShowSettingsSubmenu(!showSettingsSubmenu);
  };

  const handleAccordionChange = (value: string) => {
    setExpandedAccordion(expandedAccordion === value ? null : value);
  };

  return <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-300 ease-in-out lg:static", isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
      
      <nav className="flex flex-1 flex-col py-6">
        
        <div className="mt-2 space-y-1 px-2">
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", 
            isTabActive("overview") && !isRouteActive("/employees") && "bg-accent text-accent-foreground")} asChild>
            <Link to={getTabUrl("overview")}>
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isTabActive("tasks") && "bg-accent text-accent-foreground")} asChild>
            <Link to={getTabUrl("tasks")}>
              <CheckSquare className="h-4 w-4" />
              Tasks
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isRouteActive("/employees") && "bg-accent text-accent-foreground")} asChild>
            <Link to="/employees">
              <Users className="h-4 w-4" />
              Employees
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isTabActive("timesheets") && "bg-accent text-accent-foreground")} asChild>
            <Link to={getTabUrl("timesheets")}>
              <Clock className="h-4 w-4" />
              Timesheets
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isTabActive("payroll") && "bg-accent text-accent-foreground")} asChild>
            <Link to={getTabUrl("payroll")}>
              <Receipt className="h-4 w-4" />
              Payroll Input
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isRouteActive("/payroll-processing") && "bg-accent text-accent-foreground")} asChild>
            <Link to="/payroll-processing">
              <Receipt className="h-4 w-4" />
              Payroll Processing
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isTabActive("documents") && "bg-accent text-accent-foreground")} asChild>
            <Link to={getTabUrl("documents")}>
              <FileText className="h-4 w-4" />
              Documents
            </Link>
          </Button>
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isTabActive("reports") && "bg-accent text-accent-foreground")} asChild>
            <Link to={getTabUrl("reports")}>
              <ChartBar className="h-4 w-4" />
              Bureau Reports
            </Link>
          </Button>
        </div>
        
        <div className="mt-auto px-2 space-y-1">
          <Button variant="ghost" className={cn("monday-sidebar-item w-full justify-start", isRouteActive("/invites") && "bg-accent text-accent-foreground")} asChild>
            <Link to="/invites">
              <Users className="h-4 w-4" />
              Team Access
            </Link>
          </Button>
          
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={expandedAccordion || undefined}
            onValueChange={handleAccordionChange}
          >
            <AccordionItem value="settings" className="border-0">
              <AccordionTrigger className={cn(
                "monday-sidebar-item flex h-10 w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                (isRouteActive("/settings") || expandedAccordion === "settings") && "bg-accent text-accent-foreground"
              )}>
                <div className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Settings</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1">
                <div className="ml-6 space-y-1 pl-2 border-l border-gray-200">
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "monday-sidebar-item w-full justify-start text-sm", 
                      isRouteActive("/settings/timesheets") && "bg-accent text-accent-foreground"
                    )} 
                    asChild
                  >
                    <Link to="/settings/timesheets">
                      <Clock className="h-3 w-3 mr-2" />
                      Timesheet Settings
                    </Link>
                  </Button>
                  
                  {/* Company Settings Section with nested accordion */}
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                  >
                    <AccordionItem value="company-settings" className="border-0">
                      <AccordionTrigger className="monday-sidebar-item flex h-9 w-full items-center rounded-md px-3 py-1 text-sm font-medium hover:bg-muted">
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-2" />
                          <span>Company Settings</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0 pt-1">
                        <div className="ml-4 space-y-1 pl-2 border-l border-gray-200">
                          <Button 
                            variant="ghost" 
                            className="monday-sidebar-item w-full justify-start text-xs py-1 h-7" 
                            asChild
                          >
                            <Link to="/settings/company/general">
                              General
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="monday-sidebar-item w-full justify-start text-xs py-1 h-7" 
                            asChild
                          >
                            <Link to="/settings/company/holidays">
                              Holidays
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="monday-sidebar-item w-full justify-start text-xs py-1 h-7" 
                            asChild
                          >
                            <Link to="/settings/company/locations">
                              Locations
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="monday-sidebar-item w-full justify-start text-xs py-1 h-7" 
                            asChild
                          >
                            <Link to="/settings/company/departments">
                              Departments
                            </Link>
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </nav>
    </aside>;
}
