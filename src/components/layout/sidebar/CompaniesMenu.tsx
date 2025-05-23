
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCompany } from "@/providers/CompanyProvider";
import { CreateCompanyOption } from "@/components/auth/company-access/CreateCompanyOption";
import { useAuth } from "@/providers/AuthProvider";

export function CompaniesMenu() {
  const { companies, currentCompany, switchCompany, isLoading } = useCompany();
  const { user } = useAuth();
  const [showCreateOption, setShowCreateOption] = useState(false);

  if (isLoading) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="companies" className="border-0">
          <AccordionTrigger className="monday-sidebar-item flex h-9 w-full items-center rounded-md px-3 py-1 text-sm font-medium hover:bg-muted">
            <div className="flex items-center">
              <Building className="h-3 w-3 mr-2" />
              <span>Companies</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0 pt-1">
            <div className="ml-4 space-y-1 pl-2 border-l border-gray-200">
              <div className="text-xs text-gray-500 py-2">Loading companies...</div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="companies" className="border-0">
        <AccordionTrigger className="monday-sidebar-item flex h-9 w-full items-center rounded-md px-3 py-1 text-sm font-medium hover:bg-muted">
          <div className="flex items-center">
            <Building className="h-3 w-3 mr-2" />
            <span>Companies</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-0 pt-1">
          <div className="ml-4 space-y-1 pl-2 border-l border-gray-200">
            {/* Create Company Option */}
            {!showCreateOption ? (
              <Button 
                variant="ghost" 
                className="monday-sidebar-item w-full justify-start text-xs py-1 h-7 text-green-600 hover:text-green-700 hover:bg-green-50" 
                onClick={() => setShowCreateOption(true)}
              >
                <Plus className="h-3 w-3 mr-2" />
                Create Company
              </Button>
            ) : (
              <div className="p-2 bg-green-50 rounded-md mb-2">
                <CreateCompanyOption userId={user?.id} />
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="mt-2 text-xs" 
                  onClick={() => setShowCreateOption(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {/* Companies List */}
            {companies.length > 0 ? (
              <>
                <div className="text-xs text-gray-500 py-1 font-medium">Available Companies:</div>
                {companies.map((company) => (
                  <Button
                    key={company.id}
                    variant="ghost"
                    className={`monday-sidebar-item w-full justify-start text-xs py-1 h-7 ${
                      currentCompany?.id === company.id 
                        ? "bg-blue-100 text-blue-700 font-medium" 
                        : "text-gray-700"
                    }`}
                    onClick={() => switchCompany(company.id)}
                  >
                    <Building className="h-3 w-3 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="truncate max-w-[140px]">{company.name}</span>
                      <span className="text-xs text-gray-500 capitalize">({company.role})</span>
                    </div>
                  </Button>
                ))}
              </>
            ) : (
              <div className="text-xs text-gray-500 py-2">No companies available</div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
