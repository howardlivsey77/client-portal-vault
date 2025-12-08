
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { InvitationsTable } from "@/components/invites/InvitationsTable";
import { UsersTable } from "@/components/invites/UsersTable";
import { UserProfile, InvitationMetadata } from "@/hooks";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface InviteManagementTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  invitations: InvitationMetadata[];
  users: UserProfile[];
  invitationsLoading: boolean;
  usersLoading: boolean;
  userId: string | null;
  onDeleteInvitation: (id: string) => Promise<boolean>;
  onResendInvitation: (id: string) => Promise<boolean>;
  onChangeRole: (user: UserProfile) => void;
  onDeleteUser?: (userId: string) => Promise<boolean>;
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
  onResendInvitation,
  onChangeRole,
  onDeleteUser,
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
                    onResend={onResendInvitation}
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
                    onDeleteUser={onDeleteUser}
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
