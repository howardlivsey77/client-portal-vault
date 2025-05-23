
import { useCompany } from "@/providers/CompanyProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Building, Plus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

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
      <Button variant={variant} className={cn("h-9 w-[180px]", className)} disabled>
        <Building className="mr-2 h-4 w-4" />
        No Companies
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
        {/* Make company management available to all users */}
        <DropdownMenuItem
          className="border-t mt-1 pt-1 cursor-pointer"
          onClick={() => window.location.href = "/settings/companies"}
        >
          <Plus className="mr-2 h-4 w-4" /> 
          Manage Companies
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompanySelector;
