
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import custom hooks
import { useInvites } from "@/hooks/useInvites";
import { useUsers, UserProfile } from "@/hooks/useUsers";

// Import components
import { InviteUserForm } from "@/components/invites/InviteUserForm";
import { InvitationsTable } from "@/components/invites/InvitationsTable";
import { UsersTable } from "@/components/invites/UsersTable";
import { UserRoleDialog } from "@/components/invites/UserRoleDialog";

const InviteManagement = () => {
  const [email, setEmail] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("invitations");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use our custom hooks
  const { 
    invitations, 
    loading: invitationsLoading, 
    fetchInvitations,
    createInvitation,
    deleteInvitation 
  } = useInvites();
  
  const {
    users,
    loading: usersLoading,
    fetchUsers,
    updateUserRole
  } = useUsers();
  
  // Check if user is logged in and is admin
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        navigate("/auth");
        return;
      }
      
      setUserId(sessionData.session.user.id);
      
      // Check if user is admin
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", sessionData.session.user.id)
        .single();
      
      if (!profileData?.is_admin) {
        toast({
          title: "Access denied",
          description: "You need administrator privileges to access this page.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      
      setIsAdmin(true);
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createInvitation(email, selectedRole, userId);
    if (success) {
      setEmail("");
      setInviteDialogOpen(false);
    }
  };
  
  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRole(user.is_admin ? "admin" : "user");
    setRoleDialogOpen(true);
  };
  
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const success = await updateUserRole(selectedUser.id, selectedRole === "admin");
    if (success) {
      setRoleDialogOpen(false);
    }
  };
  
  if (!isAdmin) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Team Access Management</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={activeTab === "invitations" ? fetchInvitations : fetchUsers} disabled={loading}>
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
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
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
              onDelete={deleteInvitation} 
            />
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <UsersTable 
              users={users} 
              loading={usersLoading} 
              currentUserId={userId}
              onChangeRole={openRoleDialog}
            />
          </TabsContent>
        </CardContent>
      </Card>
      
      <UserRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        selectedUser={selectedUser}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        loading={usersLoading}
        onSubmit={handleUpdateRole}
      />
    </PageContainer>
  );
};

export default InviteManagement;
