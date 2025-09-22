import { DragEvent } from "react";
import { useDragDrop, DragItem } from "@/contexts/DragDropContext";

interface UseDraggableProps {
  item: DragItem;
  disabled?: boolean;
}

export function useDraggable({ item, disabled = false }: UseDraggableProps) {
  const { startDrag, endDrag, isDragging, dragItem } = useDragDrop();

  const isDraggingThis = isDragging && dragItem?.id === item.id;

  const handleDragStart = (e: DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    // Set drag data for native drag/drop compatibility
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';

    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.innerHTML = item.title;
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.background = 'hsl(var(--primary))';
    dragImage.style.color = 'hsl(var(--primary-foreground))';
    dragImage.style.padding = '8px 12px';
    dragImage.style.borderRadius = '6px';
    dragImage.style.fontSize = '14px';
    dragImage.style.fontWeight = '500';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up drag image after drag starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    startDrag(item);
  };

  const handleDragEnd = () => {
    if (!disabled) {
      endDrag();
    }
  };

  return {
    isDraggingThis,
    dragProps: {
      draggable: !disabled,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
}