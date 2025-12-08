import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link } from "lucide-react";
import { useToast } from "@/hooks";

interface CopyInviteButtonProps {
  inviteUrl: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
}

export function CopyInviteButton({ 
  inviteUrl, 
  variant = "outline", 
  size = "sm",
  showIcon = true 
}: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      
      toast({
        title: "Invite link copied!",
        description: "Share this link directly with the invitee",
      });

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={copyToClipboard}
      className="flex items-center gap-2"
    >
      {showIcon && (
        copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />
      )}
      {copied ? "Copied!" : "Copy Activation Link"}
    </Button>
  );
}

export function InviteLinkDisplay({ inviteUrl }: { inviteUrl: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link className="w-4 h-4" />
        <span>Direct invite link:</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 p-2 text-xs bg-muted rounded border text-muted-foreground break-all">
          {inviteUrl}
        </code>
        <CopyInviteButton inviteUrl={inviteUrl} showIcon={false} />
      </div>
      <p className="text-xs text-muted-foreground">
        Share this link directly if email delivery fails
      </p>
    </div>
  );
}