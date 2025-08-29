
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SicknessEntitlementSummary } from "@/types/sickness";
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface SicknessEntitlementCardProps {
  summary: SicknessEntitlementSummary | null;
  loading?: boolean;
}

export const SicknessEntitlementCard = ({ 
  summary, 
  loading
}: SicknessEntitlementCardProps) => {
  if (loading) {
    return (
      <Card className="border-[1.5px] border-foreground">
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
      <Card className="border-[1.5px] border-foreground">
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

  const fullPayUsagePercent = summary.full_pay_used_rolling_12_months > 0 ? 
    (summary.full_pay_used_rolling_12_months / (summary.full_pay_used_rolling_12_months + summary.full_pay_remaining)) * 100 : 0;
  
  const halfPayUsagePercent = summary.half_pay_used_rolling_12_months > 0 ? 
    (summary.half_pay_used_rolling_12_months / (summary.half_pay_used_rolling_12_months + summary.half_pay_remaining)) * 100 : 0;
  
  const sspUsagePercent = (summary.ssp_used_rolling_12_months && summary.ssp_remaining_days) ?
    (summary.ssp_used_rolling_12_months / (summary.ssp_used_rolling_12_months + summary.ssp_remaining_days)) * 100 : 0;

  return (
    <Card className="border-[1.5px] border-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center">
          <Calendar className="h-5 w-5" />
          Sickness Entitlement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rolling Period Information */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Rolling 12-Month Period</span>
          </div>
          <p className="text-sm text-blue-700">
            {format(new Date(summary.rolling_period_start), 'dd MMM yyyy')} - {format(new Date(summary.rolling_period_end), 'dd MMM yyyy')}
          </p>
        </div>

        {/* Service Information */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service Period:</span>
          <Badge variant="outline">
            {Math.floor(summary.service_months / 12)} years, {summary.service_months % 12} months
          </Badge>
        </div>

        {/* Full Pay Entitlement */}
        <div className="space-y-3">
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
                {summary.full_pay_remaining} remaining / {summary.full_pay_used_rolling_12_months} used (12 months)
              </span>
            </div>
          </div>
          <Progress value={fullPayUsagePercent} className="h-2" />
        </div>

        {/* Half Pay Entitlement */}
        <div className="space-y-3">
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
                {summary.half_pay_remaining} remaining / {summary.half_pay_used_rolling_12_months} used (12 months)
              </span>
            </div>
          </div>
          <Progress value={halfPayUsagePercent} className="h-2" />
        </div>

        {/* SSP Entitlement (Statutory Sick Pay) */}
        {summary.ssp_entitled_days !== undefined && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SSP Days</span>
              <div className="flex items-center gap-2">
                {summary.ssp_remaining_days && summary.ssp_remaining_days > 5 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : summary.ssp_remaining_days && summary.ssp_remaining_days > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  {summary.ssp_remaining_days ?? 0} remaining / {summary.ssp_used_rolling_12_months ?? 0} used (12 months)
                </span>
              </div>
            </div>
            <Progress value={sspUsagePercent} className="h-2" />
            {/* Breakdown */}
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Entitled:</span>
                <span>{summary.ssp_entitled_days ?? 0} days</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Tier:</span>
          <Badge>{summary.current_tier}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
