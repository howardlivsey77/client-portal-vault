
import { Loader2 } from "lucide-react";

export function ProcessingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-monday-blue mb-4" />
      <p className="text-lg font-medium">Processing your file...</p>
      <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
    </div>
  );
}
