
import React from 'react';
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface TaskDialogHeaderProps {
  isEditing: boolean;
}

export function TaskDialogHeader({ isEditing }: TaskDialogHeaderProps) {
  return (
    <>
      <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
      <DialogDescription>
        {isEditing
          ? "Update task details and assignment"
          : "Add a new task with details and assignment"}
      </DialogDescription>
    </>
  );
}
