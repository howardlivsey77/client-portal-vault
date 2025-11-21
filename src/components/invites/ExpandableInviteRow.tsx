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
  ExternalLink,
  History,
  CheckCircle,
  XCircle
} from "lucide-react";
import { InvitationMetadata } from "@/hooks/useInvites";
import { CopyInviteButton, InviteLinkDisplay } from "./CopyInviteButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useInvitationHistory } from "@/hooks/useInvitationHistory";

interface ExpandableInviteRowProps {
  invitation: InvitationMetadata;
  onDelete: (id: string) => void;
  onResend: (id: string) => Promise<boolean>;
}

export const ExpandableInviteRow = ({ invitation, onDelete, onResend }: ExpandableInviteRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { data: resendHistory } = useInvitationHistory(invitation.id);
  const inviteUrl = invitation.token 
    ? `${window.location.origin}/invite/accept?token=${invitation.token}`
    : null;


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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsResending(true);
                      await onResend(invitation.id);
                      setIsResending(false);
                    }}
                    disabled={isResending}
                  >
                    <Send className="w-4 h-4" />
                    {isResending ? "Sending..." : "Resend Email"}
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

                {/* Resend History */}
                {resendHistory && resendHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium mb-3">
                      <History className="w-4 h-4" />
                      Resend History ({resendHistory.length})
                    </div>
                    <div className="space-y-2">
                      {resendHistory.map((log) => (
                        <div 
                          key={log.id} 
                          className="text-xs p-3 rounded bg-background border flex items-start gap-2"
                        >
                          <div className={`mt-0.5 ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                            {log.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          </div>
                          <div className="flex-1">
                            <p>
                              <span className="font-medium">
                                {log.resent_by_profile?.full_name || log.resent_by_profile?.email || 'Admin'}
                              </span>
                              {' '}resent invitation{' '}
                              <span className="text-muted-foreground">
                                {formatDistanceToNow(new Date(log.resent_at), { addSuffix: true })}
                              </span>
                            </p>
                            {!log.success && log.error_message && (
                              <p className="text-red-600 mt-1">Error: {log.error_message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};