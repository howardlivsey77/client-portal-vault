import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SicknessReport } from "./sickness/SicknessReport";

type ReportType = "sickness" | "employee-details" | "hours-rates";

export function ClientReportsNavigation() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("sickness");

  const handleReportChange = (value: string) => {
    setSelectedReport(value as ReportType);
  };

  const renderReportComponent = () => {
    switch (selectedReport) {
      case "sickness":
        return <SicknessReport />;
      case "employee-details":
        return (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Employee Details Report</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        );
      case "hours-rates":
        return (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Employee Hours and Rates Report</p>
            <p className="text-sm">Coming soon...</p>
          </div>
        );
      default:
        return <SicknessReport />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Selector */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Select Report Type</h2>
          <p className="text-sm text-muted-foreground">Choose a report to view and analyze</p>
        </div>
        <Select value={selectedReport} onValueChange={handleReportChange}>
          <SelectTrigger className="w-full sm:w-[320px]">
            <SelectValue placeholder="Select a report" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sickness">Sickness Report</SelectItem>
            <SelectItem value="employee-details">Employee Details Report</SelectItem>
            <SelectItem value="hours-rates">Employee Hours and Rates Report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Render Selected Report */}
      <div className="mt-6">
        {renderReportComponent()}
      </div>
    </div>
  );
}
