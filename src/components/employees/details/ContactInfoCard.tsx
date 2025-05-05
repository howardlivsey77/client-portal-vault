
import { Employee } from "@/hooks/useEmployeeDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContactInfoCardProps {
  employee: Employee;
  formattedAddress: string;
}

export const ContactInfoCard = ({ employee, formattedAddress }: ContactInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};
