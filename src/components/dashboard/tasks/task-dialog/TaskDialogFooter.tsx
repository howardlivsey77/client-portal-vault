
import React from 'react';
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";

interface TaskDialogFooterProps {
  isLoading: boolean;
  isEditing: boolean;
  onSave: () => void;
}

export function TaskDialogFooter({ isLoading, isEditing, onSave }: TaskDialogFooterProps) {
  return (
    <>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button onClick={onSave} disabled={isLoading}>
        {isLoading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
      </Button>
    </>
  );
}
