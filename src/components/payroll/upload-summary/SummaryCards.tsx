
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, Users, FileText, Timer, DollarSign } from "lucide-react";
import { ExtraHoursSummary } from "../types";

interface SummaryCardsProps {
  summary: ExtraHoursSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const hasRateData = 
    (summary.totalRate1Hours && summary.totalRate1Hours > 0) || 
    (summary.totalRate2Hours && summary.totalRate2Hours > 0) ||
    (summary.totalRate3Hours && summary.totalRate3Hours > 0);
  
  return (
    <div className="space-y-4">
      {/* Rate-specific cards at the top if we have rate data */}
      {hasRateData && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {summary.totalRate1Hours && summary.totalRate1Hours > 0 && (
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center">
                  <Timer className="h-4 w-4 mr-2" />
                  Rate 1 Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xl font-semibold">{summary.totalRate1Hours}</p>
                <p className="text-xs text-muted-foreground">Standard rate hours</p>
              </CardContent>
            </Card>
          )}
          
          {summary.totalRate2Hours && summary.totalRate2Hours > 0 && (
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Rate 2 Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xl font-semibold">{summary.totalRate2Hours}</p>
                <p className="text-xs text-muted-foreground">Enhanced rate hours</p>
              </CardContent>
            </Card>
          )}
          
          {summary.totalRate3Hours && summary.totalRate3Hours > 0 && (
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-amber-500" />
                  Rate 3 Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xl font-semibold">{summary.totalRate3Hours}</p>
                <p className="text-xs text-muted-foreground">Premium rate hours</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Original summary cards */}
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
    </div>
  );
}
