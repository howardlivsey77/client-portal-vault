
import React from "react";
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Mail } from "lucide-react";
import { InvitationMetadata } from "@/hooks/useInvites";
import { ExpandableInviteRow } from "./ExpandableInviteRow";

interface InvitationsTableProps {
  invitations: InvitationMetadata[];
  loading: boolean;
  onDelete: (id: string) => void;
  onResend: (id: string) => Promise<boolean>;
}

export const InvitationsTable = ({ 
  invitations, 
  loading, 
  onDelete,
  onResend
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
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <ExpandableInviteRow 
            key={invitation.id}
            invitation={invitation}
            onDelete={onDelete}
            onResend={onResend}
          />
        ))}
      </TableBody>
    </Table>
  );
};
