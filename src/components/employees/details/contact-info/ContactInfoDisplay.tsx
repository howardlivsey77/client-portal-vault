
import { Employee } from "@/hooks/useEmployeeDetails";

interface ContactInfoDisplayProps {
  employee: Employee;
  formattedAddress: string;
}

export const ContactInfoDisplay = ({ employee, formattedAddress }: ContactInfoDisplayProps) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Email</p>
        <p>{employee.email || "Not provided"}</p>
      </div>
      
      <div className="mt-2">
        <p className="text-sm font-medium text-muted-foreground">Address</p>
        <div className="space-y-1">
          {employee.address1 && <p>{employee.address1}</p>}
          {employee.address2 && <p>{employee.address2}</p>}
          {employee.address3 && <p>{employee.address3}</p>}
          {employee.address4 && <p>{employee.address4}</p>}
          {employee.postcode && <p>{employee.postcode}</p>}
          {!formattedAddress && <p>Not provided</p>}
        </div>
      </div>
    </div>
  );
};
