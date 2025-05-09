
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimesheetProvider } from "@/components/timesheets/TimesheetContext";
import { EmployeeTimesheet } from "@/components/timesheets/EmployeeTimesheet";

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
          <TimesheetProvider>
            <AutoLoadEmployeeTimesheet />
          </TimesheetProvider>
        </CardContent>
      </Card>
    </div>
  );
};

// New component to handle auto-loading functionality
const AutoLoadEmployeeTimesheet = () => {
  const { loadFirstEmployee } = useTimesheetContext();
  
  useEffect(() => {
    loadFirstEmployee();
  }, []);
  
  return <EmployeeTimesheet autoLoad={true} />;
};
