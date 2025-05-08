
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";

type SortDirection = "asc" | "desc" | null;

interface SortButtonProps {
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  label: string;
}

export const SortButton = ({ active, direction, onSort, label }: SortButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-muted-foreground font-medium"
      onClick={onSort}
    >
      {label}
      {active && direction === "asc" && (
        <ArrowUp className="ml-1 h-4 w-4" />
      )}
      {active && direction === "desc" && (
        <ArrowDown className="ml-1 h-4 w-4" />
      )}
    </Button>
  );
};

export type { SortDirection };
