import { DragEvent, useState } from "react";
import { useDragDrop, DropTarget } from "@/contexts/DragDropContext";

interface UseDroppableProps {
  target: DropTarget;
  disabled?: boolean;
}

export function useDroppable({ target, disabled = false }: UseDroppableProps) {
  const { canDrop, handleDrop, isDragging } = useDragDrop();
  const [isOver, setIsOver] = useState(false);

  const canDropHere = isDragging && canDrop(target) && !disabled;

  const handleDragOver = (e: DragEvent) => {
    if (!canDropHere) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: DragEvent) => {
    if (!canDropHere) return;
    
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    if (!canDropHere) return;
    
    // Only leave if we're actually leaving the element (not entering a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsOver(false);
    }
  };

  const handleDropEvent = async (e: DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    if (!canDropHere) return;

    try {
      // Try to parse drag data as fallback
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const item = JSON.parse(dragData);
        // Handle drop using the context
        await handleDrop(target);
      }
    } catch (error) {
      console.error('Drop handling failed:', error);
    }
  };

  return {
    isOver: isOver && canDropHere,
    canDropHere,
    dropProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDropEvent,
    },
  };
}