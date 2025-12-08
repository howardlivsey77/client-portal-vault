
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExtraHoursSummary } from "../types";
import { generateExtraHoursPDF } from "@/utils/pdfExport";
import { toast } from "@/hooks";

interface ExportPDFButtonProps {
  summary: ExtraHoursSummary;
  filename?: string;
}

export function ExportPDFButton({ summary, filename }: ExportPDFButtonProps) {
  const handleExportPDF = () => {
    try {
      generateExtraHoursPDF(summary, filename);
      const isComplete = filename?.includes('complete');
      toast({
        title: "PDF exported successfully",
        description: isComplete 
          ? "Your complete payroll report has been downloaded."
          : "Your extra hours summary has been downloaded.",
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast({
        title: "Failed to export PDF",
        description: "An error occurred while generating the PDF.",
        variant: "destructive",
      });
    }
  };

  const isComplete = filename?.includes('complete');
  const buttonText = isComplete ? "Export Complete Report" : "Export Extra Hours PDF";

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex gap-2" 
      onClick={handleExportPDF}
    >
      <Download size={16} />
      {buttonText}
    </Button>
  );
}
