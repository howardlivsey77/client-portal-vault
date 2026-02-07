
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SicknessScheme } from "./types";
import { useToast } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";
import { usePermissions } from "@/hooks/usePermissions";

interface SicknessSchemeSelectorProps {
  employeeId: string;
  currentSchemeId: string | null;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const SicknessSchemeSelector = ({
  employeeId,
  currentSchemeId,
  updateEmployeeField
}: SicknessSchemeSelectorProps) => {
  const [schemes, setSchemes] = useState<SicknessScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  const { canEditWorkPattern } = usePermissions();
  
  useEffect(() => {
    fetchSicknessSchemes();
  }, [currentCompany?.id]);
  
  const fetchSicknessSchemes = async () => {
    try {
      setLoading(true);
      
      if (!currentCompany?.id) {
        console.log("No current company selected for sickness schemes");
        setSchemes([]);
        return;
      }

      const { data, error } = await supabase
        .from('sickness_schemes')
        .select('id, name, eligibility_rules, company_id')
        .eq('company_id', currentCompany.id);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const transformedData: SicknessScheme[] = data.map(item => ({
          id: item.id,
          name: item.name,
          eligibilityRules: item.eligibility_rules ? JSON.parse(item.eligibility_rules as string) : null
        }));
        setSchemes(transformedData);
      } else {
        setSchemes([]);
      }
    } catch (error: any) {
      console.error("Error fetching sickness schemes:", error.message);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSchemeChange = async (schemeId: string) => {
    if (!canEditWorkPattern) return;
    
    if (schemeId === "none") {
      schemeId = null;
    }
    
    setLoading(true);
    try {
      const success = await updateEmployeeField("sickness_scheme_id", schemeId);
      
      if (success) {
        toast({
          title: "Sickness scheme updated",
          description: "The employee's sickness scheme has been updated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating sickness scheme",
        description: "There was an error updating the sickness scheme. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const selectValue = currentSchemeId || "none";
  
  return (
    <div className="space-y-2">
      <Label htmlFor="sickness-scheme">Sickness Policy Scheme</Label>
      <Select
        value={selectValue}
        onValueChange={handleSchemeChange}
        disabled={!canEditWorkPattern || loading}
      >
        <SelectTrigger id="sickness-scheme" className="w-full">
          <SelectValue placeholder="Select a sickness scheme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No scheme selected</SelectItem>
          {schemes.length > 0 ? (
            schemes.map(scheme => (
              <SelectItem key={scheme.id} value={scheme.id}>
                {scheme.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-schemes-available" disabled>
              No schemes configured for this company
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {schemes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No sickness schemes have been configured for this company. 
          Contact an administrator to set up company sickness policies.
        </p>
      )}
    </div>
  );
};
