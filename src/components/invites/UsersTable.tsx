
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, User, UserCog, Users, Trash2 } from "lucide-react";
import { UserProfile } from "@/hooks";

interface UsersTableProps {
  users: UserProfile[];
  loading: boolean;
  currentUserId: string | null;
  onChangeRole: (user: UserProfile) => void;
  onDeleteUser?: (userId: string) => Promise<boolean>;
}

export const UsersTable = ({ 
  users, 
  loading, 
  currentUserId,
  onChangeRole,
  onDeleteUser
}: UsersTableProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !onDeleteUser) return;
    
    setIsDeleting(true);
    await onDeleteUser(userToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-xl font-medium">No users found</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          There are no registered users in the system yet.
        </p>
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
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.full_name || "Unnamed User"}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </TableCell>
              <TableCell>
                {user.is_admin ? (
                  <span className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-1 text-primary" />
                    Administrator
                  </span>
                ) : (
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1 text-muted-foreground" />
                    Regular User
                  </span>
                )}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                {user.id !== currentUserId && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onChangeRole(user)}
                      className="flex items-center"
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      Change Role
                    </Button>
                    {onDeleteUser && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{userToDelete?.full_name || userToDelete?.email}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. All user data will be permanently removed including:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>User profile and authentication</li>
                <li>Company access permissions</li>
                <li>Authentication codes</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Records created by this user (documents, tasks, etc.) will be reassigned to you.
              </p>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
