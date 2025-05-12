
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LocationsSettingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Locations</CardTitle>
        <CardDescription>
          Manage company office locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Configure and manage all your company's office locations.
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationsSettingsTab;
