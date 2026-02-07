
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks";
import { WorkPatternCardProps, WorkDay } from "./types";
import { WorkPatternDialog } from "./WorkPatternDialog";
import { WorkPatternDisplay } from "./WorkPatternDisplay";
import { fetchWorkPatterns, saveWorkPatterns } from "./utils";
import { defaultWorkPattern } from "@/types";
import { Separator } from "@/components/ui/separator";
import { SicknessSchemeSelector } from "./SicknessSchemeSelector";
import { usePermissions } from "@/hooks/usePermissions";

export const WorkPatternCard = ({ 
  employee, 
  refetchEmployeeData,
  updateEmployeeField
}: WorkPatternCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workPattern, setWorkPattern] = useState<WorkDay[]>(
    defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: employee.payroll_id || null
    }))
  );
  const { toast } = useToast();
  const { canEditWorkPattern } = usePermissions();
  
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
    if (!canEditWorkPattern || !employee.id) return false;
    
    setLoading(true);
    try {
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
    <Card className="border-[1.5px] border-foreground bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Work Pattern</CardTitle>
        {canEditWorkPattern && (
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <WorkPatternDisplay workPattern={workPattern} />
          
          {updateEmployeeField && (
            <>
              <Separator className="my-4" />
              
              <SicknessSchemeSelector 
                employeeId={employee.id}
                currentSchemeId={employee.sickness_scheme_id || null}
                updateEmployeeField={updateEmployeeField}
              />
            </>
          )}
        </div>
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
