
import React from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";

interface DeleteConstantDialogProps {
  deletingConstant: TaxConstant | null;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  onConfirmDelete: () => void;
}

export function DeleteConstantDialog({
  deletingConstant,
  showDeleteDialog,
  setShowDeleteDialog,
  onConfirmDelete
}: DeleteConstantDialogProps) {
  return (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the constant "{deletingConstant?.key}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
