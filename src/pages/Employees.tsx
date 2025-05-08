
import React, { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeSearch } from "@/components/employees/EmployeeSearch";
import { EmployeeActions } from "@/components/employees/EmployeeActions";
import { EmptyEmployeeState } from "@/components/employees/EmptyEmployeeState";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { migratePayrollIdsToWorkPatterns } from "@/services/employeeService";
import { useAuth } from "@/providers/AuthProvider";

export default function Employees() {
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [migrating, setMigrating] = useState(false);

  const runPayrollIdMigration = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can run this migration.",
        variant: "destructive"
      });
      return;
    }

    setMigrating(true);
    try {
      const success = await migratePayrollIdsToWorkPatterns();
      
      if (success) {
        toast({
          title: "Migration completed",
          description: "Successfully migrated payroll IDs to work patterns.",
        });
      } else {
        toast({
          title: "Migration failed",
          description: "There was an error migrating payroll IDs. Check the console for details.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Migration error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <PageContainer title="Employees">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <EmployeeSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={runPayrollIdMigration}
                disabled={migrating}
              >
                {migrating ? "Migrating..." : "Migrate Payroll IDs"}
              </Button>
            )}
            <EmployeeActions 
              isAdmin={isAdmin}
              loading={loading}
              onRefresh={fetchEmployees}
            />
          </div>
        </div>

        {!loading && employees.length === 0 && !searchTerm ? (
          <EmptyEmployeeState 
            isAdmin={isAdmin}
            searchTerm={searchTerm}
          />
        ) : (
          <EmployeeTable 
            employees={employees}
            onDelete={deleteEmployee}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </PageContainer>
  );
}
