import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, MessageCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvitationLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteUrl: string;
  email: string;
  role: string;
}

export const InvitationLinkModal = ({
  open,
  onOpenChange,
  inviteUrl,
  email,
  role
}: InvitationLinkModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const emailTemplate = `Subject: You're invited to join our platform

Hi there,

You have been invited to join our platform as a ${role}.

Click the link below to accept your invitation:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
The Team`;

  const handleEmailTemplate = () => {
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent('You\'re invited to join our platform')}&body=${encodeURIComponent(emailTemplate)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitation Created</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Email sending failed, but the invitation was created successfully. 
            You can manually send this invitation link to <strong>{email}</strong>.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="invite-link">Invitation Link</Label>
            <div className="flex gap-2">
              <Input
                id="invite-link"
                value={inviteUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleEmailTemplate} className="flex-1">
              <Mail className="mr-2 h-4 w-4" />
              Open Email Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};