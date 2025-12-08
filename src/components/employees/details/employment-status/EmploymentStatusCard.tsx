import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Employee } from "@/types";
import { EmploymentStatusForm } from "./EmploymentStatusForm";

interface EmploymentStatusCardProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

interface EmploymentStatusFormValues {
  status: string;
  leave_date?: Date;
}

export const EmploymentStatusCard = ({ 
  employee, 
  isAdmin,
  updateEmployeeField 
}: EmploymentStatusCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const defaultValues: EmploymentStatusFormValues = {
    status: employee.status || 'active',
    leave_date: employee.leave_date ? new Date(employee.leave_date) : undefined,
  };

  const onSubmit = async (data: EmploymentStatusFormValues) => {
    try {
      await updateEmployeeField('status', data.status);
      
      if (data.status === 'leaver' && data.leave_date) {
        await updateEmployeeField('leave_date', data.leave_date.toISOString().split('T')[0]);
      } else if (data.status !== 'leaver') {
        // Clear leave date if status is not leaver
        await updateEmployeeField('leave_date', null);
      }

      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating employment status:", error);
    }
  };

  return (
    <Card className="border-[1.5px] border-foreground bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Employment Status</CardTitle>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <Badge variant={getStatusBadgeVariant(employee.status)}>
            {getStatusDisplayText(employee.status)}
          </Badge>
        </div>

        {employee.status === 'leaver' && employee.leave_date && (
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium text-muted-foreground">Leave Date: </span>
              <span className="text-sm">
                {format(new Date(employee.leave_date), "PPP")}
              </span>
            </div>
          </div>
        )}

        {employee.status === 'on-hold' && (
          <div className="text-sm text-muted-foreground">
            Employee is currently on hold and not actively working.
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employment Status</DialogTitle>
          </DialogHeader>
          
          <EmploymentStatusForm 
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};