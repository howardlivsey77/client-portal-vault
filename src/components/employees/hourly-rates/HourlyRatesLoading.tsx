
import { Loader2 } from "lucide-react";

export const HourlyRatesLoading = () => {
  return (
    <div className="py-4 flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
};
