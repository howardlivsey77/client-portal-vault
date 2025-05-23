
import { Company } from "@/types/company";
import { Search, Edit, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CompanyListProps {
  companies: Company[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export const CompanyList = ({
  companies,
  loading,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete
}: CompanyListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Companies</CardTitle>
        <CardDescription>
          Manage all companies in the system. Only administrators can access this page.
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Companies</TabsTrigger>
            <TabsTrigger value="recent">Recently Added</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <CompanyTable 
              companies={companies} 
              loading={loading} 
              searchQuery={searchQuery}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </TabsContent>
          <TabsContent value="recent">
            <CompanyTable 
              companies={[...companies]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)}
              loading={loading} 
              searchQuery={searchQuery}
              onEdit={onEdit}
              onDelete={onDelete}
              showCreatedAt={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface CompanyTableProps {
  companies: Company[];
  loading: boolean;
  searchQuery: string;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  showCreatedAt?: boolean;
}

const CompanyTable = ({
  companies,
  loading,
  searchQuery,
  onEdit,
  onDelete,
  showCreatedAt = false
}: CompanyTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company Name</TableHead>
          <TableHead>Trading As</TableHead>
          <TableHead>{showCreatedAt ? 'Added' : 'Contact'}</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8">
              Loading...
            </TableCell>
          </TableRow>
        ) : companies.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8">
              {searchQuery ? "No matching companies found." : "No companies yet. Add your first company."}
            </TableCell>
          </TableRow>
        ) : (
          companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{company.trading_as || "-"}</TableCell>
              <TableCell>
                {showCreatedAt ? (
                  new Date(company.created_at).toLocaleDateString()
                ) : (
                  <>
                    {company.contact_name || "-"}
                    {company.contact_email && (
                      <div className="text-xs text-muted-foreground">
                        {company.contact_email}
                      </div>
                    )}
                  </>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEdit(company)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(company)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/settings/companies/users/${company.id}`}
                  >
                    <Users className="h-4 w-4" />
                    <span className="sr-only">Manage Users</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
