
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmployeeOverviewProps {
  totalEmployees: number;
  departmentCount: number;
  departmentData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  genderData?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function EmployeeOverview({
  totalEmployees,
  departmentCount,
  departmentData,
  genderData = []
}: EmployeeOverviewProps) {
  return <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
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
              {departmentData.map(dept => <Badge key={dept.name} variant="outline" className="justify-between">
                  <span className="truncate">{dept.name}</span>
                  <span className="ml-2">{dept.value}</span>
                </Badge>)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
