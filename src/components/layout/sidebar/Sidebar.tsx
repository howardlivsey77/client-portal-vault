
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { SidebarMainNavigation } from "./SidebarMainNavigation";
import { SidebarFooterNavigation } from "./SidebarFooterNavigation";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { useSidebarContext } from "@/contexts/SidebarContext";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const { isCollapsed, isExpanded, setHovering, isPinned } = useSidebarContext();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAccordionChange = (value: string) => {
    setExpandedAccordion(expandedAccordion === value ? null : value);
  };

  const handleMouseEnter = () => {
    if (isCollapsed) {
      // Small delay to prevent accidental triggers
      hoverTimeoutRef.current = setTimeout(() => {
        setHovering(true);
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHovering(false);
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out lg:static",
        // Mobile visibility
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Width based on state
        isExpanded ? "w-64" : "w-16",
        // When hovering on collapsed, show as overlay
        isCollapsed && isExpanded && "lg:absolute lg:shadow-xl lg:z-50"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Toggle button at top */}
      <div className={cn(
        "flex items-center h-14 border-b border-border px-2",
        isExpanded ? "justify-end" : "justify-center"
      )}>
        <SidebarToggleButton />
      </div>

      <nav className="flex flex-1 flex-col py-4 overflow-y-auto overflow-x-hidden">
        <SidebarMainNavigation location={location} isExpanded={isExpanded} />
        <SidebarFooterNavigation 
          location={location} 
          expandedAccordion={expandedAccordion}
          onAccordionChange={handleAccordionChange}
        />
      </nav>
    </aside>
  );
}
