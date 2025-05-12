
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HolidaysSettingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Holidays</CardTitle>
        <CardDescription>
          Configure holidays and closures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This is where you can manage company-wide holidays and closures.
        </p>
      </CardContent>
    </Card>
  );
};

export default HolidaysSettingsTab;
