
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

interface PayrollFormCardProps {
  children: React.ReactNode;
  payPeriod?: PayPeriod;
}

export function PayrollFormCard({ children, payPeriod }: PayrollFormCardProps) {
  return (
    <div className="space-y-4">
      {payPeriod && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Financial Year: {`${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`}
              </Badge>
              <Badge className="text-sm">
                Pay Period: {payPeriod.description}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {children}
    </div>
  );
}
