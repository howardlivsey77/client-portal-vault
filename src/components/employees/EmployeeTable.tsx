
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
import { Trash2, UserCog } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  hire_date: string;
  salary: number;
  email: string | null;
  phone_number: string | null;
}

interface EmployeeTableProps {
  employees: Employee[];
  onDelete: (id: string) => Promise<void>;
  searchTerm: string;
}

export const EmployeeTable = ({ employees, onDelete, searchTerm }: EmployeeTableProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.first_name.toLowerCase().includes(searchLower) ||
      employee.last_name.toLowerCase().includes(searchLower) ||
      employee.job_title.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower) ||
      (employee.email && employee.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">
                {employee.first_name} {employee.last_name}
              </TableCell>
              <TableCell>{employee.job_title}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.email || "—"}</TableCell>
              <TableCell>{formatCurrency(employee.salary)}</TableCell>
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
