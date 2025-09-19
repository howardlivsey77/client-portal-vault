
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, ChevronDown, Plus } from "lucide-react";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuth } from "@/providers/ClerkAuthProvider";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CompaniesMenu() {
  const { companies, currentCompany, switchCompany, isLoading } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="monday-sidebar-item flex h-9 w-full items-center rounded-md px-3 py-1 text-sm font-medium">
        <Building className="h-3 w-3 mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="monday-sidebar-item w-full justify-between text-sm font-medium h-9 px-3 border border-[hsl(var(--foreground))]"
        >
          <div className="flex items-center">
            <Building className="h-3 w-3 mr-2" />
            <span className="truncate">
              {currentCompany?.name || "Select Company"}
            </span>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className={`cursor-pointer ${
              currentCompany?.id === company.id ? "bg-blue-50" : ""
            }`}
          >
            <Building className="h-3 w-3 mr-2" />
            <span className="truncate">{company.name}</span>
            {currentCompany?.id === company.id && (
              <span className="ml-auto text-xs text-blue-600">Current</span>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/settings/companies")}
          className="cursor-pointer"
        >
          <Plus className="h-3 w-3 mr-2" />
          <span>Manage Companies</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
