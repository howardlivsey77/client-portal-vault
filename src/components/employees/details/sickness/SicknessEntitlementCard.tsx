
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SicknessEntitlementSummary } from "@/types/sickness";
import { Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface SicknessEntitlementCardProps {
  summary: SicknessEntitlementSummary | null;
  loading?: boolean;
}

export const SicknessEntitlementCard = ({ summary, loading }: SicknessEntitlementCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sickness Entitlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading entitlement data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sickness Entitlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No sickness scheme assigned or entitlement data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const fullPayUsagePercent = summary.full_pay_used > 0 ? 
    (summary.full_pay_used / (summary.full_pay_used + summary.full_pay_remaining)) * 100 : 0;
  
  const halfPayUsagePercent = summary.half_pay_used > 0 ? 
    (summary.half_pay_used / (summary.half_pay_used + summary.half_pay_remaining)) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sickness Entitlement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Information */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Period:</span>
          <Badge variant="outline">
            {Math.floor(summary.service_months / 12)} years, {summary.service_months % 12} months
          </Badge>
        </div>

        {/* Full Pay Entitlement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Full Pay Days</span>
            <div className="flex items-center gap-2">
              {summary.full_pay_remaining > 5 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : summary.full_pay_remaining > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {summary.full_pay_remaining} remaining / {summary.full_pay_used} used
              </span>
            </div>
          </div>
          <Progress value={fullPayUsagePercent} className="h-2" />
        </div>

        {/* Half Pay Entitlement */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Half Pay Days</span>
            <div className="flex items-center gap-2">
              {summary.half_pay_remaining > 5 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : summary.half_pay_remaining > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {summary.half_pay_remaining} remaining / {summary.half_pay_used} used
              </span>
            </div>
          </div>
          <Progress value={halfPayUsagePercent} className="h-2" />
        </div>

        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Tier:</span>
          <Badge>{summary.current_tier}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
