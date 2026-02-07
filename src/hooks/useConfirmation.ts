import { useState, useCallback } from "react";

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: (() => void) | (() => Promise<void>);
  variant?: "default" | "destructive";
}

const defaultState: ConfirmationState = {
  isOpen: false,
  title: "",
  description: "",
  onConfirm: () => {},
  variant: "default",
};

/**
 * Hook for managing a branded confirmation dialog.
 * Replaces native window.confirm() with a styled AlertDialog.
 * 
 * Usage:
 * ```tsx
 * const { confirm, ConfirmationDialog } = useConfirmation();
 * 
 * const handleDelete = () => {
 *   confirm({
 *     title: "Delete record?",
 *     description: "This action cannot be undone.",
 *     onConfirm: async () => { await deleteRecord(); },
 *     variant: "destructive",
 *   });
 * };
 * 
 * return <>{...}<ConfirmationDialog /></>;
 * ```
 */
export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>(defaultState);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: Omit<ConfirmationState, "isOpen">) => {
    setState({ ...options, isOpen: true });
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await state.onConfirm();
    } finally {
      setLoading(false);
      setState(defaultState);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    setState(defaultState);
  }, []);

  return {
    confirm,
    confirmationProps: {
      isOpen: state.isOpen,
      title: state.title,
      description: state.description,
      variant: state.variant,
      loading,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
};

export type { ConfirmationState };
