import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SicknessItem, SSP_DAILY_RATE } from "../adjustments/types";
import { formatPounds } from "@/lib/formatters";
import { Calculator } from "lucide-react";

interface SspSummaryPanelProps {
  items: SicknessItem[];
}

export const SspSummaryPanel = ({ items }: SspSummaryPanelProps) => {
  const totalDays = items.reduce((sum, item) => sum + item.daysQualifying, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4" />
          SSP Calculation Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily SSP Rate:</span>
          <Badge variant="outline">{formatPounds(SSP_DAILY_RATE)}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Qualifying Days:</span>
          <span className="font-medium">{totalDays}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="font-medium">Total SSP:</span>
          <span className="font-bold text-primary">{formatPounds(totalAmount)}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Note: First 3 waiting days of each sickness period are not paid. 
          Max 4 qualifying days per week.
        </p>
      </CardContent>
    </Card>
  );
};
