import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft, Pin } from "lucide-react";
import { useSidebarContext } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarToggleButton() {
  const { isExpanded, isPinned, togglePinned } = useSidebarContext();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePinned}
            className={cn(
              "h-8 w-8 shrink-0",
              isPinned && "text-primary"
            )}
          >
            {isExpanded ? (
              isPinned ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isPinned ? "Collapse sidebar" : "Pin sidebar open"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
