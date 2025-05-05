
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, ResponsiveContainer, LabelList, Tooltip } from "recharts";
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
  
  // Calculate total for summary and percentages
  const total = genderData.reduce((sum, item) => sum + item.value, 0);

  // Transform data for horizontal bar chart
  const chartData = genderData.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));
  
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Gender Distribution</CardTitle>
          <CardDescription>Employees by gender</CardDescription>
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Modern bar chart */}
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <Tooltip
                  formatter={(value) => [`${value} employees`, 'Count']}
                  labelFormatter={() => ''}
                />
                {chartData.map((entry, index) => (
                  <Bar
                    key={`bar-${index}`}
                    dataKey="value"
                    fill={entry.color}
                    background={{ fill: '#f3f4f6' }}
                    radius={[4, 4, 4, 4]}
                    barSize={30}
                  >
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      fill="#ffffff"
                      offset={10}
                    />
                    <LabelList
                      dataKey="value"
                      position="right"
                      fill="#374151"
                      offset={10}
                    />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with percentages */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm">
                  {item.value} ({item.percentage}%)
                </span>
              </div>
            ))}
            <div className="col-span-2 text-sm font-medium text-center pt-2 text-muted-foreground">
              Total: {total} employees
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
