import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, PencilLine } from "lucide-react";
import { ChangeType } from "./types";
import { useBrandColors } from "@/brand";

interface ChangeTypeIndicatorProps {
  type: ChangeType;
}

export function ChangeTypeIndicator({ type }: ChangeTypeIndicatorProps) {
  const brandColors = useBrandColors();
  
  const getChangeIcon = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <UserPlus className="h-4 w-4" style={{ color: `hsl(${brandColors.success})` }} />;
      case 'termination':
        return <UserMinus className="h-4 w-4 text-destructive" />;
      case 'modification':
        return <PencilLine className="h-4 w-4 text-primary" />;
      default:
        return null;
    }
  };

  const getChangeBadge = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <Badge style={{ backgroundColor: `hsl(${brandColors.success})` }}>Hire</Badge>;
      case 'termination':
        return <Badge className="bg-destructive">Termination</Badge>;
      case 'modification':
        return <Badge className="bg-primary">Modification</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getChangeIcon(type)}
      {getChangeBadge(type)}
    </div>
  );
}
