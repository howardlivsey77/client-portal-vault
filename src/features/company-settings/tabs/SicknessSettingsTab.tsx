
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SicknessSchemeForm } from "../components/SicknessSchemeForm";
import { SicknessScheme } from "../types";
import { useSicknessSchemes } from "../hooks/useSicknessSchemes";
import { toast } from "sonner";
import { SchemesList } from "../components/sickness/SchemesList";
import { EmptySchemesState } from "../components/sickness/EmptySchemesState";
import { SchemesLoading } from "../components/sickness/SchemesLoading";

const SicknessSettingsTab = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SicknessScheme | null>(null);
  const { schemes, loading, saveScheme } = useSicknessSchemes();

  const handleAddScheme = () => {
    setEditingScheme(null);
    setIsFormOpen(true);
  };

  const handleEditScheme = (scheme: SicknessScheme) => {
    setEditingScheme(scheme);
    setIsFormOpen(true);
  };

  const handleSaveScheme = async (scheme: SicknessScheme) => {
    const result = await saveScheme(scheme);
    
    if (result.success) {
      toast.success(result.message);
      setIsFormOpen(false);
    } else {
      toast.error("Error saving scheme", {
        description: result.message
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
                <SchemesLoading />
              ) : schemes.length > 0 ? (
                <SchemesList 
                  schemes={schemes} 
                  onEditScheme={handleEditScheme} 
                />
              ) : (
                <EmptySchemesState onAddScheme={handleAddScheme} />
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
