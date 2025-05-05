
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface DepartmentDistributionProps {
  departmentData: DepartmentData[];
}

export function DepartmentDistribution({ departmentData }: DepartmentDistributionProps) {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Department Distribution</CardTitle>
        <CardDescription>Employees by department</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="flex flex-col items-center w-full">
          <ChartContainer className="h-[200px] w-full max-w-md" config={{
            departments: { label: "Departments" }
          }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={departmentData} 
                  dataKey="value"
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={30}
                  outerRadius={80} 
                  paddingAngle={2}
                  label
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <ChartLegend>
            <ChartLegendContent payload={departmentData.map((item) => ({
              value: item.name,
              color: item.color,
              dataKey: item.name
            }))} />
          </ChartLegend>
        </div>
      </CardContent>
    </Card>
  );
}
