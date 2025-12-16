import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save, X } from "lucide-react";
import { TeamnetRateConfig, RateCondition } from "../hooks/useTeamnetRateConfigs";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TeamnetRateConfigFormProps {
  config: TeamnetRateConfig | null;
  onSave: (config: TeamnetRateConfig) => void;
  onCancel: () => void;
}

export const TeamnetRateConfigForm = ({ config, onSave, onCancel }: TeamnetRateConfigFormProps) => {
  const [name, setName] = useState(config?.name || "Standard Overtime Rates");
  const [defaultRate, setDefaultRate] = useState(config?.default_rate || 2);
  const [conditions, setConditions] = useState<RateCondition[]>(
    config?.conditions || []
  );
  const [isActive, setIsActive] = useState(config?.is_active ?? true);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        rate: 3,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        time_from: "18:30",
        time_to: "20:00"
      }
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: keyof RateCondition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const handleDayToggle = (index: number, day: string) => {
    const updated = [...conditions];
    const currentDays = updated[index].days;
    if (currentDays.includes(day)) {
      updated[index].days = currentDays.filter(d => d !== day);
    } else {
      updated[index].days = [...currentDays, day];
    }
    setConditions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: config?.id,
      name,
      default_rate: defaultRate,
      conditions,
      is_active: isActive
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Configuration Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Standard Overtime Rates"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="defaultRate">Default Rate (when no condition matches)</Label>
          <Select value={defaultRate.toString()} onValueChange={(v) => setDefaultRate(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Rate 1</SelectItem>
              <SelectItem value="2">Rate 2</SelectItem>
              <SelectItem value="3">Rate 3</SelectItem>
              <SelectItem value="4">Rate 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={isActive}
            onCheckedChange={(checked) => setIsActive(checked as boolean)}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Rate Conditions</h4>
          <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}>
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {conditions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No conditions defined. All hours will use the default rate.
          </p>
        )}

        {conditions.map((condition, index) => (
          <Card key={index} className="border-dashed">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Condition {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Select 
                    value={condition.rate.toString()} 
                    onValueChange={(v) => handleConditionChange(index, 'rate', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Rate 1</SelectItem>
                      <SelectItem value="2">Rate 2</SelectItem>
                      <SelectItem value="3">Rate 3</SelectItem>
                      <SelectItem value="4">Rate 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time From</Label>
                  <Input
                    type="time"
                    value={condition.time_from}
                    onChange={(e) => handleConditionChange(index, 'time_from', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time To</Label>
                  <Input
                    type="time"
                    value={condition.time_to}
                    onChange={(e) => handleConditionChange(index, 'time_to', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${index}-${day}`}
                        checked={condition.days.includes(day)}
                        onCheckedChange={() => handleDayToggle(index, day)}
                      />
                      <Label htmlFor={`${index}-${day}`} className="text-sm">
                        {day.slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </form>
  );
};
