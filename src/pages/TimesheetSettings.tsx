
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimesheetSettingsForm } from "@/features/timesheet-settings/TimesheetSettingsForm";

const TimesheetSettings = () => {
  return (
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6">Timesheet Settings</h1>
        
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Timesheet Configuration</CardTitle>
            <CardDescription>
              Configure settings and tolerances for employee clock-in/out activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimesheetSettingsForm />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default TimesheetSettings;
