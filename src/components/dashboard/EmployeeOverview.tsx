
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
  return (
    <Card className="col-span-full lg:col-span-1">
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
          
          {genderData.length > 0 && (
            <div className="pt-2 border-b pb-4">
              <div className="text-sm font-medium mb-2">Gender Distribution</div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {genderData.map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
