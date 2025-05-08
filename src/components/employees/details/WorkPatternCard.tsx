
import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimePickerDemo } from "@/components/ui/time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Employee } from "@/hooks/useEmployeeDetails";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkPatternCardProps {
  employee: Employee;
  isAdmin: boolean;
  refetchEmployeeData: () => Promise<void>;
}

interface DaySchedule {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
}

const defaultWorkPattern: DaySchedule[] = [
  { day: "Monday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Tuesday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Wednesday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Thursday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Friday", isWorking: true, startTime: "09:00", endTime: "17:00" },
  { day: "Saturday", isWorking: false, startTime: null, endTime: null },
  { day: "Sunday", isWorking: false, startTime: null, endTime: null },
];

export const WorkPatternCard = ({ employee, isAdmin, refetchEmployeeData }: WorkPatternCardProps) => {
  const [workPattern, setWorkPattern] = useState<DaySchedule[]>(
    employee.work_pattern ? JSON.parse(employee.work_pattern) : defaultWorkPattern
  );
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleDayClick = (day: DaySchedule) => {
    if (!isAdmin) return;
    
    setSelectedDay(day);
    setStartTime(day.startTime);
    setEndTime(day.endTime);
    setDialogOpen(true);
  };

  const handleCheckboxChange = async (day: DaySchedule, checked: boolean) => {
    if (!isAdmin) return;

    const updatedPattern = workPattern.map(d => 
      d.day === day.day ? { ...d, isWorking: checked } : d
    );
    
    setWorkPattern(updatedPattern);
    await saveWorkPattern(updatedPattern);
  };

  const handleSaveTime = async () => {
    if (!selectedDay) return;

    const updatedPattern = workPattern.map(d => 
      d.day === selectedDay.day ? { ...d, startTime, endTime } : d
    );
    
    setWorkPattern(updatedPattern);
    setDialogOpen(false);
    await saveWorkPattern(updatedPattern);
  };

  const saveWorkPattern = async (pattern: DaySchedule[]) => {
    if (!isAdmin) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("employees")
        .update({ work_pattern: JSON.stringify(pattern) })
        .eq("id", employee.id);
        
      if (error) throw error;
      
      toast({
        title: "Work pattern updated",
        description: "The employee's work pattern has been saved."
      });
      
      await refetchEmployeeData();
    } catch (error: any) {
      toast({
        title: "Error saving work pattern",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return "—";
    return time;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Pattern</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workPattern.map((day) => (
            <div key={day.day} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-3">
                {isAdmin ? (
                  <Checkbox 
                    checked={day.isWorking} 
                    onCheckedChange={(checked) => handleCheckboxChange(day, checked === true)}
                    id={`day-${day.day}`}
                  />
                ) : (
                  day.isWorking ? (
                    <Badge className="bg-monday-green text-white">Working</Badge>
                  ) : (
                    <Badge variant="outline">Off</Badge>
                  )
                )}
                <span className="font-medium">{day.day}</span>
              </div>
              
              {day.isWorking && (
                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground">{formatTimeDisplay(day.startTime)} – {formatTimeDisplay(day.endTime)}</span>
                  {isAdmin && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2" 
                      onClick={() => handleDayClick(day)}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Working Hours for {selectedDay?.day}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Start Time</label>
                <input 
                  type="time"
                  value={startTime || ""}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">End Time</label>
                <input 
                  type="time"
                  value={endTime || ""}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button onClick={handleSaveTime} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
