
import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { 
  EmployeeTable, 
  EmployeeSearch, 
  EmployeeActions, 
  EmptyEmployeeState, 
  EmployeeStatusFilter 
} from "@/components/employees";
import { useEmployees } from "@/hooks";
import { useAuth } from "@/providers/AuthProvider";
import { useCompany } from "@/providers/CompanyProvider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Employees() {
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'current' | 'past' | 'all'>('current');
  
  const { isAdmin } = useAuth();
  const { currentCompany } = useCompany();



  return (
    <PageContainer title="Employees">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col gap-4">
          <EmployeeStatusFilter 
            selectedFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-[1.5px] border-foreground rounded-md p-4 bg-white">
            <EmployeeSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <EmployeeActions 
              isAdmin={isAdmin}
              loading={loading}
              onRefresh={fetchEmployees}
            />
          </div>
        </div>

        {!currentCompany ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please select a company to view employees.</p>
          </div>
        ) : !loading && employees.length === 0 && !searchTerm ? (
          <EmptyEmployeeState 
            isAdmin={isAdmin}
            searchTerm={searchTerm}
          />
        ) : (
          <EmployeeTable 
            employees={employees}
            onDelete={deleteEmployee}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onEmployeeUpdate={fetchEmployees}
          />
        )}
      </div>
    </PageContainer>
  );
}
