
import { AlertTriangle } from "lucide-react";

export function NoDataState() {
  return (
    <div className="border border-amber-200 bg-amber-50 p-4 rounded-md">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-amber-800 font-medium">No employee hours data found in file</p>
          <p className="text-sm text-amber-600 mt-2">
            Your file was processed successfully, but no hours were detected. 
            The file should contain hours in columns named "Rate1", "Rate2", 
            "Rate3", "Rate4", "Rate1Hours", etc., or other general hours columns like "Hours" or "ExtraHours".
          </p>
        </div>
      </div>
    </div>
  );
}
