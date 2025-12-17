import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { TeamMember } from "@/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Copy, Mail, MoreHorizontal, Trash2, UserCog, Loader2 } from "lucide-react";
import { useToast } from "@/hooks";

interface TeamMembersTableProps {
  members: TeamMember[];
  loading: boolean;
  currentUserId: string | null;
  onDeleteInvitation: (invitationId: string) => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onResendInvitation: (invitationId: string) => Promise<boolean>;
  onUpdateRole: (userId: string, role: string) => Promise<boolean>;
}

export const TeamMembersTable = ({
  members,
  loading,
  currentUserId,
  onDeleteInvitation,
  onDeleteUser,
  onResendInvitation,
  onUpdateRole,
}: TeamMembersTableProps) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCopyLink = async (token: string | undefined) => {
    if (!token) {
      toast({
        title: "No link available",
        description: "This invitation doesn't have a shareable link.",
        variant: "destructive"
      });
      return;
    }
    
    const inviteUrl = `${window.location.origin}/auth?token=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    
    setIsDeleting(true);
    try {
      if (memberToDelete.status === 'pending' && memberToDelete.invitationId) {
        await onDeleteInvitation(memberToDelete.invitationId);
      } else if (memberToDelete.userId) {
        await onDeleteUser(memberToDelete.userId);
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleChangeRoleClick = (member: TeamMember) => {
    setMemberToEdit(member);
    setSelectedRole(member.role || (member.isAdmin ? "admin" : "user"));
    setRoleDialogOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!memberToEdit?.userId) return;
    
    setIsUpdating(true);
    try {
      await onUpdateRole(memberToEdit.userId, selectedRole);
    } finally {
      setIsUpdating(false);
      setRoleDialogOpen(false);
      setMemberToEdit(null);
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team members found. Invite users to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div>
                  {member.name && (
                    <div className="font-medium">{member.name}</div>
                  )}
                  <div className={member.name ? "text-sm text-muted-foreground" : "font-medium"}>
                    {member.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="capitalize">
                  {member.role === 'admin' ? 'Administrator' : member.role === 'payroll' ? 'Payroll User' : 'User'}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                  {member.status === 'active' ? 'Active' : 'Pending'}
                </Badge>
              </TableCell>
              <TableCell>
                <span title={format(new Date(member.date), "PPP")}>
                  {member.status === 'active' ? 'Joined ' : 'Invited '}
                  {formatDistanceToNow(new Date(member.date), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.status === 'pending' ? (
                      <>
                        <DropdownMenuItem onClick={() => handleCopyLink(member.token)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Invite Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => member.invitationId && onResendInvitation(member.invitationId)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Invitation
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        {member.userId !== currentUserId && (
                          <>
                            <DropdownMenuItem onClick={() => handleChangeRoleClick(member)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(member)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                        {member.userId === currentUserId && (
                          <DropdownMenuItem disabled>
                            <span className="text-muted-foreground">This is you</span>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToDelete?.status === 'pending' ? 'Delete Invitation?' : 'Delete User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDelete?.status === 'pending' ? (
                <>
                  This will delete the invitation for <strong>{memberToDelete?.email}</strong>.
                  {memberToDelete?.token && (
                    <span className="block mt-2 text-destructive">
                      If an unconfirmed account exists for this email, it will also be deleted.
                    </span>
                  )}
                </>
              ) : (
                <>
                  This will permanently delete <strong>{memberToDelete?.name || memberToDelete?.email}</strong> 
                  and all their associated data. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {memberToEdit?.name || memberToEdit?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="payroll">Payroll User</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRoleChange} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
