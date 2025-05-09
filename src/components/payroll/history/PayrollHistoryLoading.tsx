
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PayrollHistoryLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
