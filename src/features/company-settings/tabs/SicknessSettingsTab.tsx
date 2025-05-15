
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Table as TableIcon } from "lucide-react";
import { SicknessSchemeForm } from "../components/SicknessSchemeForm";
import { SicknessScheme } from "../types";
import { toast } from "@/components/ui/use-toast";

const SicknessSettingsTab = () => {
  const [schemes, setSchemes] = useState<SicknessScheme[]>([
    {
      id: "1",
      name: "Standard Sickness Scheme",
      eligibilityRules: [
        { id: "rule1", serviceMonthsFrom: 0, serviceMonthsTo: 6, companyPaidDays: 3, sicknessPay: "SSP" },
        { id: "rule2", serviceMonthsFrom: 6, serviceMonthsTo: 12, companyPaidDays: 5, sicknessPay: "SSP" }
      ]
    }
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SicknessScheme | null>(null);

  const handleAddScheme = () => {
    setEditingScheme(null);
    setIsFormOpen(true);
  };

  const handleEditScheme = (scheme: SicknessScheme) => {
    setEditingScheme(scheme);
    setIsFormOpen(true);
  };

  const handleSaveScheme = (scheme: SicknessScheme) => {
    if (editingScheme) {
      // Update existing scheme
      setSchemes(schemes.map(s => s.id === scheme.id ? scheme : s));
      toast({
        title: "Scheme updated",
        description: `${scheme.name} has been updated successfully.`
      });
    } else {
      // Add new scheme
      const newScheme = {
        ...scheme,
        id: `scheme-${Date.now()}`
      };
      setSchemes([...schemes, newScheme]);
      toast({
        title: "Scheme added",
        description: `${newScheme.name} has been added successfully.`
      });
    }
    setIsFormOpen(false);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Sickness</CardTitle>
          <CardDescription>
            Configure sickness and absence policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Define company-wide sickness schemes based on employee service duration.
          </p>
          
          {!isFormOpen ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Sickness Schemes</h3>
                <Button onClick={handleAddScheme}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scheme
                </Button>
              </div>
              
              {schemes.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scheme Name</TableHead>
                        <TableHead>Number of Rules</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schemes.map((scheme) => (
                        <TableRow key={scheme.id}>
                          <TableCell className="font-medium">{scheme.name}</TableCell>
                          <TableCell>{scheme.eligibilityRules.length}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleEditScheme(scheme)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                  <TableIcon className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No schemes defined</h3>
                  <p className="text-muted-foreground text-sm mb-4">Create your first sickness scheme</p>
                  <Button onClick={handleAddScheme}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Scheme
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <SicknessSchemeForm 
              scheme={editingScheme}
              onSave={handleSaveScheme}
              onCancel={handleCancelForm}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SicknessSettingsTab;
