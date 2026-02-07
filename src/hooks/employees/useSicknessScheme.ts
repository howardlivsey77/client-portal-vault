import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SicknessScheme } from "@/components/employees/details/work-pattern/types";

/**
 * Hook to fetch the sickness scheme for a given scheme ID.
 * Extracts the inline Supabase query previously in EmployeeDetails.tsx.
 */
export const useSicknessScheme = (schemeId: string | null | undefined) => {
  const [sicknessScheme, setSicknessScheme] = useState<SicknessScheme | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchScheme = async () => {
      if (!schemeId) {
        setSicknessScheme(null);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sickness_schemes')
          .select('id, name, eligibility_rules')
          .eq('id', schemeId)
          .single();

        if (error) throw error;

        if (data) {
          setSicknessScheme({
            id: data.id,
            name: data.name,
            eligibilityRules: data.eligibility_rules
              ? JSON.parse(data.eligibility_rules as string)
              : null,
          });
        }
      } catch (error) {
        console.error("Error fetching sickness scheme:", error);
        setSicknessScheme(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [schemeId]);

  return { sicknessScheme, loading };
};
