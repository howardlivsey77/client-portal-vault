
import { useState } from "react";
import { toast } from "@/hooks";
import { matchEmployees, applyUserMappings, EmployeeMatchingResults } from "@/services/payroll/employeeMatching";
import { saveAliases } from "@/services/payroll/employeeNameAliases";
import { ExtraHoursSummary } from "../types";
import { setProcessedPayrollData } from "./services/payrollDataService";

export function useEmployeeMatching(companyId?: string) {
  const [matchingResults, setMatchingResults] = useState<EmployeeMatchingResults | null>(null);
  const [showEmployeeMapping, setShowEmployeeMapping] = useState(false);

  const performEmployeeMatching = async (processedData: ExtraHoursSummary) => {
    try {
      const matching = await matchEmployees(processedData.employeeDetails, companyId);
      setMatchingResults(matching);
      
      const needsMapping = matching.fuzzyMatches.length > 0 || matching.unmatchedEmployees.length > 0;
      if (needsMapping) {
        console.log("Employee mapping required:", {
          fuzzy: matching.fuzzyMatches.length,
          unmatched: matching.unmatchedEmployees.length
        });
      }
      
      // Show toast if aliases were used
      if (matching.aliasMatchCount > 0) {
        toast({
          title: "Saved mappings applied",
          description: `${matching.aliasMatchCount} employee${matching.aliasMatchCount !== 1 ? 's' : ''} matched using saved aliases.`,
        });
      }
      
      return needsMapping;
    } catch (error) {
      console.error("Error matching employees:", error);
      toast({
        title: "Error matching employees",
        description: "There was a problem matching employees. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleEmployeeMappingConfirm = async (
    userMappings: Record<string, string>,
    rememberMappings: Record<string, boolean>,
    processedData: ExtraHoursSummary
  ) => {
    if (!matchingResults) return null;
    
    console.log("User mappings confirmed:", userMappings);
    console.log("Remember mappings:", rememberMappings);
    
    // Save aliases for mappings that should be remembered
    if (companyId) {
      const aliasesToSave = Object.entries(userMappings)
        .filter(([sourceName, _]) => rememberMappings[sourceName] !== false)
        .map(([sourceName, employeeId]) => ({ sourceName, employeeId }));
      
      if (aliasesToSave.length > 0) {
        const result = await saveAliases(companyId, aliasesToSave);
        if (result.saved > 0) {
          console.log(`Saved ${result.saved} employee name aliases for future imports`);
          toast({
            title: "Mappings saved",
            description: `${result.saved} mapping${result.saved !== 1 ? 's' : ''} will be remembered for future imports.`,
          });
        }
      }
    }
    
    // Apply user mappings to get final employee data
    const finalEmployeeData = applyUserMappings(matchingResults, userMappings);
    
    // Update processed data with mapped employee information
    const updatedProcessedData = {
      ...processedData,
      employeeDetails: finalEmployeeData,
      employeeCount: finalEmployeeData.length
    };
    
    setProcessedPayrollData(updatedProcessedData);
    setShowEmployeeMapping(false);
    
    toast({
      title: "Employee mapping completed",
      description: `${finalEmployeeData.length} employees successfully mapped.`,
    });
    
    return updatedProcessedData;
  };

  const handleEmployeeMappingCancel = () => {
    setShowEmployeeMapping(false);
    toast({
      title: "Employee mapping cancelled",
      description: "Returning to previous step.",
      variant: "destructive",
    });
  };

  const showMappingDialog = () => {
    setShowEmployeeMapping(true);
  };

  const resetMatching = () => {
    setMatchingResults(null);
    setShowEmployeeMapping(false);
  };

  return {
    matchingResults,
    showEmployeeMapping,
    performEmployeeMatching,
    handleEmployeeMappingConfirm,
    handleEmployeeMappingCancel,
    showMappingDialog,
    resetMatching,
  };
}
