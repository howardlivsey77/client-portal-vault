
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building, Clock, Settings, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CompanySettingsMenu } from "./CompanySettingsMenu";

interface SidebarFooterNavigationProps {
  location: { pathname: string; search: string };
  expandedAccordion: string | null;
  onAccordionChange: (value: string) => void;
}

export function SidebarFooterNavigation({ 
  location, 
  expandedAccordion, 
  onAccordionChange 
}: SidebarFooterNavigationProps) {
  const isRouteActive = (route: string) => {
    return location.pathname.includes(route);
  };

  return (
    <div className="mt-auto px-2 space-y-1">
      <Button 
        variant="ghost" 
        className={cn(
          "monday-sidebar-item w-full justify-start", 
          isRouteActive("/invites") && "bg-accent text-accent-foreground"
        )} 
        asChild
      >
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
        onValueChange={onAccordionChange}
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
              
              <CompanySettingsMenu />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
