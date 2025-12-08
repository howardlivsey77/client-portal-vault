
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { isTimeOutsideTolerance } from "@/utils";
import { toast } from "@/hooks";

// Define types for our notifications
export type NotificationType = 'timesheet-exception' | 'approval-required' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  timesheetExceptionsCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  checkForTimesheetExceptions: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timesheetExceptionsCount, setTimesheetExceptionsCount] = useState(0);

  // Calculate unread count
  const unreadCount = notifications.filter(notif => !notif.read).length;

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Check for timesheet exceptions
  const checkForTimesheetExceptions = async () => {
    try {
      // Get active employees with timesheets
      const { data: timesheetData, error: timesheetError } = await supabase
        .from('timesheet_entries')
        .select(`
          employee_id,
          date,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end
        `)
        .order('date', { ascending: false });
      
      if (timesheetError) {
        console.error("Error fetching timesheet entries:", timesheetError);
        return;
      }
      
      // Process entries to count exceptions
      if (timesheetData && timesheetData.length > 0) {
        // Calculate exceptions based on time tolerance
        const exceptions = timesheetData.filter(entry => {
          const hasStartException = isTimeOutsideTolerance(
            entry.scheduled_start,
            entry.actual_start,
            15, // early tolerance
            5,  // late tolerance
            true // isStartTime
          );
          
          const hasEndException = isTimeOutsideTolerance(
            entry.scheduled_end,
            entry.actual_end,
            5,  // early tolerance
            15, // late tolerance
            false // isEndTime
          );
          
          return hasStartException || hasEndException;
        });
        
        setTimesheetExceptionsCount(exceptions.length);
        
        // If there are new exceptions, add a notification
        const existingExceptionNotif = notifications.find(n => n.type === 'timesheet-exception');
        
        if (exceptions.length > 0 && !existingExceptionNotif) {
          const newNotification: Notification = {
            id: `timesheet-exception-${Date.now()}`,
            type: 'timesheet-exception',
            title: 'Timesheet Exceptions',
            message: `There are ${exceptions.length} timesheet entries that need attention.`,
            read: false,
            createdAt: new Date()
          };
          
          setNotifications(prev => [newNotification, ...prev]);
        }
      } else {
        setTimesheetExceptionsCount(0);
      }
    } catch (error) {
      console.error("Error checking for timesheet exceptions:", error);
    }
  };
  
  // Initialize - fetch notifications when component mounts
  useEffect(() => {
    checkForTimesheetExceptions();
    
    // Set up periodic checks every 5 minutes
    const intervalId = setInterval(() => {
      checkForTimesheetExceptions();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // For demo/development - let's also check when notifications count changes
  // This would be removed in production and replaced with proper websocket subscriptions
  useEffect(() => {
    if (timesheetExceptionsCount > 0) {
      toast({
        title: "Timesheet Exceptions",
        description: `There are ${timesheetExceptionsCount} timesheet entries that need attention.`,
      });
    }
  }, [timesheetExceptionsCount]);

  const value = {
    notifications,
    unreadCount,
    timesheetExceptionsCount,
    markAsRead,
    markAllAsRead,
    checkForTimesheetExceptions
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
