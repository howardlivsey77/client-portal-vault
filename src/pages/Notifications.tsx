
import React, { useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useNotifications } from "@/components/notifications/NotificationsContext";

const Notifications = () => {
  const { markAllAsRead } = useNotifications();
  
  // Mark all notifications as read when visiting the notifications page
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);
  
  return (
    <PageContainer title="Notifications">
      <div className="max-w-4xl mx-auto">
        <NotificationList />
      </div>
    </PageContainer>
  );
};

export default Notifications;
