
import { useCompany, useAuth } from "@/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Building, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CompanySelectorProps {
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

const CompanySelector = ({ 
  variant = "outline", 
  className 
}: CompanySelectorProps) => {
  const { currentCompany, companies, switchCompany, isLoading } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToCompanyManagement = () => {
    navigate("/settings/companies");
  };

  if (isLoading) {
    return (
      <Button variant={variant} className={cn("h-9 w-[180px]", className)} disabled>
        <Building className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <Button 
        variant="default" 
        className={cn("h-9 w-auto bg-primary hover:bg-primary/90", className)} 
        onClick={goToCompanyManagement}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Company
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={cn("h-9 justify-between", className)}>
          <div className="flex items-center truncate">
            <Building className="mr-2 h-4 w-4" />
            <span className="truncate max-w-[140px]">
              {currentCompany?.name || "Select Company"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Select Company</DropdownMenuLabel>
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="truncate">{company.name}</span>
            {company.role && (
              <span className="text-xs text-muted-foreground ml-2">
                {company.role}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="bg-primary/10 hover:bg-primary/20 text-primary font-medium cursor-pointer"
          onClick={goToCompanyManagement}
        >
          <Plus className="mr-2 h-4 w-4" /> 
          Add New Company
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={goToCompanyManagement}
        >
          <Building className="mr-2 h-4 w-4" /> 
          Manage Companies
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompanySelector;
