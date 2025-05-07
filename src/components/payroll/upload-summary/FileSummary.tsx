
import { FileText } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface FileSummaryProps {
  file: File;
}

export function FileSummary({ file }: FileSummaryProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md">
      <FileText className="h-6 w-6 text-monday-blue" />
      <div>
        <p className="font-medium">{file.name}</p>
        <p className="text-sm text-muted-foreground">
          {(file.size / 1024).toFixed(2)} KB • Uploaded {formatDate(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
}
