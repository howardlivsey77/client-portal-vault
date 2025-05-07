
import { formatCurrency, formatDate, roundToTwoDecimals } from "@/lib/formatters";
import { Employee } from "@/hooks/useEmployeeDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PersonalInfoCardProps {
  employee: Employee;
}

export const PersonalInfoCard = ({ employee }: PersonalInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <h3 className="font-semibold text-lg">
              {employee.first_name} {employee.last_name}
            </h3>
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">Department</p>
            <p>{employee.department}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <p>{employee.gender || "Not specified"}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Payroll ID</p>
            <p>{employee.payroll_id || "Not assigned"}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
            <p>{employee.date_of_birth ? formatDate(employee.date_of_birth) : "Not provided"}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Hire Date</p>
            <p>{employee.hire_date ? formatDate(employee.hire_date) : "Not provided"}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Hours Per Week</p>
            <p>{employee.hours_per_week || 40}</p>
          </div>
          
          <div className="mt-2">
            <p className="text-sm font-medium text-muted-foreground">Hourly Rates</p>
            <p>Default Rate: {formatCurrency(roundToTwoDecimals(employee.hourly_rate || 0) || 0)}</p>
            {employee.rate_2 && <p>Rate 2: {formatCurrency(roundToTwoDecimals(employee.rate_2) || 0)}</p>}
            {employee.rate_3 && <p>Rate 3: {formatCurrency(roundToTwoDecimals(employee.rate_3) || 0)}</p>}
            {employee.rate_4 && <p>Rate 4: {formatCurrency(roundToTwoDecimals(employee.rate_4) || 0)}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
