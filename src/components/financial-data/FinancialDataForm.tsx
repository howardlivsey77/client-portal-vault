import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  required?: boolean;
  placeholder?: string;
}

interface FinancialDataFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FieldDef[];
  defaultValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  title: string;
  isSubmitting?: boolean;
}

function buildSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.type === "number") {
      let s = z.coerce.number();
      shape[f.name] = f.required ? s : s.optional().nullable();
    } else if (f.type === "boolean") {
      shape[f.name] = z.boolean().default(true);
    } else if (f.type === "date") {
      let s = z.string();
      shape[f.name] = f.required ? s.min(1, "Required") : s.optional().nullable();
    } else {
      let s = z.string();
      shape[f.name] = f.required ? s.min(1, "Required") : s.optional().nullable();
    }
  }
  return z.object(shape);
}

export function FinancialDataForm({
  open, onOpenChange, fields, defaultValues, onSubmit, title, isSubmitting,
}: FinancialDataFormProps) {
  const schema = buildSchema(fields);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? {});
    }
  }, [open, defaultValues]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "boolean" ? (
                <Switch
                  id={f.name}
                  checked={!!form.watch(f.name)}
                  onCheckedChange={(v) => form.setValue(f.name, v)}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  step={f.type === "number" ? "any" : undefined}
                  placeholder={f.placeholder}
                  {...form.register(f.name)}
                />
              )}
              {form.formState.errors[f.name] && (
                <p className="text-sm text-destructive">
                  {form.formState.errors[f.name]?.message as string}
                </p>
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
