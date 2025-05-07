
import React from "react";
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
import { Loader2, ShieldCheck, User, UserCog, Users } from "lucide-react";
import { UserProfile } from "@/hooks/useUsers";

interface UsersTableProps {
  users: UserProfile[];
  loading: boolean;
  currentUserId: string | null;
  onChangeRole: (user: UserProfile) => void;
}

export const UsersTable = ({ 
  users, 
  loading, 
  currentUserId,
  onChangeRole 
}: UsersTableProps) => {
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
                  <ShieldCheck className="h-4 w-4 mr-1 text-monday-blue" />
                  Administrator
                </span>
              ) : (
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-monday-gray" />
                  Regular User
                </span>
              )}
            </TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-right">
              {user.id !== currentUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangeRole(user)}
                  className="flex items-center"
                >
                  <UserCog className="h-4 w-4 mr-1" />
                  Change Role
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
