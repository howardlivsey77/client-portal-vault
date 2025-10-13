import { Mail, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEmployeeInvite } from "@/hooks/useEmployeeInvite";
import { Employee } from "@/types/employee-types";

interface EmployeeInviteButtonProps {
  employee: Employee;
  onInviteSent: () => void;
}

export function EmployeeInviteButton({ employee, onInviteSent }: EmployeeInviteButtonProps) {
  const { sendInvite, loading } = useEmployeeInvite();

  const handleSendInvite = async () => {
    if (!employee.email || !employee.company_id) {
      return;
    }

    const result = await sendInvite(employee.id, employee.email, employee.company_id);
    if (result.success) {
      onInviteSent();
    }
  };

  // Show status badge if invitation sent or portal active
  if (employee.portal_access_enabled) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Portal Active</span>
      </div>
    );
  }

  if (employee.invitation_sent_at) {
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <Clock className="h-4 w-4" />
        <span>Invitation Sent</span>
      </div>
    );
  }

  // Show invite button if no email
  if (!employee.email) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Mail className="h-4 w-4 mr-2" />
        No Email
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Mail className="h-4 w-4 mr-2" />
          Invite to Portal
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Portal Invitation</AlertDialogTitle>
          <AlertDialogDescription>
            Send an invitation to {employee.first_name} {employee.last_name} at{" "}
            <strong>{employee.email}</strong> to create their employee portal account?
            <br />
            <br />
            They will be able to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>View and update their personal information</li>
              <li>Access payslips and tax documents</li>
              <li>View timesheet records</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSendInvite} disabled={loading}>
            {loading ? "Sending..." : "Send Invitation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
