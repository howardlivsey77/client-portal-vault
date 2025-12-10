import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers/CompanyProvider";
import { parseHMRCXml, validateHMRCXml, HMRCParseResult } from "@/utils/hmrcXmlParser";
import { createNewEmployees } from "@/services/employees/import";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { toast } from "sonner";

export interface UseHMRCImportReturn {
  loading: boolean;
  parsing: boolean;
  parseResult: HMRCParseResult | null;
  existingEmployeesCount: number | null;
  error: string | null;
  processFile: (file: File) => Promise<void>;
  executeImport: () => Promise<boolean>;
  reset: () => void;
}

export const useHMRCImport = (): UseHMRCImportReturn => {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<HMRCParseResult | null>(null);
  const [existingEmployeesCount, setExistingEmployeesCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkExistingEmployees = useCallback(async () => {
    if (!currentCompany?.id) return;

    const { count, error: countError } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("company_id", currentCompany.id);

    if (countError) {
      console.error("Error checking existing employees:", countError);
      return;
    }

    setExistingEmployeesCount(count || 0);
  }, [currentCompany?.id]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setParsing(true);
    setParseResult(null);

    try {
      // Read file content
      const content = await file.text();

      // Validate XML format
      const validation = validateHMRCXml(content);
      if (!validation.valid) {
        setError(validation.message);
        setParsing(false);
        return;
      }

      // Parse the XML
      const result = parseHMRCXml(content);
      
      if (result.errors.length > 0) {
        setError(result.errors.join(", "));
      }
      
      if (result.employees.length === 0) {
        setError("No valid employee data found in the file");
        setParsing(false);
        return;
      }

      setParseResult(result);
      
      // Check for existing employees
      await checkExistingEmployees();
    } catch (err) {
      setError(`Failed to process file: ${err}`);
    } finally {
      setParsing(false);
    }
  }, [checkExistingEmployees]);

  const executeImport = useCallback(async (): Promise<boolean> => {
    if (!parseResult || parseResult.employees.length === 0) {
      setError("No employees to import");
      return false;
    }

    if (!currentCompany?.id) {
      setError("No company selected. Please select a company first.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to import employees");
        return false;
      }

      // Use the existing createNewEmployees service
      await createNewEmployees(parseResult.employees, user.id);
      
      toast.success(`Successfully imported ${parseResult.employees.length} employees`);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to import employees";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [parseResult, currentCompany?.id]);

  const reset = useCallback(() => {
    setParseResult(null);
    setError(null);
    setLoading(false);
    setParsing(false);
    setExistingEmployeesCount(null);
  }, []);

  return {
    loading,
    parsing,
    parseResult,
    existingEmployeesCount,
    error,
    processFile,
    executeImport,
    reset
  };
};
