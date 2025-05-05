
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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
  
  return <Card className="col-span-full lg:col-span-1">
      <CardHeader className="py-[23px]">
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription className="py-0 my-0">Employees by gender</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center px-0 py-[38px]">
        <div className="flex flex-col items-center w-full">
          <ChartContainer className="h-[200px] w-full max-w-md" config={{
          gender: {
            label: "Gender"
          }
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
                  label={false} // Remove labels from inside the chart to prevent overlap
                >
                  {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value} employees (${((Number(value) / total) * 100).toFixed(1)}%)`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Enhanced legend with counts and percentages */}
          <div className="w-full px-4 mt-4">
            <div className="flex justify-center items-center space-x-8">
              {genderData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium">{item.name}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Summary at the bottom */}
          <div className="mt-4 text-sm text-center text-muted-foreground">
            Total: {total} employees
          </div>
        </div>
      </CardContent>
    </Card>;
}
