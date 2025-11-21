
import { Button } from "@/components/ui/button";
import { Share, Download } from "lucide-react";
import { DocumentCardFooterProps } from "./types";
import { downloadDocument } from "./utils";
import { toast } from "sonner";

export function DocumentCardFooter({ type, documentId, filePath, title }: DocumentCardFooterProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadDocument(filePath, title);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Share functionality coming soon");
  };

  return (
    <div className="mt-auto flex items-center justify-between border-t px-4 py-2 text-sm">
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide">
        {type}
      </span>
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
          <Share className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Download</span>
        </Button>
      </div>
    </div>
  );
}
