import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { validateTaxCode } from "@/services/payroll/validation/payroll-validators";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface TaxCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TaxCodeInput({ 
  value, 
  onChange, 
  error: externalError, 
  disabled,
  placeholder = "e.g. 1257L",
  className
}: TaxCodeInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isScottishOrWelsh, setIsScottishOrWelsh] = useState(false);

  useEffect(() => {
    if (value) {
      const result = validateTaxCode(value);
      setLocalError(result.isValid ? null : result.error || null);
      setIsScottishOrWelsh(result.isScottishOrWelsh || false);
    } else {
      setLocalError(null);
      setIsScottishOrWelsh(false);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
  };

  const displayError = externalError || localError;
  const hasError = !!displayError;

  return (
    <div className="space-y-1">
      <Input
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          hasError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        disabled={disabled}
      />
      {hasError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
      {isScottishOrWelsh && !hasError && (
        <div className="flex items-center gap-1 text-sm text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Scottish/Welsh tax codes have different rates</span>
        </div>
      )}
      {!hasError && !isScottishOrWelsh && (
        <p className="text-xs text-muted-foreground">
          Valid formats: 1257L, K497, BR, D0, D1, NT, 0T
        </p>
      )}
    </div>
  );
}
