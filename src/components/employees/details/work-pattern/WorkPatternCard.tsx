
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WorkPatternCardProps, WorkDay } from "./types";
import { WorkPatternDialog } from "./WorkPatternDialog";
import { WorkPatternDisplay } from "./WorkPatternDisplay";
import { parseWorkPattern } from "./utils";

export const WorkPatternCard = ({ 
  employee, 
  isAdmin,
  refetchEmployeeData,
  updateEmployeeField 
}: WorkPatternCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();
  
  const [workPattern, setWorkPattern] = useState<WorkDay[]>(() => 
    parseWorkPattern(employee.work_pattern)
  );
  
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
        <WorkPatternDisplay workPattern={workPattern} />
      </CardContent>

      <WorkPatternDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workPattern={workPattern}
        setWorkPattern={setWorkPattern}
        saveWorkPattern={saveWorkPattern}
      />
    </Card>
  );
};
