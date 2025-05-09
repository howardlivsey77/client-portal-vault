
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimesheetSettingsForm } from "@/features/timesheet-settings/TimesheetSettingsForm";
import { Button } from "@/components/ui/button";
import { PayrollConstantsDialog } from "@/features/payroll-constants/PayrollConstantsDialog";
import { useState } from "react";
import { Settings } from "lucide-react";

const TimesheetSettings = () => {
  const [showConstantsDialog, setShowConstantsDialog] = useState(false);
  
  return (
    <PageContainer>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Timesheet Settings</h1>
          <Button 
            variant="outline"
            onClick={() => setShowConstantsDialog(true)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Manage Payroll Constants</span>
          </Button>
        </div>
        
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

        <PayrollConstantsDialog 
          open={showConstantsDialog} 
          onOpenChange={setShowConstantsDialog}
        />
      </div>
    </PageContainer>
  );
};

export default TimesheetSettings;
