import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Calendar, ChevronDown } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const sortedGenderData = [...genderData].sort((a, b) => b.count - a.count);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardContent className="pt-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Employee Statistics
              </h3>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold">{totalEmployees}</span>
                <span className="text-xs text-muted-foreground">Employees</span>
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`} 
                />
              </div>
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
