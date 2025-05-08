
import React from "react";
import { Card } from "@/components/ui/card";
import { ChartBar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmployeeHoursData } from "@/components/payroll/types";

interface PaymentHoursRatesReportProps {
  standalone?: boolean;
  data?: EmployeeHoursData[];
}

export function PaymentHoursRatesReport({ standalone = false, data = [] }: PaymentHoursRatesReportProps) {
  // If no data is provided, display a message
  const hasData = data && data.length > 0;
  
  return (
    <Card className="shadow-sm">
      {standalone && (
        <div className="p-6 border-b flex items-center gap-2">
          <ChartBar className="h-5 w-5" />
          <h2 className="monday-section-title">Payment Hours and Rates Report</h2>
        </div>
      )}
      
      <div className="p-6">
        {!hasData ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No payment data available.</p>
            <p className="text-sm mt-2">
              Please upload an extra hours file through the Payroll section to see the report.
            </p>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payroll ID</TableHead>
                  <TableHead>Payment Reference</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={`${item.employeeId || item.payrollId}-${item.rateType}-${index}`}>
                    <TableCell>{item.payrollId || "N/A"}</TableCell>
                    <TableCell>{item.rateType || "Standard"}</TableCell>
                    <TableCell className="text-right">{item.extraHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {item.rateValue ? `£${item.rateValue.toFixed(2)}` : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
}
