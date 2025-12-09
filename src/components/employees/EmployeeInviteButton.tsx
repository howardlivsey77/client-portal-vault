import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Loader2 } from "lucide-react";
import { useEmployeeInvite } from "@/hooks";
import { useCompany } from "@/providers";
import type { Employee } from "@/types";

interface EmployeeInviteButtonProps {
  employee: Employee;
  onInviteSent: () => void;
}

export const EmployeeInviteButton = ({
  employee,
  onInviteSent,
}: EmployeeInviteButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const { currentCompany } = useCompany();
  const { sendInvite, getInvitationStatus, loading } = useEmployeeInvite();
  const status = getInvitationStatus(employee);

  if (!currentCompany) {
    return null;
  }

  const handleSendInvite = async () => {
    const success = await sendInvite(employee, currentCompany.id);
    if (success) {
      setShowDialog(false);
      onInviteSent();
    }
  };

  // Show status badge if active (portal access enabled)
  if (status.status === 'active') {
    return (
      <Badge variant={status.variant} className="whitespace-nowrap">
        {status.label}
      </Badge>
    );
  }

  // Show resend button if already invited
  if (status.status === 'invited') {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDialog(true)}
          disabled={loading || !employee.email}
          className="whitespace-nowrap"
        >
          <Mail className="h-4 w-4 mr-2" />
          Resend Invitation
        </Button>

        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resend Portal Invitation</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Resend invitation email to <strong>{employee.email}</strong>?
                </p>
                <p>
                  A new invitation email will be sent to {employee.first_name} {employee.last_name}.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSendInvite}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Invitation'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Show invite button if not invited
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        disabled={loading || !employee.email}
        className="whitespace-nowrap"
      >
        <Mail className="h-4 w-4 mr-2" />
        Invite to Portal
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Portal Invitation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Send an invitation email to <strong>{employee.email}</strong>?
              </p>
              <p>
                {employee.first_name} {employee.last_name} will receive an email with instructions to create their account and access the employee portal.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendInvite}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
