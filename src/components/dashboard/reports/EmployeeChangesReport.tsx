
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, UserPlus, UserMinus, PencilLine } from "lucide-react";

type ChangeType = 'hire' | 'termination' | 'modification';

interface EmployeeChange {
  id: string;
  employeeName: string;
  date: string;
  type: ChangeType;
  details: string;
}

export function EmployeeChangesReport() {
  const { employees, loading } = useEmployees();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // This would ideally come from an API that tracks employee changes
  // For now, we'll simulate changes based on hire dates and randomly generated modifications
  const employeeChanges: EmployeeChange[] = employees.map(employee => {
    return {
      id: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      date: employee.hire_date,
      type: 'hire',
      details: `Hired into ${employee.department} department`
    };
  });
  
  // Sort changes by date descending (most recent first)
  const sortedChanges = [...employeeChanges].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getChangeIcon = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'termination':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'modification':
        return <PencilLine className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getChangeBadge = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <Badge className="bg-green-500">Hire</Badge>;
      case 'termination':
        return <Badge className="bg-red-500">Termination</Badge>;
      case 'modification':
        return <Badge className="bg-blue-500">Modification</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="monday-section-title flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Employee Changes Report
        </h2>
      </div>
      
      <Card className="overflow-hidden border border-monday-border bg-white shadow-sm">
        <CardHeader className="bg-monday-lightest-gray border-b border-monday-border">
          <CardTitle className="text-lg font-medium text-monday-darkblue">Recent Employee Changes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedChanges.length > 0 ? (
                sortedChanges.map((change) => (
                  <TableRow key={`${change.id}-${change.type}`}>
                    <TableCell className="font-medium">{formatDate(change.date)}</TableCell>
                    <TableCell>{change.employeeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChangeIcon(change.type)}
                        {getChangeBadge(change.type)}
                      </div>
                    </TableCell>
                    <TableCell>{change.details}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-monday-gray">
                    No employee changes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
