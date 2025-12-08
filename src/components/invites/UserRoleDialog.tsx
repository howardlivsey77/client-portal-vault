
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { UserProfile } from "@/hooks";

interface UserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserProfile | null;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserRoleDialog = ({
  open,
  onOpenChange,
  selectedUser,
  selectedRole,
  setSelectedRole,
  loading,
  onSubmit
}: UserRoleDialogProps) => {
  if (!selectedUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {selectedUser?.email}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="change-user-role" />
                <Label htmlFor="change-user-role" className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  Regular User
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="change-admin-role" />
                <Label htmlFor="change-admin-role" className="flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                  Administrator
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
