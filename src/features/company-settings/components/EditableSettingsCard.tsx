
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface EditableSettingsCardProps {
  title: string;
  description: string;
  children: (isEditing: boolean) => React.ReactNode;
  onSave: () => Promise<void> | void;
  onCancel?: () => void;
  isSaving: boolean;
}

export const EditableSettingsCard = ({
  title,
  description,
  children,
  onSave,
  onCancel,
  isSaving,
}: EditableSettingsCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleCancel = () => {
    onCancel?.();
    setIsEditing(false);
  };

  const handleSave = async () => {
    await onSave();
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {children(isEditing)}
        {isEditing && (
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
