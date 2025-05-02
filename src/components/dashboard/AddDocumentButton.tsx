
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface AddDocumentButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddDocumentButton({ onClick, className }: AddDocumentButtonProps) {
  return (
    <Card
      className={cn(
        "flex h-full min-h-[8rem] cursor-pointer flex-col items-center justify-center border-dashed bg-muted/50 p-4 text-muted-foreground transition-colors hover:bg-muted/80",
        className
      )}
      onClick={onClick}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-muted-foreground/20 bg-background">
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-medium">Upload Document</p>
        <p className="text-xs text-muted-foreground">
          Click to upload a new document
        </p>
      </div>
    </Card>
  );
}
