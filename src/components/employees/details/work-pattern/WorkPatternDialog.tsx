
import { useState } from "react";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkDay } from "./types";
import { generateHoursList } from "./utils";

interface WorkPatternDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workPattern: WorkDay[];
  setWorkPattern: (pattern: WorkDay[]) => void;
  saveWorkPattern: () => Promise<void>;
}

export const WorkPatternDialog = ({
  open,
  onOpenChange,
  workPattern,
  setWorkPattern,
  saveWorkPattern,
}: WorkPatternDialogProps) => {
  const hours = generateHoursList();
  
  const toggleWorkDay = (index: number) => {
    setWorkPattern(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isWorking: !updated[index].isWorking,
        startTime: updated[index].isWorking ? null : updated[index].startTime || "09:00",
        endTime: updated[index].isWorking ? null : updated[index].endTime || "17:00"
      };
      return updated;
    });
  };
  
  const updateTime = (index: number, type: "startTime" | "endTime", value: string) => {
    setWorkPattern(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [type]: value
      };
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Work Pattern</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {workPattern.map((day, index) => (
            <div key={day.day} className="grid grid-cols-[auto_1fr] gap-4 items-center">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={day.isWorking}
                  onCheckedChange={() => toggleWorkDay(index)}
                  id={`${day.day}-checkbox`}
                />
                <label 
                  htmlFor={`${day.day}-checkbox`}
                  className="font-medium cursor-pointer"
                >
                  {day.day}
                </label>
              </div>
              
              {day.isWorking && (
                <div className="flex items-center gap-2">
                  <Select 
                    value={day.startTime || ""}
                    onValueChange={(value) => updateTime(index, "startTime", value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(hour => (
                        <SelectItem key={`start-${hour}`} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="mx-1">to</span>
                  
                  <Select 
                    value={day.endTime || ""}
                    onValueChange={(value) => updateTime(index, "endTime", value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(hour => (
                        <SelectItem key={`end-${hour}`} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={saveWorkPattern}>
              <Clock className="mr-2 h-4 w-4" />
              Save Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
