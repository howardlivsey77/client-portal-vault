
import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmptyEmployeeState } from "@/components/employees/EmptyEmployeeState";
import { EmployeeSearch } from "@/components/employees/EmployeeSearch";
import { EmployeeActions } from "@/components/employees/EmployeeActions";
import { SortDirection } from "@/components/employees/SortButton";

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { isAdmin } = useAuth();
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployees();
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <EmployeeActions 
          isAdmin={isAdmin} 
          loading={loading} 
          onRefresh={fetchEmployees}
        />
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Manage employee records and information.
          </CardDescription>
          <div className="mt-4">
            <EmployeeSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </CardHeader>
        <CardContent>
          {loading && employees.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : employees.length > 0 ? (
            <EmployeeTable 
              employees={employees} 
              onDelete={deleteEmployee}
              searchTerm={searchTerm}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          ) : (
            <EmptyEmployeeState isAdmin={isAdmin} searchTerm={searchTerm} />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Employees;
