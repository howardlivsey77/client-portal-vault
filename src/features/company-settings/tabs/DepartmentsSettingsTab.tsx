
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DepartmentsSettingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Management</CardTitle>
        <CardDescription>
          Manage your company's departments and organizational structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Department management functionality will be implemented here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentsSettingsTab;
