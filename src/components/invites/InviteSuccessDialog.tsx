import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Link, Copy } from "lucide-react";
import { InviteLinkDisplay } from "./CopyInviteButton";

interface InviteSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  inviteUrl?: string;
  role: string;
}

export function InviteSuccessDialog({
  open,
  onOpenChange,
  email,
  inviteUrl,
  role
}: InviteSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <DialogTitle>Invitation Sent Successfully!</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>Email sent to <strong>{email}</strong> with <strong>{role}</strong> role</span>
          </div>
          
          {inviteUrl && (
            <div className="space-y-3">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Backup invite link
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  If the email doesn't arrive, share this direct link with the invitee:
                </p>
                <InviteLinkDisplay inviteUrl={inviteUrl} />
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}