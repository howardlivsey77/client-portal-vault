
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ImportEmployeeDialog } from "./ImportEmployeeDialog";

interface EmployeeActionsProps {
  isAdmin: boolean;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const EmployeeActions = ({ isAdmin, loading, onRefresh }: EmployeeActionsProps) => {
  return (
    <>
      {isAdmin && (
        <ImportEmployeeDialog onSuccess={onRefresh} />
      )}
    </>
  );
};
