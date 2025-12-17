import { P11EmployeeDetails, P11CompanyDetails } from "@/hooks/reports/useP11Report";
import { format } from "date-fns";

interface P11ReportHeaderProps {
  employee: P11EmployeeDetails;
  company: P11CompanyDetails;
  taxYear: string;
}

export function P11ReportHeader({ employee, company, taxYear }: P11ReportHeaderProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold">P11 Deductions Working Sheet</h2>
          <p className="text-muted-foreground text-sm">Tax Year {taxYear}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{company.name}</p>
          {company.payeRef && (
            <p className="text-sm text-muted-foreground">PAYE Ref: {company.payeRef}</p>
          )}
          {company.accountsOfficeNumber && (
            <p className="text-sm text-muted-foreground">Accounts Office: {company.accountsOfficeNumber}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Employee Name</p>
          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">NI Number</p>
          <p className="font-medium">{employee.niNumber || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Works Number</p>
          <p className="font-medium">{employee.payrollId || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Date of Birth</p>
          <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Start Date</p>
          <p className="font-medium">{formatDate(employee.hireDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Leave Date</p>
          <p className="font-medium">{formatDate(employee.leaveDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Department</p>
          <p className="font-medium">{employee.department}</p>
        </div>
      </div>
    </div>
  );
}
