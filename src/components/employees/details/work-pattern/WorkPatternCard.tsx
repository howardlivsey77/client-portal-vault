
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks";
import { WorkPatternCardProps, WorkDay } from "./types";
import { WorkPatternDialog } from "./WorkPatternDialog";
import { WorkPatternDisplay } from "./WorkPatternDisplay";
import { fetchWorkPatterns, saveWorkPatterns } from "./utils";
import { defaultWorkPattern } from "@/types/employee";
import { Separator } from "@/components/ui/separator";
import { SicknessSchemeSelector } from "./SicknessSchemeSelector";
import { SicknessTrackingCard } from "../sickness/SicknessTrackingCard";
import { supabase } from "@/integrations/supabase/client";
import { SicknessScheme } from "./types";

export const WorkPatternCard = ({ 
  employee, 
  isAdmin,
  refetchEmployeeData,
  updateEmployeeField
}: WorkPatternCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sicknessScheme, setSicknessScheme] = useState<SicknessScheme | null>(null);
  const [workPattern, setWorkPattern] = useState<WorkDay[]>(
    // Initialize with payrollId
    defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: employee.payroll_id || null
    }))
  );
  const { toast } = useToast();
  
  useEffect(() => {
    loadWorkPattern();
    fetchSicknessScheme();
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

  const fetchSicknessScheme = async () => {
    if (!employee.sickness_scheme_id) {
      setSicknessScheme(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sickness_schemes')
        .select('id, name, eligibility_rules')
        .eq('id', employee.sickness_scheme_id)
        .single();

      if (error) throw error;

      if (data) {
        setSicknessScheme({
          id: data.id,
          name: data.name,
          eligibilityRules: data.eligibility_rules ? JSON.parse(data.eligibility_rules as string) : null
        });
      }
    } catch (error: any) {
      console.error("Error fetching sickness scheme:", error);
      setSicknessScheme(null);
    }
  };

  // Re-fetch sickness scheme when the employee's scheme changes
  useEffect(() => {
    fetchSicknessScheme();
  }, [employee.sickness_scheme_id]);
  
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
    <div className="space-y-6">
      <Card className="border-[1.5px] border-foreground bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Pattern</CardTitle>
          {isAdmin && (
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
                  isAdmin={isAdmin}
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

      {/* Sickness Tracking Section */}
      <SicknessTrackingCard
        employee={employee}
        sicknessScheme={sicknessScheme}
        isAdmin={isAdmin}
      />
    </div>
  );
};
