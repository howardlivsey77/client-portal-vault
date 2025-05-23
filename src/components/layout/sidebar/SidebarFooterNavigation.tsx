import { Button } from "@/components/ui/button";
import { Shield, UserCog } from "lucide-react";
import { Link, Location } from "react-router-dom";

interface SidebarFooterNavigationProps {
  location: Location;
  expandedAccordion: string | null;
  onAccordionChange: (value: string) => void;
}

export function SidebarFooterNavigation({ location, expandedAccordion, onAccordionChange }: SidebarFooterNavigationProps) {
  return (
    <div className="mt-auto">
      {/* Footer navigation items removed as they're accessible via header user menu */}
    </div>
  );
}
