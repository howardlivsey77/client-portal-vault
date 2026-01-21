import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, User, Calculator, Briefcase } from "lucide-react";

interface RoleSelectionProps {
  selectedRole: string;
  setSelectedRole: (role: string) => void;
}

export const RoleSelection = ({ selectedRole, setSelectedRole }: RoleSelectionProps) => {
  return (
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
          <RadioGroupItem value="payroll" id="payroll-role" />
          <Label htmlFor="payroll-role" className="flex items-center">
            <Calculator className="h-4 w-4 mr-2 text-muted-foreground" />
            Payroll User
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bureau" id="bureau-role" />
          <Label htmlFor="bureau-role" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
            Bureau User
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
  );
};
