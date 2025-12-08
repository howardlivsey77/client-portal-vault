import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sicknessDataMigration } from "@/utils";
import { toast } from "sonner";
import { Loader2, Play, RefreshCw, CheckCircle } from "lucide-react";

export const SicknessDataMigration = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<{
    employeesWithoutSchemes: number;
    employeesWithoutEntitlements: number;
    recordsWithoutEntitlementUpdates: number;
  } | null>(null);

  const handleRunMigration = async () => {
    setIsRunning(true);
    try {
      await sicknessDataMigration.runCompleteMigration();
      toast.success("Sickness data migration completed successfully!");
      
      // Refresh integrity check
      await handleCheckIntegrity();
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error("Migration failed. Check console for details.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckIntegrity = async () => {
    setIsChecking(true);
    try {
      const report = await sicknessDataMigration.checkDataIntegrity();
      setIntegrityReport(report);
    } catch (error) {
      console.error('Integrity check failed:', error);
      toast.error("Integrity check failed. Check console for details.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sickness Data Migration</CardTitle>
        <CardDescription>
          Fix sickness entitlement data and ensure all imported records are properly reflected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button
            onClick={handleCheckIntegrity}
            disabled={isChecking || isRunning}
            variant="outline"
          >
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check Data Integrity
          </Button>
          
          <Button
            onClick={handleRunMigration}
            disabled={isRunning || isChecking}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Migration
          </Button>
        </div>

        {integrityReport && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Integrity Report</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Employees without schemes</span>
                  <Badge variant={integrityReport.employeesWithoutSchemes > 0 ? "destructive" : "default"}>
                    {integrityReport.employeesWithoutSchemes}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Missing entitlement records</span>
                  <Badge variant={integrityReport.employeesWithoutEntitlements > 0 ? "destructive" : "default"}>
                    {integrityReport.employeesWithoutEntitlements}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Records with zero used days</span>
                  <Badge variant={integrityReport.recordsWithoutEntitlementUpdates > 0 ? "destructive" : "default"}>
                    {integrityReport.recordsWithoutEntitlementUpdates}
                  </Badge>
                </div>
              </div>

              {integrityReport.employeesWithoutSchemes === 0 && 
               integrityReport.employeesWithoutEntitlements === 0 && 
               integrityReport.recordsWithoutEntitlementUpdates === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">All data integrity checks passed!</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Migration includes:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create missing entitlement records for employees with sickness data</li>
            <li>Assign default sickness schemes to employees without schemes</li>
            <li>Recalculate and persist used days for all employees</li>
            <li>Update SSP calculations based on work patterns</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};