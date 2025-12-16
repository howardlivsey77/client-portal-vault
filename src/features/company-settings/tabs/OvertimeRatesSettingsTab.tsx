import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { TeamnetRateConfigForm } from "../components/TeamnetRateConfigForm";
import { useTeamnetRateConfigs, TeamnetRateConfig } from "../hooks/useTeamnetRateConfigs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OvertimeRatesSettingsTab = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TeamnetRateConfig | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { configs, loading, saveConfig, deleteConfig } = useTeamnetRateConfigs();

  const handleAddConfig = () => {
    setEditingConfig(null);
    setIsFormOpen(true);
  };

  const handleEditConfig = (config: TeamnetRateConfig) => {
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const handleSaveConfig = async (config: TeamnetRateConfig) => {
    const result = await saveConfig(config);
    
    if (result.success) {
      toast.success(result.message);
      setIsFormOpen(false);
    } else {
      toast.error("Error saving configuration", {
        description: result.message
      });
    }
  };

  const handleDeleteConfig = async () => {
    if (!deleteConfirmId) return;
    
    const result = await deleteConfig(deleteConfirmId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setDeleteConfirmId(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 5 && !days.includes("Saturday") && !days.includes("Sunday")) {
      return "Mon-Fri";
    }
    if (days.length === 2 && days.includes("Saturday") && days.includes("Sunday")) {
      return "Weekends";
    }
    return days.map(d => d.slice(0, 3)).join(", ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overtime Rate Configurations</CardTitle>
          <CardDescription>
            Configure how overtime hours are assigned to different pay rates based on day and time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Define rate conditions for Teamnet overtime imports. Hours worked during specified time windows 
            will be assigned to the corresponding rate.
          </p>
          
          {!isFormOpen ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Rate Configurations</h3>
                <Button onClick={handleAddConfig}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Configuration
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : configs.length > 0 ? (
                <div className="space-y-3">
                  {configs.map((config) => (
                    <Card key={config.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{config.name}</h4>
                              {config.is_active ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Default: Rate {config.default_rate}
                            </p>
                            {config.conditions.length > 0 && (
                              <div className="space-y-1">
                                {config.conditions.map((condition, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span>
                                      <strong>Rate {condition.rate}</strong>: {formatDays(condition.days)} {condition.time_from}-{condition.time_to}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditConfig(config)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteConfirmId(config.id!)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="font-medium mb-2">No Rate Configurations</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a configuration to define how overtime hours are assigned to pay rates.
                    </p>
                    <Button onClick={handleAddConfig}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Configuration
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <TeamnetRateConfigForm 
              config={editingConfig}
              onSave={handleSaveConfig}
              onCancel={handleCancelForm}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rate configuration will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OvertimeRatesSettingsTab;
