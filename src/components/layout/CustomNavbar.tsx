import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Bell, BellDot, User, Lock, LogOut, Building } from 'lucide-react';
import { useAuth } from "@/providers";
import { useNavigate } from 'react-router-dom';
import { useNotifications } from "@/components/notifications/NotificationsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CompaniesMenu } from "./sidebar/CompaniesMenu";

interface NavbarProps {
  toggleSidebar?: () => void;
}

export function CustomNavbar({ toggleSidebar }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { unreadCount, timesheetExceptionsCount } = useNotifications();
  const navigate = useNavigate();
  
  const hasNotifications = unreadCount > 0 || timesheetExceptionsCount > 0;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-[hsl(var(--header))] text-foreground border-[1.5px] border-foreground px-4 sm:px-6 lg:px-8">
      {toggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden text-foreground hover:bg-[hsl(var(--foreground))/0.08]"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      )}
      
      <div className="flex items-center">
        <img 
          src="/images/fergi-logo.png" 
          alt="Fergi Logo" 
          className="h-14" 
        />
      </div>
      
      {/* Company Selector - Centered with half width */}
      <div className="flex-1 flex justify-center">
        <div className="w-1/2 max-w-md">
          {user && <CompaniesMenu />}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-[hsl(var(--foreground))/0.08] relative">
                {hasNotifications ? (
                  <>
                    <BellDot className="h-5 w-5 text-amber-500" />
                    {unreadCount + timesheetExceptionsCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white rounded-full text-xs"
                      >
                        {unreadCount + timesheetExceptionsCount}
                      </Badge>
                    )}
                  </>
                ) : (
                  <Bell className="h-5 w-5" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {timesheetExceptionsCount > 0 ? (
                <DropdownMenuItem asChild>
                  <Link to="/?tab=timesheets" className="flex items-center justify-between w-full cursor-pointer">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                      <span>Timesheet Exceptions</span>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {timesheetExceptionsCount}
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                  No new notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-[hsl(var(--foreground))/0.08]">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white">
              {user && (
                <>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Account Settings
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link to="/profile" className="w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/change-password" className="w-full cursor-pointer">
                  <Lock className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/settings/companies" className="w-full">
                  <Building className="mr-2 h-4 w-4" />
                  <span>Manage Companies</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
