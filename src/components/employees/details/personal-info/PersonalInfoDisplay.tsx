
import { formatDate, formatLengthOfService } from "@/lib/formatters";
import { CalendarIcon } from "lucide-react";
import { Employee } from "@/types/employeeDetails";

interface PersonalInfoDisplayProps {
  employee: Employee;
}

export const PersonalInfoDisplay = ({ employee }: PersonalInfoDisplayProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">First Name</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {employee.first_name}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Last Name</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {employee.last_name}
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Department</div>
        <div className="p-2.5 bg-muted rounded border border-border flex items-center justify-between">
          {employee.department}
          <span className="text-muted-foreground">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Cost Centre</div>
        <div className="p-2.5 bg-muted rounded border border-border flex items-center justify-between">
          {employee.cost_centre || "Not assigned"}
          <span className="text-muted-foreground">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Gender</div>
        <div className="p-2.5 bg-muted rounded border border-border flex items-center justify-between">
          {employee.gender || "Not specified"}
          <span className="text-muted-foreground">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
          </span>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Payroll ID</div>
        <div className="p-2.5 bg-muted rounded border border-border">
          {employee.payroll_id || "Not assigned"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Date of Birth</div>
          <div className="p-2.5 bg-muted rounded border border-border flex items-center justify-between">
            {employee.date_of_birth ? formatDate(employee.date_of_birth) : "Not provided"}
            <span className="text-muted-foreground">
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Hire Date</div>
          <div className="p-2.5 bg-muted rounded border border-border flex items-center justify-between">
            {formatDate(employee.hire_date)}
            <span className="text-muted-foreground">
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </span>
          </div>
        </div>
      </div>
      
      <div>
        <div className="text-sm font-medium mb-2">Length of Service</div>
        <div className="p-2.5 bg-muted rounded border border-border">
          {formatLengthOfService(employee.hire_date)}
        </div>
      </div>
    </div>
  );
};
