
import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { CustomNavbar } from './CustomNavbar';
import { useLocation } from 'react-router-dom';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function PageContainer({ children, title }: PageContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on the auth page
  const isAuthPage = location.pathname === '/auth';
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen flex-col bg-monday-lightgray">
      <CustomNavbar toggleSidebar={!isAuthPage ? toggleSidebar : undefined} />
      
      <div className="flex flex-1">
        {!isAuthPage && <Sidebar isOpen={sidebarOpen} />}
        
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
