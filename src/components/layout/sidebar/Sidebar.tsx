
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarMainNavigation } from "./SidebarMainNavigation";
import { SidebarFooterNavigation } from "./SidebarFooterNavigation";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const handleAccordionChange = (value: string) => {
    setExpandedAccordion(expandedAccordion === value ? null : value);
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-300 ease-in-out lg:static", 
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <nav className="flex flex-1 flex-col py-6">
        <SidebarMainNavigation location={location} />
        <SidebarFooterNavigation 
          location={location} 
          expandedAccordion={expandedAccordion}
          onAccordionChange={handleAccordionChange}
        />
      </nav>
    </aside>
  );
}
