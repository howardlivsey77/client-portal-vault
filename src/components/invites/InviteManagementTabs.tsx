
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { InvitationsTable } from "@/components/invites/InvitationsTable";
import { UsersTable } from "@/components/invites/UsersTable";
import { UserProfile } from "@/hooks/useUsers";
import { Invitation } from "@/hooks/useInvites";

interface InviteManagementTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  invitations: Invitation[];
  users: UserProfile[];
  invitationsLoading: boolean;
  usersLoading: boolean;
  userId: string | null;
  onDeleteInvitation: (id: string) => void;
  onChangeRole: (user: UserProfile) => void;
}

export const InviteManagementTabs = ({
  activeTab,
  setActiveTab,
  invitations,
  users,
  invitationsLoading,
  usersLoading,
  userId,
  onDeleteInvitation,
  onChangeRole
}: InviteManagementTabsProps) => {
  return (
    <Card>
      <CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
            <TabsTrigger value="users">Active Users</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <TabsContent value="invitations" className="mt-0">
          <InvitationsTable 
            invitations={invitations} 
            loading={invitationsLoading} 
            onDelete={onDeleteInvitation} 
          />
        </TabsContent>
        
        <TabsContent value="users" className="mt-0">
          <UsersTable 
            users={users} 
            loading={usersLoading} 
            currentUserId={userId}
            onChangeRole={onChangeRole}
          />
        </TabsContent>
      </CardContent>
    </Card>
  );
};
