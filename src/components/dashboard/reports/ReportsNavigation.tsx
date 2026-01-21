
import React, { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartBar } from "lucide-react";
import { PaymentHoursRatesReport } from "./PaymentHoursRatesReport";
import { PayslipReport } from "./payslip";
import { ImportedVsPaidReport } from "@/components/reports/imported-vs-paid";
import { PayrollSummaryReport } from "./payroll-summary";

type ReportType = "payment-hours-rates" | "payslips" | "payroll-summary" | "imported-vs-paid" | "gp1" | "sd55" | "p32";

export function ReportsNavigation() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("payment-hours-rates");

  const handleReportChange = (value: string) => {
    setSelectedReport(value as ReportType);
  };

  // Render the selected report component
  const renderReportComponent = () => {
    switch (selectedReport) {
      case "payment-hours-rates":
        return <PaymentHoursRatesReport />;
      case "payslips":
        return <PayslipReport />;
      case "imported-vs-paid":
        return <ImportedVsPaidReport />;
      case "payroll-summary":
        return <PayrollSummaryReport />;
      case "gp1":
        return <div className="p-6 text-center text-muted-foreground">GP1 Report - Coming Soon</div>;
      case "sd55":
        return <div className="p-6 text-center text-muted-foreground">SD55 Report - Coming Soon</div>;
      case "p32":
        return <div className="p-6 text-center text-muted-foreground">P32 Report - Coming Soon</div>;
      default:
        return <PaymentHoursRatesReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="monday-section-title flex items-center gap-2">
          <ChartBar className="h-5 w-5" />
          Payroll Reports
        </h2>
        
        <div className="w-72">
          <Select value={selectedReport} onValueChange={handleReportChange}>
            <SelectTrigger className="bg-white border-monday-border">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payment-hours-rates">Payment Hours and Rates</SelectItem>
              <SelectItem value="payslips">Payslips</SelectItem>
              <SelectItem value="imported-vs-paid">Imported vs Paid Report</SelectItem>
              <SelectItem value="payroll-summary">Payroll Summary Report</SelectItem>
              <SelectItem value="gp1">GP1</SelectItem>
              <SelectItem value="sd55">SD55</SelectItem>
              <SelectItem value="p32">P32</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {renderReportComponent()}
    </div>
  );
}
