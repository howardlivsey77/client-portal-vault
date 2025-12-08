import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks";
import { Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useCompany } from "@/providers/CompanyProvider";
import { TeamMembersTable } from "@/components/invites/TeamMembersTable";
import { InviteSuccessDialog } from "@/components/invites/InviteSuccessDialog";
import { InviteUserForm } from "@/components/invites/InviteUserForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { invokeFunction } from "@/supabase-invoke-guard";

const InviteManagement = () => {
  const [email, setEmail] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentCompany, companies } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const {
    members,
    loading,
    error,
    fetchMembers,
    deleteInvitation,
    deleteUser,
    resendInvitation,
    updateUserRole,
  } = useTeamMembers();

  // Check if user is logged in and is admin
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        navigate("/auth");
        return;
      }

      setUserId(sessionData.session.user.id);

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
      setAuthLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    if (!selectedCompanyId && currentCompany?.id) {
      setSelectedCompanyId(currentCompany.id);
    }
  }, [currentCompany?.id, selectedCompanyId]);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    try {
      if (!email.trim()) {
        toast({
          title: "Email required",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
      if (!selectedCompanyId) {
        toast({
          title: "Company required",
          description: "Please select a company for this invitation.",
          variant: "destructive"
        });
        return;
      }

      const payload = {
        email: email.toLowerCase().trim(),
        company_id: selectedCompanyId,
        role: selectedRole,
        redirect_to: 'https://payroll.dootsons.com/auth',
        origin: window.location.origin
      };

      const { data, error } = await invokeFunction('admin-invite', { body: payload });

      if (error) {
        throw new Error(error.message || 'Failed to send invitation');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to send invitation');
      }

      if (data?.existing_user) {
        toast({
          title: "User Added",
          description: `${email} already has an account and has been added to the company.`,
        });
      } else {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${email}`,
        });
      }

      setLastInviteUrl(data?.invite_url || null);
      setSuccessDialogOpen(true);
      setEmail("");
      setInviteDialogOpen(false);
      await fetchMembers();
    } catch (err: any) {
      console.error("Error creating invitation:", err);
      toast({
        title: "Invitation Failed",
        description: err.message || 'Failed to send invitation',
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };

  if (authLoading || !isAdmin) {
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Team Access Management</CardTitle>
            <CardDescription>Manage team members and pending invitations</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchMembers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your team
                  </DialogDescription>
                </DialogHeader>
                <InviteUserForm
                  email={email}
                  setEmail={setEmail}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                  loading={inviteLoading}
                  onSubmit={handleCreateInvitation}
                  selectedCompanyId={selectedCompanyId}
                  setSelectedCompanyId={setSelectedCompanyId}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
          <TeamMembersTable
            members={members}
            loading={loading}
            currentUserId={userId}
            onDeleteInvitation={deleteInvitation}
            onDeleteUser={deleteUser}
            onResendInvitation={resendInvitation}
            onUpdateRole={updateUserRole}
          />
        </CardContent>
      </Card>

      <InviteSuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        email={email}
        inviteUrl={lastInviteUrl || undefined}
        role={selectedRole}
      />
    </PageContainer>
  );
};

export default InviteManagement;
