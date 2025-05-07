
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExtraHoursSummary } from "../types";
import { generateExtraHoursPDF } from "@/utils/pdfExport";
import { toast } from "@/hooks/use-toast";

interface ExportPDFButtonProps {
  summary: ExtraHoursSummary;
  filename?: string;
}

export function ExportPDFButton({ summary, filename }: ExportPDFButtonProps) {
  const handleExportPDF = () => {
    try {
      generateExtraHoursPDF(summary, filename);
      toast({
        title: "PDF exported successfully",
        description: "Your extra hours summary has been downloaded.",
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

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex gap-2" 
      onClick={handleExportPDF}
    >
      <Download size={16} />
      Export PDF
    </Button>
  );
}
