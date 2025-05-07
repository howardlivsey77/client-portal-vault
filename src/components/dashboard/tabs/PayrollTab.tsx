
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

interface PayrollTabProps {
  onOpenPayrollWizard: () => void;
}

export function PayrollTab({ onOpenPayrollWizard }: PayrollTabProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Receipt className="h-16 w-16 text-monday-blue mb-4" />
      <h3 className="text-2xl font-medium mb-2">Payroll Input</h3>
      <p className="text-center text-muted-foreground max-w-md mb-6">
        Begin the payroll input process by uploading your extra hours data and other payroll information.
      </p>
      <Button 
        size="lg" 
        onClick={onOpenPayrollWizard}
        className="bg-monday-green hover:bg-monday-green/90"
      >
        <Receipt className="mr-2 h-5 w-5" />
        Start Payroll Input
      </Button>
    </div>
  );
}
