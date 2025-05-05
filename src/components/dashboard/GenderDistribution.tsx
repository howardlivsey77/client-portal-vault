
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

interface GenderData {
  name: string;
  value: number;
  color: string;
}

interface GenderDistributionProps {
  genderData: GenderData[];
}

export function GenderDistribution({
  genderData
}: GenderDistributionProps) {
  if (!genderData || genderData.length === 0) {
    return <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>;
  }
  
  // Calculate total for summary
  const total = genderData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription>Employees by gender</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="flex flex-col items-center w-full">
          <ChartContainer className="h-[200px] w-full max-w-md" config={{
            genders: { label: "Genders" }
          }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={genderData} 
                  dataKey="value"
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={30}
                  outerRadius={80} 
                  paddingAngle={2}
                  label
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <ChartLegend>
            <ChartLegendContent payload={genderData.map((item) => ({
              value: item.name,
              color: item.color,
              dataKey: item.name
            }))} />
          </ChartLegend>
          <div className="text-sm font-medium text-center pt-2 text-muted-foreground">
            Total: {total} employees
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
