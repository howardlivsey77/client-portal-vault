
import { Badge } from "@/components/ui/badge";
import { WorkDay } from "./types";
import { formatTime } from "./utils";
import { cn } from "@/lib/utils";
import { useBrandColors } from "@/brand";

interface WorkPatternDisplayProps {
  workPattern: WorkDay[];
}

export const WorkPatternDisplay = ({ workPattern }: WorkPatternDisplayProps) => {
  const brandColors = useBrandColors();
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {workPattern.map((day) => (
        <div key={day.day} className="flex flex-col items-center text-center">
          <p className="text-sm font-medium mb-1">{day.day.substring(0, 3)}</p>
          <div 
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium w-full min-h-[28px] flex items-center justify-center",
              !day.isWorking && "bg-transparent border border-muted text-muted-foreground"
            )}
            style={day.isWorking ? {
              backgroundColor: `hsl(${brandColors.success})`,
              color: `hsl(${brandColors.successForeground})`
            } : undefined}
          >
            {day.isWorking ? (
              `${formatTime(day.startTime)} - ${formatTime(day.endTime)}`
            ) : (
              "Off"
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
