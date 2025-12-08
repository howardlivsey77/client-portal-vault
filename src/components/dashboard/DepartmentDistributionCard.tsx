import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, ChevronDown } from "lucide-react";

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

interface DepartmentDistributionCardProps {
  departmentCount: number;
  departmentData: DepartmentData[];
}

export function DepartmentDistributionCard({ 
  departmentCount, 
  departmentData 
}: DepartmentDistributionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const maxDepartmentValue = Math.max(...departmentData.map(d => d.value), 1);
  const sortedDepartments = [...departmentData].sort((a, b) => b.value - a.value);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardContent className="pt-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Department Distribution
              </h3>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold">{departmentCount}</span>
                <span className="text-xs text-muted-foreground">Total</span>
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`} 
                />
              </div>
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
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
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
