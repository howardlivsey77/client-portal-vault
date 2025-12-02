
import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { CustomNavbar } from './CustomNavbar';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

function PageContainerInner({ children, title }: PageContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isExpanded, isCollapsed, isHovering } = useSidebarContext();
  
  const isAuthPage = location.pathname === '/auth';
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomNavbar toggleSidebar={!isAuthPage ? toggleSidebar : undefined} />
      
      <div className="flex flex-1">
        {!isAuthPage && <Sidebar isOpen={sidebarOpen} />}
        
        {/* Spacer div to push content - only needed when sidebar is static (not hovering overlay) */}
        {!isAuthPage && (
          <div 
            className={cn(
              "hidden lg:block shrink-0 transition-all duration-300",
              isExpanded && !isHovering ? "w-64" : "w-16"
            )}
          />
        )}
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-monday-darkblue">{title}</h1>
              </div>
            )}
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function PageContainer(props: PageContainerProps) {
  return (
    <SidebarProvider>
      <PageContainerInner {...props} />
    </SidebarProvider>
  );
}
