
import { DocumentCardHeaderProps } from "./types";
import { getFileIcon } from "./utils";

export function DocumentCardHeader({ title, updatedAt, size, icon }: DocumentCardHeaderProps) {
  return (
    <div className="flex items-center space-x-4">
      {icon || getFileIcon(title.split('.').pop() || '')}
      <div>
        <div className="font-medium line-clamp-1">{title}</div>
        <div className="text-sm text-muted-foreground">{updatedAt} • {size}</div>
      </div>
    </div>
  );
}
