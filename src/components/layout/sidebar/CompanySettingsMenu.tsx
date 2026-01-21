
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function CompanySettingsMenu() {
  return (
    <Accordion type="single" collapsible className="w-full">
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
              <Link to="/settings/company/sickness">
                Sickness
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
            <Button 
              variant="ghost" 
              className="monday-sidebar-item w-full justify-start text-xs py-1 h-7" 
              asChild
            >
              <Link to="/settings/company/cost-centres">
                Cost Centres
              </Link>
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
