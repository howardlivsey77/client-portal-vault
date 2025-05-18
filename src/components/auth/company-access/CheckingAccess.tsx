
import { Loader2 } from "lucide-react";

export const CheckingAccess = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <span className="ml-2">Checking company access...</span>
    </div>
  );
};
