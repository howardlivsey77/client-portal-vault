
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
          <div className="ml-4 space-y-3 pl-2 border-l border-gray-200">
            {/* Create Company Option */}
            {!showCreateOption ? (
              <Button 
                variant="ghost" 
                className="monday-sidebar-item w-full justify-start text-xs py-1 h-7 text-green-600 hover:text-green-700 hover:bg-green-50" 
                onClick={() => setShowCreateOption(true)}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add New Company
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
            
            {/* Companies Table */}
            {companies.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="h-8 px-2 text-xs font-medium text-gray-600">ID</TableHead>
                      <TableHead className="h-8 px-2 text-xs font-medium text-gray-600">Company Name</TableHead>
                      <TableHead className="h-8 px-2 text-xs font-medium text-gray-600">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company, index) => (
                      <TableRow 
                        key={company.id} 
                        className={`cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                          currentCompany?.id === company.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => switchCompany(company.id)}
                      >
                        <TableCell className="p-2 text-xs text-gray-600 font-mono">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-2 text-xs">
                          <div className="flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            <span className={`truncate max-w-[120px] ${
                              currentCompany?.id === company.id ? "font-medium text-blue-700" : "text-gray-700"
                            }`}>
                              {company.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 text-xs text-gray-500 capitalize">
                          {company.role}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-xs text-gray-500 py-2 text-center">No companies available</div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
