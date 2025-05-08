
import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Employee } from "@/hooks/useEmployeeDetails";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { defaultWorkPattern } from "@/types/employee";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkDay {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface WorkPatternCardProps {
  employee: Employee;
  isAdmin: boolean;
  refetchEmployeeData: () => Promise<void>;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const WorkPatternCard = ({ 
  employee, 
  isAdmin,
  refetchEmployeeData,
  updateEmployeeField 
}: WorkPatternCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  
  const [workPattern, setWorkPattern] = useState<WorkDay[]>(() => {
    try {
      if (employee.work_pattern) {
        return JSON.parse(employee.work_pattern);
      }
    } catch (e) {
      console.error("Error parsing work pattern:", e);
    }
    return defaultWorkPattern;
  });

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });
  
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
  
  const saveWorkPattern = async () => {
    if (!isAdmin) return;
    
    try {
      const success = await updateEmployeeField("work_pattern", JSON.stringify(workPattern));
      
      if (success) {
        setDialogOpen(false);
        setEditing(false);
      }
    } catch (error: any) {
      toast({
        title: "Error saving work pattern",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Format time for display
  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time;
  };
  
  // Check if employee is scheduled to work on a specific day
  const isWorkingDay = (day: string) => {
    const workDay = workPattern.find(d => d.day === day);
    return workDay ? workDay.isWorking : false;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Work Pattern</CardTitle>
        {isAdmin && (
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            {editing ? "Save" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
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
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
    </Card>
  );
};
