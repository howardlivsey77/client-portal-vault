
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CompanyHeaderProps {
  onAddCompany: () => void;
}

export const CompanyHeader = ({ onAddCompany }: CompanyHeaderProps) => {
  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <h1 className="text-3xl font-bold tracking-tight flex items-center">
        <Building className="mr-2 h-8 w-8" /> Company Management
      </h1>
      <div className="flex space-x-2">
        <Button 
          onClick={onAddCompany} 
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </div>
    </div>
  );
};
