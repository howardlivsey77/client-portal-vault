
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
import { Loader2, Mail, ShieldCheck, Trash2, User } from "lucide-react";
import { InvitationMetadata } from "@/hooks/useInvites";

interface InvitationsTableProps {
  invitations: InvitationMetadata[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export const InvitationsTable = ({ 
  invitations, 
  loading, 
  onDelete 
}: InvitationsTableProps) => {
  if (loading && invitations.length === 0) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-xl font-medium">No invitations</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create your first invitation to allow a user to join.
        </p>
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
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
              {invitation.invited_email}
            </TableCell>
            <TableCell>
              {invitation.role === "admin" ? (
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
              {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell>
              Native Email Invitation
            </TableCell>
            <TableCell className="text-right">
              {!invitation.is_accepted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(invitation.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
