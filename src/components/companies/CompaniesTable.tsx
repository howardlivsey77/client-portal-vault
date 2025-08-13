
import { useState, useEffect } from "react";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, Search, Plus } from "lucide-react";
import { CreateCompanyOption } from "@/components/auth/company-access/CreateCompanyOption";

export function CompaniesTable() {
  const { companies, currentCompany, switchCompany, isLoading } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateOption, setShowCreateOption] = useState(false);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompanyClick = async (companyId: string) => {
    // First switch to the company
    await switchCompany(companyId);
    // Then navigate to the company settings
    navigate("/settings/company/general");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>Loading companies...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[1.5px] border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Companies
            </CardTitle>
            <CardDescription>
              Manage and view all available companies
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateOption(!showCreateOption)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Company
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Create Company Option */}
        {showCreateOption && (
          <div className="mt-4 p-4 bg-green-50 rounded-md">
            <CreateCompanyOption userId={user?.id} />
            <Button 
              variant="ghost" 
              size="sm"
              className="mt-2" 
              onClick={() => setShowCreateOption(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredCompanies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Company Address</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company, index) => (
                <TableRow 
                  key={company.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    currentCompany?.id === company.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleCompanyClick(company.id)}
                >
                  <TableCell className="font-mono text-sm">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className={`font-medium ${
                          currentCompany?.id === company.id ? "text-blue-700" : ""
                        }`}>
                          {company.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {/* For now showing placeholder address since we only have company name and role in CompanyWithRole type */}
                    <span className="text-sm">Address not available</span>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm bg-gray-100 px-2 py-1 rounded">
                      {company.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {currentCompany?.id === company.id ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                        Current
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Available
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No companies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No companies match your search." : "No companies available."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateOption(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Company
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
