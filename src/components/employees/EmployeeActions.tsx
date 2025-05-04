
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
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      
      {isAdmin && (
        <ImportEmployeeDialog onSuccess={onRefresh} />
      )}
    </div>
  );
};
