
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SicknessScheme } from "./types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers/CompanyProvider";

interface SicknessSchemeSelectorProps {
  employeeId: string;
  currentSchemeId: string | null;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const SicknessSchemeSelector = ({
  employeeId,
  currentSchemeId,
  isAdmin,
  updateEmployeeField
}: SicknessSchemeSelectorProps) => {
  const [schemes, setSchemes] = useState<SicknessScheme[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  
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
        // Transform the data to match our SicknessScheme interface
        const transformedData: SicknessScheme[] = data.map(item => ({
          id: item.id,
          name: item.name,
          // Parse the JSON eligibility rules
          eligibilityRules: item.eligibility_rules ? JSON.parse(item.eligibility_rules as string) : null
        }));
        setSchemes(transformedData);
      } else {
        // No company-specific schemes found
        setSchemes([]);
      }
    } catch (error: any) {
      console.error("Error fetching sickness schemes:", error.message);
      // Set empty schemes on error
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSchemeChange = async (schemeId: string) => {
    if (!isAdmin) return;
    
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
  
  return (
    <div className="space-y-2">
      <Label htmlFor="sickness-scheme">Sickness Policy Scheme</Label>
      <Select
        value={currentSchemeId || ""}
        onValueChange={handleSchemeChange}
        disabled={!isAdmin || loading}
      >
        <SelectTrigger id="sickness-scheme" className="w-full">
          <SelectValue placeholder={
            schemes.length === 0 
              ? "No schemes available for this company" 
              : "Select a sickness scheme"
          } />
        </SelectTrigger>
        <SelectContent>
          {schemes.length === 0 ? (
            <SelectItem value="" disabled>
              No schemes configured for this company
            </SelectItem>
          ) : (
            schemes.map(scheme => (
              <SelectItem key={scheme.id} value={scheme.id}>
                {scheme.name}
              </SelectItem>
            ))
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
