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
  return <Card className="col-span-full lg:col-span-1">
      <CardHeader className="py-[23px]">
        <CardTitle>Gender Distribution</CardTitle>
        <CardDescription>Employees by gender</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-[14px]">
        <div className="flex flex-col items-center w-full">
          <ChartContainer className="h-[200px] w-full max-w-md" config={{
          gender: {
            label: "Gender"
          }
        }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={80} paddingAngle={2} label={({
                name,
                percent
              }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={value => [`${value} employees`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <ChartLegend>
            <ChartLegendContent payload={genderData.map(item => ({
            value: `${item.name} (${item.value})`,
            color: item.color,
            dataKey: item.name
          }))} />
          </ChartLegend>
        </div>
      </CardContent>
    </Card>;
}