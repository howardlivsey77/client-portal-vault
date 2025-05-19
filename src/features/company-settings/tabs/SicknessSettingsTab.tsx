
import { useState, useEffect } from "react";
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
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SicknessSettingsTab = () => {
  const [schemes, setSchemes] = useState<SicknessScheme[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SicknessScheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSicknessSchemes();
  }, []);

  const fetchSicknessSchemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sickness_schemes')
        .select('id, name, eligibility_rules');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our SicknessScheme interface
        const transformedData: SicknessScheme[] = data.map(item => ({
          id: item.id,
          name: item.name,
          // Parse the JSON eligibility rules
          eligibilityRules: item.eligibility_rules ? JSON.parse(item.eligibility_rules as string) : null
        }));
        setSchemes(transformedData);
      }
    } catch (error: any) {
      console.error("Error fetching sickness schemes:", error.message);
      toast({
        title: "Error loading schemes",
        description: "There was a problem loading sickness schemes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddScheme = () => {
    setEditingScheme(null);
    setIsFormOpen(true);
  };

  const handleEditScheme = (scheme: SicknessScheme) => {
    setEditingScheme(scheme);
    setIsFormOpen(true);
  };

  const handleSaveScheme = async (scheme: SicknessScheme) => {
    try {
      if (editingScheme) {
        // Update existing scheme
        const { error } = await supabase
          .from('sickness_schemes')
          .update({ 
            name: scheme.name, 
            // Stringify the eligibility rules for storage
            eligibility_rules: JSON.stringify(scheme.eligibilityRules) 
          })
          .eq('id', scheme.id);
          
        if (error) throw error;
        
        setSchemes(schemes.map(s => s.id === scheme.id ? scheme : s));
        toast({
          title: "Scheme updated",
          description: `${scheme.name} has been updated successfully.`
        });
      } else {
        // Add new scheme
        const { data, error } = await supabase
          .from('sickness_schemes')
          .insert({ 
            name: scheme.name, 
            // Stringify the eligibility rules for storage
            eligibility_rules: JSON.stringify(scheme.eligibilityRules)
          })
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          const newScheme: SicknessScheme = {
            id: data[0].id,
            name: data[0].name,
            // Parse the eligibility rules
            eligibilityRules: data[0].eligibility_rules ? JSON.parse(data[0].eligibility_rules as string) : null
          };
          setSchemes([...schemes, newScheme]);
          toast({
            title: "Scheme added",
            description: `${scheme.name} has been added successfully.`
          });
        }
      }
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Error saving scheme:", error.message);
      toast({
        title: "Error saving scheme",
        description: "There was a problem saving the sickness scheme. Please try again.",
        variant: "destructive"
      });
    }
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
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading schemes...</div>
                </div>
              ) : schemes.length > 0 ? (
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
                          <TableCell>{scheme.eligibilityRules?.length || 0}</TableCell>
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
