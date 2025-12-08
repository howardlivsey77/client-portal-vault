
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks";
import { Download } from "lucide-react";
import { generatePayslip } from "@/utils/payslipGenerator";
import { PayrollResult } from "@/services/payroll/types";
import { Employee } from "@/types/employee-types";

interface PayslipDownloaderProps {
  calculationResult: PayrollResult | null;
  payPeriodDescription: string;
  employee?: Employee;  // Make employee optional to maintain backward compatibility
}

export function PayslipDownloader({ calculationResult, payPeriodDescription, employee }: PayslipDownloaderProps) {
  const { toast } = useToast();

  const handleDownloadPayslip = () => {
    if (!calculationResult) return;
    
    try {
      const filename = `${calculationResult.employeeName.replace(/\s+/g, '-').toLowerCase()}-payslip-${payPeriodDescription.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      generatePayslip(calculationResult, payPeriodDescription, filename);
      
      toast({
        title: "Payslip Generated",
        description: "Your payslip has been downloaded."
      });
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Generation Error",
        description: "There was an error generating the payslip.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleDownloadPayslip}
      variant="secondary"
    >
      <Download className="mr-2 h-4 w-4" />
      Download Payslip
    </Button>
  );
}
