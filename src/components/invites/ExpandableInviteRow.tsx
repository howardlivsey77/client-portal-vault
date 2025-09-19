import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { 
  Mail, 
  ShieldCheck, 
  User, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Send,
  QrCode,
  ExternalLink
} from "lucide-react";
import { InvitationMetadata } from "@/hooks/useInvites";
import { CopyInviteButton, InviteLinkDisplay } from "./CopyInviteButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExpandableInviteRowProps {
  invitation: InvitationMetadata;
  onDelete: (id: string) => void;
}

export const ExpandableInviteRow = ({ invitation, onDelete }: ExpandableInviteRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inviteUrl = invitation.token 
    ? `${window.location.origin}/invite/accept?token=${invitation.token}`
    : null;

  // Debug logging
  console.log('ExpandableInviteRow render:', {
    email: invitation.invited_email,
    isAccepted: invitation.is_accepted,
    hasToken: !!invitation.token,
    showDeleteButton: !invitation.is_accepted
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <TableRow className="cursor-pointer hover:bg-muted/50">
          <TableCell className="flex items-center">
            {!invitation.is_accepted && invitation.token && (
              <Button variant="ghost" size="sm" className="mr-2 p-0 h-6 w-6">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
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
            <div className="flex items-center gap-2 justify-end">
              {!invitation.is_accepted && invitation.token && (
                <CopyInviteButton 
                  inviteUrl={inviteUrl!}
                  variant="outline"
                  size="sm"
                  showIcon={false}
                />
              )}
              {!invitation.is_accepted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(invitation.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleTrigger>
      
      {!invitation.is_accepted && invitation.token && (
        <CollapsibleContent asChild>
          <TableRow>
            <TableCell colSpan={6} className="bg-muted/30 border-t">
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ExternalLink className="w-4 h-4" />
                  Invitation Management
                </div>
                
                <InviteLinkDisplay inviteUrl={inviteUrl!} />
                
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Resend Email
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Show QR Code
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Email sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}</p>
                  <p>• Link can be shared manually if email delivery fails</p>
                  <p>• Invitation expires in 7 days from creation</p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};