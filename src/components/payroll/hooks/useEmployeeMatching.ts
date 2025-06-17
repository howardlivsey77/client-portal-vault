
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { matchEmployees, applyUserMappings, EmployeeMatchingResults } from "@/services/payroll/employeeMatching";
import { ExtraHoursSummary } from "../types";
import { setProcessedPayrollData } from "./services/payrollDataService";

export function useEmployeeMatching() {
  const [matchingResults, setMatchingResults] = useState<EmployeeMatchingResults | null>(null);
  const [showEmployeeMapping, setShowEmployeeMapping] = useState(false);

  const performEmployeeMatching = async (processedData: ExtraHoursSummary) => {
    try {
      const matching = await matchEmployees(processedData.employeeDetails);
      setMatchingResults(matching);
      
      const needsMapping = matching.fuzzyMatches.length > 0 || matching.unmatchedEmployees.length > 0;
      if (needsMapping) {
        console.log("Employee mapping required:", {
          fuzzy: matching.fuzzyMatches.length,
          unmatched: matching.unmatchedEmployees.length
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

  const handleEmployeeMappingConfirm = (userMappings: Record<string, string>, processedData: ExtraHoursSummary) => {
    if (!matchingResults) return null;
    
    console.log("User mappings confirmed:", userMappings);
    
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
