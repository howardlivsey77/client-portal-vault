import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar } from "lucide-react";

interface GenderData {
  gender: string;
  count: number;
}

interface CompanyOverviewCardProps {
  totalEmployees: number;
  genderData: GenderData[];
  averageAge: number | null;
}

export function CompanyOverviewCard({
  totalEmployees,
  genderData,
  averageAge,
}: CompanyOverviewCardProps) {
  const sortedGenderData = [...genderData].sort((a, b) => b.count - a.count);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
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
          
          {/* Gender Distribution Tile - Merged */}
          <div className="flex flex-col p-4 rounded-lg bg-muted/50 min-w-[200px]">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 text-center">
              Gender Distribution
            </h4>
            <div className="flex items-center justify-center gap-6">
              {sortedGenderData.map((item) => {
                const percentage = totalEmployees > 0 
                  ? Math.round((item.count / totalEmployees) * 100) 
                  : 0;
                return (
                  <div key={item.gender} className="flex flex-col items-center text-center">
                    <span className="text-2xl font-bold">
                      {item.count} <span className="text-sm font-normal text-muted-foreground">({percentage}%)</span>
                    </span>
                    <span className="text-xs uppercase text-muted-foreground mt-1">{item.gender}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}