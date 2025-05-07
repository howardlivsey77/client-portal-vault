
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Users, FileText } from "lucide-react";
import { ExtraHoursSummary } from "../types";

interface SummaryCardsProps {
  summary: ExtraHoursSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Total Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xl font-semibold">{summary.totalExtraHours}</p>
          <p className="text-xs text-muted-foreground">Extra hours recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xl font-semibold">{summary.totalEntries}</p>
          <p className="text-xs text-muted-foreground">Entries processed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Period
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm font-medium">
            {summary.dateRange.from} - {summary.dateRange.to}
          </p>
          <p className="text-xs text-muted-foreground">Date range</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Employees
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xl font-semibold">{summary.employeeCount}</p>
          <p className="text-xs text-muted-foreground">Staff members</p>
        </CardContent>
      </Card>
    </div>
  );
}
