
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ShieldCheck, User } from "lucide-react";

interface InviteUserFormProps {
  email: string;
  setEmail: (email: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const InviteUserForm = ({
  email,
  setEmail,
  selectedRole,
  setSelectedRole,
  loading,
  onSubmit
}: InviteUserFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label>User Role</Label>
          <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="user" id="user-role" />
              <Label htmlFor="user-role" className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                Regular User
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin-role" />
              <Label htmlFor="admin-role" className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                Administrator
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Send Invitation"
          )}
        </Button>
      </div>
    </form>
  );
};
