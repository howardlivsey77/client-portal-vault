
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateHoursList } from "./utils";
import { WorkDay } from "./types";
import { Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkPatternDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workPattern: WorkDay[];
  setWorkPattern: (workPattern: WorkDay[]) => void;
  saveWorkPattern: () => Promise<boolean>;
}

export const WorkPatternDialog = ({
  open,
  onOpenChange,
  workPattern,
  setWorkPattern,
  saveWorkPattern,
}: WorkPatternDialogProps) => {
  const [saving, setSaving] = useState(false);
  const hoursList = generateHoursList();

  const toggleWorkDay = (index: number) => {
    setWorkPattern(
      workPattern.map((day, i) =>
        i === index 
          ? { 
              ...day, 
              isWorking: !day.isWorking,
              // Reset times to null when toggling from working to non-working
              startTime: !day.isWorking ? day.startTime : null,
              endTime: !day.isWorking ? day.endTime : null
            } 
          : day
      )
    );
  };

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    setWorkPattern(
      workPattern.map((day, i) =>
        i === index ? { ...day, [field]: value } : day
      )
    );
  };

  const copyFromFirstDay = () => {
    const firstDay = workPattern[0];
    if (!firstDay.isWorking) {
      return; // Nothing to copy if first day is not a working day
    }
    
    const updatedPattern = workPattern.map((day, index) => {
      if (index === 0) return day; // Skip the first day
      return {
        ...day,
        isWorking: firstDay.isWorking,
        startTime: firstDay.startTime,
        endTime: firstDay.endTime
      };
    });
    
    setWorkPattern(updatedPattern);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Ensure all non-working days have null start and end times
    const sanitizedPattern = workPattern.map(day => ({
      ...day,
      startTime: day.isWorking ? day.startTime : null,
      endTime: day.isWorking ? day.endTime : null
    }));
    
    setWorkPattern(sanitizedPattern);
    
    const success = await saveWorkPattern();
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Edit Work Pattern</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copyFromFirstDay}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    <span>Copy Monday to All</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Monday's working hours to all days</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {workPattern.map((day, index) => (
            <div key={day.day} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`work-${day.day}`}
                  checked={day.isWorking}
                  onCheckedChange={() => toggleWorkDay(index)}
                />
                <Label htmlFor={`work-${day.day}`} className="font-medium">
                  {day.day}
                </Label>
              </div>

              {day.isWorking && (
                <div className="ml-6 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`start-${day.day}`}>Start Time</Label>
                    <Select
                      value={day.startTime || ""}
                      onValueChange={(value) => updateTime(index, "startTime", value)}
                    >
                      <SelectTrigger id={`start-${day.day}`}>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoursList.map((hour) => (
                          <SelectItem key={`start-${hour}`} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`end-${day.day}`}>End Time</Label>
                    <Select
                      value={day.endTime || ""}
                      onValueChange={(value) => updateTime(index, "endTime", value)}
                    >
                      <SelectTrigger id={`end-${day.day}`}>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoursList.map((hour) => (
                          <SelectItem key={`end-${hour}`} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
