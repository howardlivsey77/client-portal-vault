
import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications, Notification as NotificationType } from './NotificationsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const NotificationList = () => {
  const { notifications, timesheetExceptionsCount, markAllAsRead } = useNotifications();

  if (notifications.length === 0 && timesheetExceptionsCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No notifications to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <div className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notifications
          </div>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timesheetExceptionsCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Timesheet Exceptions</AlertTitle>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    There are {timesheetExceptionsCount} timesheet entries that need attention.
                  </span>
                  <Button size="sm" asChild>
                    <Link to="/?tab=timesheets">View</Link>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-4 border rounded-md ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{notification.title}</h3>
                {!notification.read && (
                  <Badge variant="outline">New</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(notification.createdAt).toLocaleString('en-GB')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
