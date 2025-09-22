import React, { createContext, useContext, useState, ReactNode } from "react";

export type DragItem = {
  type: 'document' | 'folder';
  id: string;
  title: string;
  folderId?: string | null;
  parentId?: string | null;
};

export type DropTarget = {
  type: 'folder';
  id: string | null; // null for root
  name: string;
};

interface DragDropContextType {
  dragItem: DragItem | null;
  isDragging: boolean;
  dragPreview: string | null;
  setDragItem: (item: DragItem | null) => void;
  setDragPreview: (preview: string | null) => void;
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  canDrop: (target: DropTarget) => boolean;
  handleDrop: (target: DropTarget) => Promise<boolean>;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

interface DragDropProviderProps {
  children: ReactNode;
  onMoveDocument?: (docId: string, targetFolderId: string | null) => Promise<void>;
  onMoveFolder?: (folderId: string, targetParentId: string | null) => Promise<void>;
}

export function DragDropProvider({ 
  children, 
  onMoveDocument, 
  onMoveFolder 
}: DragDropProviderProps) {
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragPreview, setDragPreview] = useState<string | null>(null);

  const isDragging = dragItem !== null;

  const startDrag = (item: DragItem) => {
    setDragItem(item);
    setDragPreview(item.title);
  };

  const endDrag = () => {
    setDragItem(null);
    setDragPreview(null);
  };

  const canDrop = (target: DropTarget): boolean => {
    if (!dragItem) return false;

    // Can't drop on itself
    if (dragItem.id === target.id) return false;

    // Can't drop a folder on its own descendant (prevent circular structure)
    if (dragItem.type === 'folder' && target.type === 'folder') {
      // This would need more complex logic to check the folder hierarchy
      // For now, we'll allow it and let the backend validate
      return true;
    }

    return true;
  };

  const handleDrop = async (target: DropTarget): Promise<boolean> => {
    if (!dragItem || !canDrop(target)) return false;

    try {
      if (dragItem.type === 'document' && onMoveDocument) {
        await onMoveDocument(dragItem.id, target.id);
      } else if (dragItem.type === 'folder' && onMoveFolder) {
        await onMoveFolder(dragItem.id, target.id);
      }
      
      endDrag();
      return true;
    } catch (error) {
      console.error('Drop failed:', error);
      endDrag();
      return false;
    }
  };

  const value: DragDropContextType = {
    dragItem,
    isDragging,
    dragPreview,
    setDragItem,
    setDragPreview,
    startDrag,
    endDrag,
    canDrop,
    handleDrop,
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}