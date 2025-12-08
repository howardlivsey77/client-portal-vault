import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Employee } from "@/types/employee-types";
import { SicknessRecord, SicknessEntitlementSummary } from "@/types/sickness";
import { generateSicknessReportPDF } from "@/utils/pdfExport";
import { toast } from "@/hooks";
import { useCompany } from "@/providers/CompanyProvider";

interface SicknessReportPDFButtonProps {
  employee: Employee;
  sicknessRecords: SicknessRecord[];
  entitlementSummary: SicknessEntitlementSummary | null;
  disabled?: boolean;
}

export function SicknessReportPDFButton({ 
  employee, 
  sicknessRecords, 
  entitlementSummary, 
  disabled = false 
}: SicknessReportPDFButtonProps) {
  const { currentCompany } = useCompany();
  
  const handleExportPDF = async () => {
    try {
      const filename = `sickness-report-${employee.first_name}-${employee.last_name}-${new Date().toISOString().split('T')[0]}.pdf`;
      await generateSicknessReportPDF(employee, sicknessRecords, entitlementSummary, currentCompany?.logo_url, filename);
      
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