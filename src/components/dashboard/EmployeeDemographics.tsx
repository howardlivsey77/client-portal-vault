
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface GenderData {
  gender: string;
  count: number;
}

interface EmployeeDemographicsProps {
  totalEmployees: number;
  genderData: GenderData[];
}

export function EmployeeDemographics({ totalEmployees, genderData }: EmployeeDemographicsProps) {
  // Sort gender data by count in descending order
  const sortedGenderData = [...genderData].sort((a, b) => b.count - a.count);

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle>Employee Demographics</CardTitle>
          <CardDescription>Workforce diversity insights</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="text-sm font-medium">Total Workforce</div>
            <div className="font-bold">{totalEmployees}</div>
          </div>
          
          {genderData.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {sortedGenderData.map((item) => (
                <div key={item.gender} className="flex flex-col items-center text-center p-2">
                  <div className="font-medium uppercase text-xs mb-1">{item.gender}</div>
                  <div className="font-bold text-lg">{item.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-center">
                No gender data available
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
