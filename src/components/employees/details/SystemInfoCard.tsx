
import { formatDate } from "@/lib/formatters";
import { Employee } from "@/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SystemInfoCardProps {
  employee: Employee;
}

export const SystemInfoCard = ({ employee }: SystemInfoCardProps) => {
  return (
    <Card className="md:col-span-2 border-[1.5px] border-foreground bg-white">
      <CardHeader>
        <CardTitle>System Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Record Created</p>
            <p>{formatDate(employee.created_at)}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p>{formatDate(employee.updated_at)}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-muted-foreground">Record ID</p>
            <p className="font-mono text-xs">{employee.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
