
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartBar, ChevronDown } from "lucide-react";
import { EmployeeChangesReport } from "./EmployeeChangesReport";
import { PaymentHoursRatesReport } from "./PaymentHoursRatesReport";
import { EmployeeDetailsReport } from "./employee-details/EmployeeDetailsReport";
import { PayslipReport } from "./payslip";
import { ImportedVsPaidReport } from "@/components/reports/imported-vs-paid";

type ReportType = "employee-changes" | "employee-details" | "payment-hours-rates" | "payslips" | "payroll-summary" | "time-off" | "performance" | "imported-vs-paid";

export function ReportsNavigation() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("employee-changes");

  const handleReportChange = (value: string) => {
    setSelectedReport(value as ReportType);
  };

  // Render the selected report component
  const renderReportComponent = () => {
    switch (selectedReport) {
      case "employee-changes":
        return <EmployeeChangesReport />;
      case "employee-details":
        return <EmployeeDetailsReport />;
      case "payment-hours-rates":
        return <PaymentHoursRatesReport />;
      case "payslips":
        return <PayslipReport />;
      case "imported-vs-paid":
        return <ImportedVsPaidReport />;
      case "payroll-summary":
        return <div className="p-6 text-center text-muted-foreground">Payroll Summary Report - Coming Soon</div>;
      case "time-off":
        return <div className="p-6 text-center text-muted-foreground">Time Off Report - Coming Soon</div>;
      case "performance":
        return <div className="p-6 text-center text-muted-foreground">Performance Report - Coming Soon</div>;
      default:
        return <EmployeeChangesReport />;
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
              <SelectItem value="employee-changes">Employee Changes Report</SelectItem>
              <SelectItem value="employee-details">Employee Details Report</SelectItem>
              <SelectItem value="payment-hours-rates">Payment Hours and Rates</SelectItem>
              <SelectItem value="payslips">Payslips</SelectItem>
              <SelectItem value="imported-vs-paid">Imported vs Paid Report</SelectItem>
              <SelectItem value="payroll-summary">Payroll Summary Report</SelectItem>
              <SelectItem value="time-off">Time Off Report</SelectItem>
              <SelectItem value="performance">Performance Review Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {renderReportComponent()}
    </div>
  );
}
