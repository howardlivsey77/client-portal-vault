
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, ChevronDown, Settings, Plus } from "lucide-react";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuth } from "@/providers/AuthProvider";
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

  const handleCompanySettings = (section?: string) => {
    const basePath = "/settings/company";
    const path = section ? `${basePath}/${section}` : `${basePath}/general`;
    navigate(path);
  };

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
          className="monday-sidebar-item w-full justify-between text-sm font-medium h-9 px-3"
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
        
        {currentCompany && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Company Settings</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleCompanySettings("general")}
              className="cursor-pointer"
            >
              <Settings className="h-3 w-3 mr-2" />
              <span>General Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCompanySettings("sickness")}
              className="cursor-pointer"
            >
              <Settings className="h-3 w-3 mr-2" />
              <span>Sickness Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCompanySettings("locations")}
              className="cursor-pointer"
            >
              <Settings className="h-3 w-3 mr-2" />
              <span>Locations</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCompanySettings("departments")}
              className="cursor-pointer"
            >
              <Settings className="h-3 w-3 mr-2" />
              <span>Departments</span>
            </DropdownMenuItem>
          </>
        )}
        
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
</DropdownMenuTrigger>

<lov-write file_path="src/components/layout/sidebar/SidebarFooterNavigation.tsx">
import { Button } from "@/components/ui/button";
import { Shield, UserCog } from "lucide-react";
import { Link, Location } from "react-router-dom";

interface SidebarFooterNavigationProps {
  location: Location;
  expandedAccordion: string | null;
  onAccordionChange: (value: string) => void;
}

export function SidebarFooterNavigation({ location }: SidebarFooterNavigationProps) {
  return (
    <div className="mt-auto">
      <div className="px-4 py-2">
        <Button
          variant="ghost"
          className={`monday-sidebar-item w-full justify-start ${
            location.pathname === "/profile" ? "bg-muted" : ""
          }`}
          asChild
        >
          <Link to="/profile" className="flex items-center">
            <UserCog className="h-4 w-4 mr-2" />
            Profile
          </Link>
        </Button>
      </div>

      <div className="px-4 py-2">
        <Button
          variant="ghost"
          className={`monday-sidebar-item w-full justify-start ${
            location.pathname === "/security" ? "bg-muted" : ""
          }`}
          asChild
        >
          <Link to="/security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
