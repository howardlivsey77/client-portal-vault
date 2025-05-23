
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyHeaderProps {
  onAddCompany: () => void;
}

export const CompanyHeader = ({ onAddCompany }: CompanyHeaderProps) => {
  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <h1 className="text-3xl font-bold tracking-tight flex items-center">
        <Building className="mr-2 h-8 w-8" /> Company Management
      </h1>
      <Button onClick={onAddCompany}>
        <Plus className="mr-2 h-4 w-4" /> Add Company
      </Button>
    </div>
  );
};
