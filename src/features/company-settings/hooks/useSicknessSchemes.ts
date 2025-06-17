
import { useState, useEffect } from "react";
import { SicknessScheme } from "../types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { useCompany } from "@/providers/CompanyProvider";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

export const useSicknessSchemes = () => {
  const [schemes, setSchemes] = useState<SicknessScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();

  // Function to migrate old eligibility rules to new format
  const migrateEligibilityRules = (rules: any[]): EligibilityRule[] => {
    return rules.map(rule => {
      // If old format with companyPaidDays, migrate to new format
      if (rule.companyPaidDays !== undefined && rule.fullPayDays === undefined) {
        return {
          ...rule,
          fullPayDays: rule.companyPaidDays || 0,
          halfPayDays: 0
        };
      }
      // If new format or already migrated, ensure all fields exist
      return {
        ...rule,
        fullPayDays: rule.fullPayDays || 0,
        halfPayDays: rule.halfPayDays || 0
      };
    });
  };

  const fetchSicknessSchemes = async () => {
    try {
      setLoading(true);
      
      if (!currentCompany?.id) {
        console.log("No current company selected");
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
      
      if (data) {
        // Transform the data to match our SicknessScheme interface
        const transformedData: SicknessScheme[] = data.map(item => ({
          id: item.id,
          name: item.name,
          // Parse and migrate the JSON eligibility rules
          eligibilityRules: item.eligibility_rules ? 
            migrateEligibilityRules(JSON.parse(item.eligibility_rules as string)) : 
            null
        }));
        setSchemes(transformedData);
      }
    } catch (error: any) {
      console.error("Error fetching sickness schemes:", error.message);
      toast.error("Error loading schemes", {
        description: "There was a problem loading sickness schemes. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const saveScheme = async (scheme: SicknessScheme) => {
    try {
      if (!currentCompany?.id) {
        return { 
          success: false, 
          message: "No company selected. Please select a company first."
        };
      }

      if (scheme.id) {
        // Update existing scheme
        const { error } = await supabase
          .from('sickness_schemes')
          .update({ 
            name: scheme.name, 
            // Stringify the eligibility rules for storage
            eligibility_rules: JSON.stringify(scheme.eligibilityRules) as Json
          })
          .eq('id', scheme.id)
          .eq('company_id', currentCompany.id); // Ensure we only update schemes for current company
          
        if (error) throw error;
        
        setSchemes(schemes.map(s => s.id === scheme.id ? scheme : s));
        return { success: true, message: `${scheme.name} has been updated successfully.` };
      } else {
        // Add new scheme with company_id
        const { data, error } = await supabase
          .from('sickness_schemes')
          .insert({ 
            name: scheme.name, 
            company_id: currentCompany.id,
            // Stringify the eligibility rules for storage
            eligibility_rules: JSON.stringify(scheme.eligibilityRules) as Json
          })
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          const newScheme: SicknessScheme = {
            id: data[0].id,
            name: data[0].name,
            // Parse the eligibility rules
            eligibilityRules: data[0].eligibility_rules ? JSON.parse(data[0].eligibility_rules as string) : null
          };
          setSchemes([...schemes, newScheme]);
          return { success: true, message: `${scheme.name} has been added successfully.` };
        }
      }
      return { success: false, message: "Operation completed but with unexpected results." };
    } catch (error: any) {
      console.error("Error saving scheme:", error.message);
      return { 
        success: false, 
        message: "There was a problem saving the sickness scheme. Please try again."
      };
    }
  };

  useEffect(() => {
    fetchSicknessSchemes();
  }, [currentCompany?.id]);

  return {
    schemes,
    loading,
    fetchSicknessSchemes,
    saveScheme
  };
};
