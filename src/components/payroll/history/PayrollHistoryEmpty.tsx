
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PayrollHistoryEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-8">
          <p className="text-muted-foreground">No payroll history found.</p>
          <p className="text-muted-foreground">Use the calculator tab to process and save payroll results.</p>
        </div>
      </CardContent>
    </Card>
  );
}
