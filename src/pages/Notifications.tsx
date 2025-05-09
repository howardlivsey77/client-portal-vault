
import React, { useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer";
import { NotificationList } from "@/components/notifications/NotificationList";

const Notifications = () => {
  return (
    <PageContainer title="Notifications">
      <div className="max-w-4xl mx-auto">
        <NotificationList />
      </div>
    </PageContainer>
  );
};

export default Notifications;
