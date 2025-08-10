
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus, RefreshCw } from "lucide-react";
import { InviteUserForm } from "@/components/invites/InviteUserForm";

interface InviteManagementHeaderProps {
  title: string;
  loading: boolean;
  refreshData: () => void;
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (open: boolean) => void;
  email: string;
  setEmail: (email: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  invitationsLoading: boolean;
  handleCreateInvitation: (e: React.FormEvent) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
}

export const InviteManagementHeader = ({
  title,
  loading,
  refreshData,
  inviteDialogOpen,
  setInviteDialogOpen,
  email,
  setEmail,
  selectedRole,
  setSelectedRole,
  invitationsLoading,
  handleCreateInvitation,
  selectedCompanyId,
  setSelectedCompanyId
}: InviteManagementHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={refreshData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation for a new user to join the platform.
              </DialogDescription>
            </DialogHeader>
            
            <InviteUserForm
              email={email}
              setEmail={setEmail}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              loading={invitationsLoading}
              onSubmit={handleCreateInvitation}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
