import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trash2, UserCog, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmployeeTableProps {
  employees: Employee[];
  onDelete: (id: string) => Promise<void>;
  searchTerm: string;
}

export const EmployeeTable = ({ employees, onDelete, searchTerm }: EmployeeTableProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'on-hold':
        return 'secondary';
      case 'leaver':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusDisplayText = (status: string | null) => {
    if (!status) return 'Not Set';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower) ||
      (employee.email && employee.email.toLowerCase().includes(searchLower)) ||
      (employee.payroll_id && employee.payroll_id.toLowerCase().includes(searchLower)) ||
      (employee.gender && employee.gender.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="rounded-md border-[1.5px] border-foreground bg-white">
      <div className="flex justify-between items-center p-4 border-b border-muted">
        <h3 className="text-lg font-semibold">Employee Directory</h3>
        {isAdmin && (
          <Button onClick={() => navigate("/employee/new")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Payroll ID</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee) => (
            <TableRow 
              key={employee.id}
              className={cn(
                employee.status === 'leaver' && "bg-muted/30 opacity-75 text-muted-foreground"
              )}
            >
              <TableCell className="font-medium">
                {employee.first_name} {employee.last_name}
              </TableCell>
              <TableCell>{employee.payroll_id || "—"}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(employee.status)}>
                  {getStatusDisplayText(employee.status)}
                </Badge>
              </TableCell>
              <TableCell>{employee.gender || "—"}</TableCell>
              <TableCell>{employee.email || "—"}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/employee/${employee.id}`)}
                >
                  <UserCog className="h-4 w-4" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(employee.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
