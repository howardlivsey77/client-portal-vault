
import { Share } from "lucide-react";

export function SharedTab() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Share className="h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-xl font-medium">No shared documents</h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Documents shared with you will appear here.
      </p>
    </div>
  );
}
