
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserMinus, PencilLine } from "lucide-react";
import { ChangeType } from "./types";

interface ChangeTypeIndicatorProps {
  type: ChangeType;
}

export function ChangeTypeIndicator({ type }: ChangeTypeIndicatorProps) {
  const getChangeIcon = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'termination':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'modification':
        return <PencilLine className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getChangeBadge = (type: ChangeType) => {
    switch(type) {
      case 'hire':
        return <Badge className="bg-green-500">Hire</Badge>;
      case 'termination':
        return <Badge className="bg-red-500">Termination</Badge>;
      case 'modification':
        return <Badge className="bg-blue-500">Modification</Badge>;
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
