import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarMainNavigation } from "./SidebarMainNavigation";
import { SidebarFooterNavigation } from "./SidebarFooterNavigation";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { useSidebarContext } from "@/contexts";

interface SidebarProps {
  isMobileOpen: boolean;
}

export function Sidebar({ isMobileOpen }: SidebarProps) {
  const location = useLocation();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const { isOpen } = useSidebarContext();

  const handleAccordionChange = (value: string) => {
    setExpandedAccordion(expandedAccordion === value ? null : value);
  };

  return (
    <aside 
      className={cn(
        "fixed top-20 bottom-0 left-0 z-40 flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out lg:static lg:top-0",
        // Mobile visibility
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Width based on open/closed state
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Toggle button at top */}
      <div className={cn(
        "flex items-center h-14 border-b border-border px-2",
        isOpen ? "justify-end" : "justify-center"
      )}>
        <SidebarToggleButton />
      </div>

      <nav className="flex flex-1 flex-col py-4 overflow-y-auto overflow-x-hidden">
        <SidebarMainNavigation location={location} isExpanded={isOpen} />
        <SidebarFooterNavigation 
          location={location} 
          expandedAccordion={expandedAccordion}
          onAccordionChange={handleAccordionChange}
        />
      </nav>
    </aside>
  );
}
