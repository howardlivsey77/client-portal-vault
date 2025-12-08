import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Building2, Calendar } from "lucide-react";

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface GenderData {
  gender: string;
  count: number;
}

interface CompanyOverviewCardProps {
  totalEmployees: number;
  departmentCount: number;
  departmentData: DepartmentData[];
  genderData: GenderData[];
  averageAge: number | null;
}

export function CompanyOverviewCard({
  totalEmployees,
  departmentCount,
  departmentData,
  genderData,
  averageAge,
}: CompanyOverviewCardProps) {
  const sortedGenderData = [...genderData].sort((a, b) => b.count - a.count);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <CardTitle>Company Overview</CardTitle>
          <CardDescription>Summary of your workforce and demographics</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Statistics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Key Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                  <p className="text-xs text-muted-foreground">Total Employees</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departmentCount}</p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {averageAge !== null ? `${averageAge}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Average Age</p>
                </div>
              </div>
            </div>
          </div>

          {/* Separator for desktop */}
          <Separator orientation="vertical" className="hidden md:block h-auto mx-auto" />
          <Separator className="md:hidden" />

          {/* Department Distribution */}
          <div className="space-y-4 md:-ml-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Department Distribution
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
              {departmentData.map((dept) => (
                <Badge 
                  key={dept.name} 
                  variant="outline" 
                  className="justify-between py-1.5"
                  style={{ borderLeftColor: dept.color, borderLeftWidth: 3 }}
                >
                  <span className="truncate text-xs">{dept.name}</span>
                  <span className="ml-2 font-semibold">{dept.value}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Separator for desktop */}
          <Separator orientation="vertical" className="hidden md:block h-auto mx-auto" />
          <Separator className="md:hidden" />

          {/* Gender & Age */}
          <div className="space-y-4 md:-ml-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Gender Distribution
            </h3>
            {genderData.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {sortedGenderData.map((item) => (
                  <div 
                    key={item.gender} 
                    className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50 min-w-[80px]"
                  >
                    <span className="text-2xl font-bold">{item.count}</span>
                    <span className="text-xs uppercase text-muted-foreground mt-1">
                      {item.gender}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No demographic data available</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
