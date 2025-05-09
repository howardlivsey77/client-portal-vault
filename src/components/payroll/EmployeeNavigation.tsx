
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EmployeeNavigationProps {
  nextEmployeeId: string | null;
  prevEmployeeId: string | null;
  onNavigate: (id: string) => void;
}

export function EmployeeNavigation({
  nextEmployeeId,
  prevEmployeeId,
  onNavigate,
}: EmployeeNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        onClick={() => prevEmployeeId && onNavigate(prevEmployeeId)}
        disabled={!prevEmployeeId}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => nextEmployeeId && onNavigate(nextEmployeeId)}
        disabled={!nextEmployeeId}
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
