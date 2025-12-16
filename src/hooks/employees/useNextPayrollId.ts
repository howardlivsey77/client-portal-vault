import { useState, useEffect } from "react";
import { useCompany } from "@/providers";
import { getNextPayrollId } from "@/services/employees/employeeService";

export const useNextPayrollId = (isEditMode: boolean) => {
  const { currentCompany } = useCompany();
  const [suggestedPayrollId, setSuggestedPayrollId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNextId = async () => {
      if (isEditMode || !currentCompany?.id) return;
      
      setLoading(true);
      try {
        const nextId = await getNextPayrollId(currentCompany.id);
        setSuggestedPayrollId(nextId);
      } catch (error) {
        console.error("Error fetching next payroll ID:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNextId();
  }, [isEditMode, currentCompany?.id]);

  return { suggestedPayrollId, loading };
};
