
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SicknessSettingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Sickness</CardTitle>
        <CardDescription>
          Configure sickness and absence policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This is where you can manage company-wide sickness policies and absence tracking.
        </p>
      </CardContent>
    </Card>
  );
};

export default SicknessSettingsTab;
