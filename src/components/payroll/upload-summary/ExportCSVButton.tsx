
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExtraHoursSummary } from "../types";
import { generateExtraHoursCSV } from "@/utils/csvExport";
import { toast } from "@/hooks/use-toast";

interface ExportCSVButtonProps {
  summary: ExtraHoursSummary;
  filename?: string;
}

export function ExportCSVButton({ summary, filename }: ExportCSVButtonProps) {
  const handleExportCSV = () => {
    try {
      generateExtraHoursCSV(summary, filename);
      toast({
        title: "CSV exported successfully",
        description: "Your extra hours summary has been downloaded as a CSV file.",
      });
    } catch (err) {
      console.error("Error generating CSV:", err);
      toast({
        title: "Failed to export CSV",
        description: "An error occurred while generating the CSV file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex gap-2" 
      onClick={handleExportCSV}
    >
      <Download size={16} />
      Export CSV
    </Button>
  );
}
