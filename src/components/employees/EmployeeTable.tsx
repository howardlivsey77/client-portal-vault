import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers";
import { useToast } from "@/hooks";
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
import { Employee } from "@/types";
import { EmployeePortalStatus } from "./EmployeePortalStatus";

interface EmployeeTableProps {
  employees: Employee[];
  onDelete: (id: string) => Promise<void>;
  searchTerm: string;
  statusFilter: 'current' | 'past' | 'all';
  onEmployeeUpdate?: () => void;
}

export const EmployeeTable = ({ employees, onDelete, searchTerm, statusFilter, onEmployeeUpdate }: EmployeeTableProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredEmployees = employees.filter(employee => {
    // Status filter
    if (statusFilter === 'current' && employee.status === 'leaver') return false;
    if (statusFilter === 'past' && employee.status !== 'leaver') return false;
    
    // Search filter
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
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Payroll ID</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Portal Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((employee) => (
            <TableRow 
              key={employee.id}
              onClick={() => navigate(`/employee/${employee.id}`)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                {employee.first_name} {employee.last_name}
              </TableCell>
              <TableCell>{employee.payroll_id || "—"}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.gender || "—"}</TableCell>
              <TableCell>{employee.email || "—"}</TableCell>
              <TableCell>
                <div onClick={(e) => e.stopPropagation()}>
                  <EmployeePortalStatus 
                    employee={employee}
                    isAdmin={isAdmin}
                    onInviteSent={() => {
                      setRefreshKey(prev => prev + 1);
                      onEmployeeUpdate?.();
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
