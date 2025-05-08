
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { WorkPatternCardProps, WorkDay } from "./types";
import { WorkPatternDialog } from "./WorkPatternDialog";
import { WorkPatternDisplay } from "./WorkPatternDisplay";
import { fetchWorkPatterns, saveWorkPatterns } from "./utils";
import { defaultWorkPattern } from "@/types/employee";

export const WorkPatternCard = ({ 
  employee, 
  isAdmin,
  refetchEmployeeData
}: WorkPatternCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workPattern, setWorkPattern] = useState<WorkDay[]>(defaultWorkPattern);
  const { toast } = useToast();
  
  useEffect(() => {
    loadWorkPattern();
  }, [employee.id]);
  
  const loadWorkPattern = async () => {
    if (!employee.id) return;
    
    setLoading(true);
    try {
      const patterns = await fetchWorkPatterns(employee.id);
      setWorkPattern(patterns);
    } catch (error: any) {
      toast({
        title: "Error loading work pattern",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveWorkPattern = async () => {
    if (!isAdmin || !employee.id) return false;
    
    setLoading(true);
    try {
      // Make sure payrollId is set in all work patterns
      const patternsWithPayrollId = workPattern.map(pattern => ({
        ...pattern,
        payrollId: pattern.payrollId || employee.payroll_id || null
      }));
      
      const success = await saveWorkPatterns(employee.id, patternsWithPayrollId);
      
      if (success) {
        toast({
          title: "Work pattern saved",
          description: "The work pattern has been updated successfully.",
        });
        setDialogOpen(false);
        return true;
      } else {
        throw new Error("Failed to save work pattern");
      }
    } catch (error: any) {
      toast({
        title: "Error saving work pattern",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Work Pattern</CardTitle>
        {isAdmin && (
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            Edit
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
