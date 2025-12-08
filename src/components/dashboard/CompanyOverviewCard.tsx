import { Card, CardContent } from "@/components/ui/card";
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
  const maxDepartmentValue = Math.max(...departmentData.map(d => d.value), 1);
  const sortedDepartments = [...departmentData].sort((a, b) => b.value - a.value);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardContent className="pt-6">
        {/* Tiled Statistics Row */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Total Employees Tile */}
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50 min-w-[100px]">
            <Users className="h-5 w-5 text-primary mb-2" />
            <span className="text-2xl font-bold">{totalEmployees}</span>
            <span className="text-xs text-muted-foreground mt-1">Employees</span>
          </div>
          
          {/* Average Age Tile */}
          <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50 min-w-[100px]">
            <Calendar className="h-5 w-5 text-primary mb-2" />
            <span className="text-2xl font-bold">{averageAge ?? "—"}</span>
            <span className="text-xs text-muted-foreground mt-1">Avg Age</span>
          </div>
          
          {/* Gender Distribution Tiles */}
          {sortedGenderData.map((item) => (
            <div 
              key={item.gender}
              className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50 min-w-[100px]"
            >
              <span className="text-2xl font-bold">{item.count}</span>
              <span className="text-xs uppercase text-muted-foreground mt-1">{item.gender}</span>
            </div>
          ))}
        </div>

        {/* Department Distribution Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Department Distribution
            </h3>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold">{departmentCount}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {sortedDepartments.map((dept) => (
              <div key={dept.name} className="space-y-0.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="truncate text-muted-foreground">{dept.name}</span>
                  <span className="font-semibold text-foreground ml-2">{dept.value}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ 
                      width: `${(dept.value / maxDepartmentValue) * 100}%`,
                      backgroundColor: dept.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
