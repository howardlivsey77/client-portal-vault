import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Import custom hooks
import { useInvites } from "@/hooks/useInvites";
import { useUsers, UserProfile } from "@/hooks/useUsers";
import { useCompany } from "@/providers/CompanyProvider";

// Import components
import { InviteManagementHeader } from "@/components/invites/InviteManagementHeader";
import { InviteManagementTabs } from "@/components/invites/InviteManagementTabs";
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
  const { currentCompany, companies } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  
  // Use our custom hooks
  const { 
    invitations, 
    loading: invitationsLoading, 
    error: invitationsError,
    fetchInvitations,
    createInvitation,
    deleteInvitation 
  } = useInvites();
  
  const {
    users,
    loading: usersLoading,
    error: usersError,
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
      await fetchInvitations();
    };
    
    checkAuth();
  }, [navigate]);
  
  useEffect(() => {
    if (!selectedCompanyId && currentCompany?.id) {
      setSelectedCompanyId(currentCompany.id);
    }
  }, [currentCompany?.id, selectedCompanyId]);
  
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createInvitation(email, selectedRole, userId, selectedCompanyId);
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

  const refreshData = () => {
    if (activeTab === "invitations") {
      fetchInvitations();
    } else {
      fetchUsers();
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
      <InviteManagementHeader
        title="Team Access Management"
        loading={activeTab === "invitations" ? invitationsLoading : usersLoading}
        refreshData={refreshData}
        inviteDialogOpen={inviteDialogOpen}
        setInviteDialogOpen={setInviteDialogOpen}
        email={email}
        setEmail={setEmail}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        invitationsLoading={invitationsLoading}
        handleCreateInvitation={handleCreateInvitation}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
      />
      
      <InviteManagementTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        invitations={invitations}
        users={users}
        invitationsLoading={invitationsLoading}
        usersLoading={usersLoading}
        userId={userId}
        onDeleteInvitation={deleteInvitation}
        onChangeRole={openRoleDialog}
        invitationsError={invitationsError}
        usersError={usersError}
      />
      
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
