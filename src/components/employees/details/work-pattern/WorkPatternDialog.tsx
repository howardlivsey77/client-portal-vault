
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateHoursList } from "./utils";
import { WorkDay } from "./types";

interface WorkPatternDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workDays: WorkDay[];
  setWorkDays: (workDays: WorkDay[]) => void;
  onSave: () => Promise<void>;
}

export const WorkPatternDialog = ({
  open,
  onOpenChange,
  workDays,
  setWorkDays,
  onSave,
}: WorkPatternDialogProps) => {
  const [saving, setSaving] = useState(false);
  const hoursList = generateHoursList();

  const toggleWorkDay = (index: number) => {
    setWorkDays(
      workDays.map((day, i) =>
        i === index ? { ...day, isWorking: !day.isWorking } : day
      )
    );
  };

  const updateTime = (index: number, field: "startTime" | "endTime", value: string) => {
    setWorkDays(
      workDays.map((day, i) =>
        i === index ? { ...day, [field]: value } : day
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Work Pattern</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {workDays.map((day, index) => (
            <div key={day.day} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`work-${day.day}`}
                  checked={day.isWorking}
                  onCheckedChange={() => toggleWorkDay(index)}
                />
                <Label htmlFor={`work-${day.day}`} className="font-medium">
                  {day.day}
                </Label>
              </div>

              {day.isWorking && (
                <div className="ml-6 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor={`start-${day.day}`}>Start Time</Label>
                    <Select
                      value={day.startTime || ""}
                      onValueChange={(value) => updateTime(index, "startTime", value)}
                    >
                      <SelectTrigger id={`start-${day.day}`}>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoursList.map((hour) => (
                          <SelectItem key={`start-${hour}`} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`end-${day.day}`}>End Time</Label>
                    <Select
                      value={day.endTime || ""}
                      onValueChange={(value) => updateTime(index, "endTime", value)}
                    >
                      <SelectTrigger id={`end-${day.day}`}>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoursList.map((hour) => (
                          <SelectItem key={`end-${hour}`} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
