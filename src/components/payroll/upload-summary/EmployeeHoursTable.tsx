
import { formatCurrency, roundToTwoDecimals } from "@/lib/formatters";
import { EmployeeHoursData } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeHoursTableProps {
  employeeDetails: EmployeeHoursData[];
}

export function EmployeeHoursTable({ employeeDetails }: EmployeeHoursTableProps) {
  if (employeeDetails.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-md mt-4">
      <div className="p-3 border-b bg-muted/40">
        <h3 className="text-sm font-medium">Employee Hours Breakdown</h3>
      </div>
      <div className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payroll ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Rate Type</TableHead>
              <TableHead className="text-right">Hourly Rate</TableHead>
              <TableHead className="text-right">Extra Hours</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeDetails.map((employee, index) => {
              const total = roundToTwoDecimals((employee.rateValue || 0) * employee.extraHours) || 0;
              return (
                <TableRow key={`${employee.employeeId || employee.employeeName}-${employee.rateType || 'standard'}-${index}`}>
                  <TableCell>{employee.payrollId || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{employee.employeeName}</TableCell>
                  <TableCell className="text-right">{employee.rateType || 'Standard'}</TableCell>
                  <TableCell className="text-right">
                    {employee.rateValue ? formatCurrency(roundToTwoDecimals(employee.rateValue) || 0) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">{employee.extraHours}</TableCell>
                  <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
