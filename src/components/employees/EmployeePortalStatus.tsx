import { Badge } from "@/components/ui/badge";
import { EmployeeInviteButton } from "./EmployeeInviteButton";
import { useEmployeeInvite } from "@/hooks";
import type { Employee } from "@/types/employee-types";

interface EmployeePortalStatusProps {
  employee: Employee;
  isAdmin: boolean;
  onInviteSent: () => void;
}

export const EmployeePortalStatus = ({
  employee,
  isAdmin,
  onInviteSent,
}: EmployeePortalStatusProps) => {
  const { getInvitationStatus } = useEmployeeInvite();
  
  // Admins see interactive invite buttons
  if (isAdmin) {
    return (
      <EmployeeInviteButton 
        employee={employee} 
        onInviteSent={onInviteSent}
      />
    );
  }

  // Non-admins see read-only status badge
  const status = getInvitationStatus(employee);
  return (
    <Badge variant={status.variant} className="whitespace-nowrap">
      {status.label}
    </Badge>
  );
};
