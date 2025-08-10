
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface EmployeeOverviewProps {
  totalEmployees: number;
  departmentCount: number;
  departmentData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function EmployeeOverview({ totalEmployees, departmentCount, departmentData }: EmployeeOverviewProps) {
  return (
    <Card className="col-span-full md:col-span-1 animate-fade-in border-[1.5px] border-foreground">
      <CardHeader className="flex items-center gap-3 pb-2">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <CardTitle>Employee Overview</CardTitle>
          <CardDescription>Summary of your workforce</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">Total Employees</div>
            <div className="font-bold">{totalEmployees}</div>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">Departments</div>
            <div className="font-bold">{departmentCount}</div>
          </div>
          <div className="pt-2">
            <div className="text-sm font-medium mb-2">Department Distribution</div>
            <div className="grid grid-cols-2 gap-2">
              {departmentData.map((dept) => (
                <Badge key={dept.name} variant="outline" className="justify-between">
                  <span className="truncate">{dept.name}</span>
                  <span className="ml-2">{dept.value}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
