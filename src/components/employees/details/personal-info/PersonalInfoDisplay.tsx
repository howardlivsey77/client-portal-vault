
import { formatCurrency, formatDate, formatLengthOfService, roundToTwoDecimals } from "@/lib/formatters";
import { CalendarIcon } from "lucide-react";
import { Employee } from "@/types/employeeDetails";

interface PersonalInfoDisplayProps {
  employee: Employee;
}

export const PersonalInfoDisplay = ({ employee }: PersonalInfoDisplayProps) => {
  // Calculate monthly salary if not stored in employee record
  const getMonthlySalary = () => {
    // If we have the monthly_salary field use it
    if (employee.monthly_salary !== undefined) {
      return employee.monthly_salary;
    }
    
    // Otherwise calculate it: (weekly hours × hourly rate) ÷ 7 × 365 ÷ 12
    const hoursPerWeek = employee.hours_per_week || 0;
    const hourlyRate = employee.hourly_rate || 0;
    
    const monthlySalary = (hoursPerWeek * hourlyRate) / 7 * 365 / 12;
    return roundToTwoDecimals(monthlySalary);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">First Name</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {employee.first_name}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Last Name</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {employee.last_name}
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Department</div>
        <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
          {employee.department}
          <span className="text-gray-400">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Gender</div>
        <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
          {employee.gender || "Not specified"}
          <span className="text-gray-400">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Payroll ID</div>
        <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
          {employee.payroll_id || "Not assigned"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Date of Birth</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
            {employee.date_of_birth ? formatDate(employee.date_of_birth) : "Not provided"}
            <span className="text-gray-400">
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Hire Date</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
            {formatDate(employee.hire_date)}
            <span className="text-gray-400">
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </span>
          </div>
        </div>
      </div>
      
      <div>
        <div className="text-sm font-medium mb-2">Length of Service</div>
        <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
          {formatLengthOfService(employee.hire_date)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Hours Per Week</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {employee.hours_per_week || "40"}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Monthly Salary</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {formatCurrency(getMonthlySalary())}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Default Hourly Rate</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {formatCurrency(roundToTwoDecimals(employee.hourly_rate || 0))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Standard Overtime (GBP)</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {employee.rate_2 ? formatCurrency(roundToTwoDecimals(employee.rate_2)) : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Extended Access (GBP)</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {employee.rate_3 ? formatCurrency(roundToTwoDecimals(employee.rate_3)) : ""}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Rate 4 (Optional)</div>
          <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
            {employee.rate_4 ? formatCurrency(roundToTwoDecimals(employee.rate_4)) : ""}
          </div>
        </div>
      </div>
    </div>
  );
};
