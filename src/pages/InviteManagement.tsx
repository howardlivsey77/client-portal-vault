
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, Plus, RefreshCw, Trash2, User, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface Invitation {
  id: string;
  email: string;
  invite_code: string;
  issued_at: string;
  expires_at: string;
  is_accepted: boolean;
  accepted_at: string | null;
  is_admin: boolean;
}

const InviteManagement = () => {
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      fetchInvitations();
    };
    
    checkAuth();
  }, [navigate]);
  
  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("issued_at", { ascending: false });
        
      if (error) throw error;
      
      setInvitations(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching invitations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!email.trim()) {
        toast({
          title: "Email required",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return;
      }
      
      // Generate a simpler unique invite code
      // Just use a random string, no specific UUID format required
      const inviteCode = Math.random().toString(36).substring(2, 10);
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const { error } = await supabase
        .from("invitations")
        .insert({
          email: email.toLowerCase().trim(),
          invite_code: inviteCode,
          issued_by: userId,
          expires_at: expiresAt.toISOString(),
          is_accepted: false,
          is_admin: isAdminInvite
        });
      
      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Duplicate invitation",
            description: "This email already has an active invitation.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Invitation created",
          description: `Invitation sent to ${email}${isAdminInvite ? ' with admin privileges' : ''}`,
        });
        setEmail("");
        setIsAdminInvite(false);
        setInviteDialogOpen(false);
        fetchInvitations();
      }
    } catch (error: any) {
      toast({
        title: "Error creating invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteInvitation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Invitation deleted",
        description: "The invitation has been successfully deleted.",
      });
      
      // Update the invitations list
      setInvitations(invitations.filter(invite => invite.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Invitation Management</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchInvitations} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invitation</DialogTitle>
                <DialogDescription>
                  Send an invitation for a new user to join the platform.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={createInvitation}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="admin-privileges" 
                      checked={isAdminInvite}
                      onCheckedChange={() => setIsAdminInvite(!isAdminInvite)} 
                    />
                    <Label htmlFor="admin-privileges" className="cursor-pointer">
                      Grant admin privileges
                    </Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Invitation"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Manage user invitations to the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && invitations.length === 0 ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : invitations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invitation Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {invitation.email}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {invitation.invite_code}
                    </TableCell>
                    <TableCell>
                      <span 
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          invitation.is_accepted 
                            ? "bg-green-100 text-green-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {invitation.is_accepted ? "Accepted" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {invitation.is_admin ? (
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-amber-500" />
                          <span>Admin</span>
                        </div>
                      ) : (
                        <span>User</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(invitation.issued_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expires_at) < new Date() 
                        ? "Expired" 
                        : formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {!invitation.is_accepted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInvitation(invitation.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-xl font-medium">No invitations yet</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Create your first invitation to allow a user to join.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default InviteManagement;
