import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { CustomNavbar } from './CustomNavbar';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

function PageContainerInner({ children, title }: PageContainerProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  
  const isAuthPage = location.pathname === '/auth';
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CustomNavbar toggleSidebar={!isAuthPage ? toggleMobileSidebar : undefined} />
      
      <div className="flex flex-1">
        {!isAuthPage && <Sidebar isMobileOpen={mobileSidebarOpen} />}
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto px-3 py-6 md:px-4 lg:px-4">
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
