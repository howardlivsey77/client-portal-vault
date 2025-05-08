
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const TimesheetsTab = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Timesheets</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Timesheets</CardTitle>
          <CardDescription>Track and manage employee working hours</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The timesheet functionality is coming soon. This section will allow you to track employee working hours, 
            approve time entries, and generate reports for payroll processing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
