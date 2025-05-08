
import { Badge } from "@/components/ui/badge";
import { WorkDay } from "./types";
import { formatTime } from "./utils";

interface WorkPatternDisplayProps {
  workPattern: WorkDay[];
}

export const WorkPatternDisplay = ({ workPattern }: WorkPatternDisplayProps) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {workPattern.map((day) => (
        <div key={day.day} className="flex flex-col items-center text-center">
          <p className="text-sm font-medium mb-1">{day.day.substring(0, 3)}</p>
          {day.isWorking ? (
            <Badge className="bg-green-500 hover:bg-green-600">
              {formatTime(day.startTime)} - {formatTime(day.endTime)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500">
              Off
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};
