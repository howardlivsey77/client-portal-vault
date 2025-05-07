
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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
  invitationsError?: string | null;
  usersError?: string | null;
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
  onChangeRole,
  invitationsError,
  usersError
}: InviteManagementTabsProps) => {
  return (
    <Card>
      <CardHeader>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
            <TabsTrigger value="users">Active Users</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            {activeTab === "invitations" && (
              <>
                {invitationsError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{invitationsError}</AlertDescription>
                  </Alert>
                ) : (
                  <InvitationsTable 
                    invitations={invitations} 
                    loading={invitationsLoading} 
                    onDelete={onDeleteInvitation} 
                  />
                )}
              </>
            )}
            
            {activeTab === "users" && (
              <>
                {usersError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{usersError}</AlertDescription>
                  </Alert>
                ) : (
                  <UsersTable 
                    users={users} 
                    loading={usersLoading} 
                    currentUserId={userId}
                    onChangeRole={onChangeRole}
                  />
                )}
              </>
            )}
          </div>
        </Tabs>
      </CardHeader>
    </Card>
  );
};
