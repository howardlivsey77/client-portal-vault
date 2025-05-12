
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { Link, Location } from "react-router-dom";
import { CompanySettingsMenu } from "./CompanySettingsMenu";

interface SidebarFooterNavigationProps {
  location: Location;
  expandedAccordion: string | null;
  onAccordionChange: (value: string) => void;
}

export function SidebarFooterNavigation({ location, expandedAccordion, onAccordionChange }: SidebarFooterNavigationProps) {
  return (
    <div className="mt-auto">
      <div className="px-4 py-2">
        <CompanySettingsMenu />
      </div>

      <div className="px-4 py-2">
        <Button
          variant="ghost"
          className={`monday-sidebar-item w-full justify-start ${
            location.pathname === "/security" ? "bg-muted" : ""
          }`}
          asChild
        >
          <Link to="/security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
