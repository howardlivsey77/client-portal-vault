
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SicknessEntitlementSummary } from "@/types/sickness";
import { Calendar, AlertTriangle, CheckCircle, Clock, Settings } from "lucide-react";
import { format } from "date-fns";

interface SicknessEntitlementCardProps {
  summary: SicknessEntitlementSummary | null;
  loading?: boolean;
  isAdmin?: boolean;
  onSetOpeningBalance?: () => void;
}

export const SicknessEntitlementCard = ({ 
  summary, 
  loading, 
  isAdmin,
  onSetOpeningBalance 
}: SicknessEntitlementCardProps) => {
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

  const fullPayUsagePercent = summary.full_pay_used_rolling_12_months > 0 ? 
    (summary.full_pay_used_rolling_12_months / (summary.full_pay_used_rolling_12_months + summary.full_pay_remaining)) * 100 : 0;
  
  const halfPayUsagePercent = summary.half_pay_used_rolling_12_months > 0 ? 
    (summary.half_pay_used_rolling_12_months / (summary.half_pay_used_rolling_12_months + summary.half_pay_remaining)) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Sickness Entitlement
        </CardTitle>
        {isAdmin && onSetOpeningBalance && (
          <Button variant="outline" size="sm" onClick={onSetOpeningBalance}>
            <Settings className="h-4 w-4 mr-2" />
            Opening Balance
          </Button>
        )}
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
          
          {/* Breakdown */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Current year:</span>
              <span>{summary.full_pay_used} days</span>
            </div>
            {summary.opening_balance_full_pay > 0 && (
              <div className="flex justify-between">
                <span>Opening balance:</span>
                <span>{summary.opening_balance_full_pay} days</span>
              </div>
            )}
          </div>
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
          
          {/* Breakdown */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Current year:</span>
              <span>{summary.half_pay_used} days</span>
            </div>
            {summary.opening_balance_half_pay > 0 && (
              <div className="flex justify-between">
                <span>Opening balance:</span>
                <span>{summary.opening_balance_half_pay} days</span>
              </div>
            )}
          </div>
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
