import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isHovering: boolean;
  isPinned: boolean;
  toggleCollapsed: () => void;
  togglePinned: () => void;
  setHovering: (hovering: boolean) => void;
  isExpanded: boolean; // Computed: pinned OR hovering when collapsed
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-pinned';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinned] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : true; // Default to pinned/expanded
  });
  const [isHovering, setIsHovering] = useState(false);

  const isCollapsed = !isPinned;
  const isExpanded = isPinned || isHovering;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isPinned));
  }, [isPinned]);

  const toggleCollapsed = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const togglePinned = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const setHovering = useCallback((hovering: boolean) => {
    setIsHovering(hovering);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isHovering,
        isPinned,
        toggleCollapsed,
        togglePinned,
        setHovering,
        isExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}
