import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Employee, SicknessRecord, SicknessEntitlementSummary } from "@/types";
import { generateSicknessReportPDF } from "@/utils";
import { toast } from "@/hooks";
import { useCompany } from "@/providers";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

interface SicknessReportPDFButtonProps {
  employee: Employee;
  sicknessRecords: SicknessRecord[];
  entitlementSummary: SicknessEntitlementSummary | null;
  eligibilityRules?: EligibilityRule[] | null;
  workingDaysPerWeek?: number;
  disabled?: boolean;
}

export function SicknessReportPDFButton({ 
  employee, 
  sicknessRecords, 
  entitlementSummary,
  eligibilityRules,
  workingDaysPerWeek = 5,
  disabled = false 
}: SicknessReportPDFButtonProps) {
  const { currentCompany } = useCompany();
  
  const handleExportPDF = async () => {
    try {
      const filename = `sickness-report-${employee.first_name}-${employee.last_name}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Build historical entitlement options if we have the data
      const entitlementOptions = employee.hire_date && eligibilityRules?.length
        ? {
            hireDate: employee.hire_date,
            eligibilityRules,
            workingDaysPerWeek
          }
        : undefined;
      
      await generateSicknessReportPDF(
        employee, 
        sicknessRecords, 
        entitlementSummary, 
        currentCompany?.logo_url, 
        filename,
        entitlementOptions
      );
      
      toast({
        title: "PDF exported successfully",
        description: "Sickness report has been downloaded.",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "Failed to export PDF",
        description: "An error occurred while generating the sickness report.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex gap-2" 
      onClick={handleExportPDF}
      disabled={disabled}
    >
      <FileText size={16} />
      Export PDF
    </Button>
  );
}