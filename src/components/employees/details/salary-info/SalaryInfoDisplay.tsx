
import { Employee } from "@/types";
import { formatCurrency, calculateMonthlySalary, roundToTwoDecimals } from "@/lib/formatters";

interface SalaryInfoDisplayProps {
  employee: Employee;
}

export const SalaryInfoDisplay = ({ employee }: SalaryInfoDisplayProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hours Per Week</p>
          <p className="font-medium">{employee.hours_per_week ?? "40"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Monthly Salary</p>
          <p className="font-medium">
            {formatCurrency(calculateMonthlySalary(employee.hourly_rate ?? 0, employee.hours_per_week ?? 40))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Default Hourly Rate</p>
          <p className="font-medium">
            £{roundToTwoDecimals(employee.hourly_rate) ?? "0.00"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Standard Overtime (GBP)</p>
          <p className="font-medium">
            {employee.rate_2 ? `£${roundToTwoDecimals(employee.rate_2)}` : "Not set"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Enhanced Access (GBP)</p>
          <p className="font-medium">
            {employee.rate_3 ? `£${roundToTwoDecimals(employee.rate_3)}` : "Not set"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Rate 4 (Optional)</p>
          <p className="font-medium">
            {employee.rate_4 ? `£${roundToTwoDecimals(employee.rate_4)}` : "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
};
