
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmployeeDemographicsProps {
  // We can expand this interface later to include more demographic data
  totalEmployees: number;
}

export function EmployeeDemographics({ totalEmployees }: EmployeeDemographicsProps) {
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
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground text-center">
              Demographic data visualization will appear here
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
