import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCostCentres } from "@/hooks/employees/useCostCentres";
import { useAuth } from "@/providers";
import { CostCentre } from "@/services/employees/costCentreService";

export function CostCentresSettingsTab() {
  const { costCentres, loading, addCostCentre, editCostCentre, removeCostCentre } = useCostCentres();
  const { isAdmin } = useAuth();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCostCentre, setEditingCostCentre] = useState<CostCentre | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const handleAddCostCentre = async () => {
    if (!newName.trim()) return;
    
    try {
      await addCostCentre({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewName("");
      setNewDescription("");
      setIsAddDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEditCostCentre = async () => {
    if (!editingCostCentre || !editName.trim()) return;
    
    try {
      await editCostCentre(editingCostCentre.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      closeEditDialog();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteCostCentre = async (costCentreId: string) => {
    if (!confirm("Are you sure you want to delete this cost centre?")) return;
    
    try {
      await removeCostCentre(costCentreId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openEditDialog = (costCentre: CostCentre) => {
    setEditingCostCentre(costCentre);
    setEditName(costCentre.name);
    setEditDescription(costCentre.description || "");
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingCostCentre(null);
    setEditName("");
    setEditDescription("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cost Centre Management</CardTitle>
          <CardDescription>
            Manage cost centres for your company. Cost centres help categorize and track expenses.
          </CardDescription>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Cost Centre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cost Centre</DialogTitle>
                <DialogDescription>
                  Create a new cost centre for your company.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Marketing, Operations"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description for this cost centre"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCostCentre} disabled={!newName.trim()}>
                  Add Cost Centre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading cost centres...</div>
        ) : costCentres.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No cost centres found. {isAdmin && "Add one to get started."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCentres.map((costCentre) => (
                <TableRow key={costCentre.id}>
                  <TableCell className="font-medium">{costCentre.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {costCentre.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={costCentre.is_active ? "default" : "secondary"}>
                      {costCentre.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(costCentre)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCostCentre(costCentre.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Cost Centre</DialogTitle>
              <DialogDescription>
                Update the cost centre details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={handleEditCostCentre} disabled={!editName.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
