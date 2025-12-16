import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type ImportFormat = 'practice-index' | 'teamnet';

interface FormatSelectorProps {
  selectedFormat: ImportFormat;
  onFormatChange: (format: ImportFormat) => void;
}

export function FormatSelector({ selectedFormat, onFormatChange }: FormatSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Select Import Format</h3>
        <p className="text-sm text-muted-foreground">
          Choose the format that matches your overtime data file
        </p>
      </div>
      
      <RadioGroup
        value={selectedFormat}
        onValueChange={(value) => onFormatChange(value as ImportFormat)}
        className="grid gap-4"
      >
        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-monday-blue transition-colors cursor-pointer">
          <RadioGroupItem value="practice-index" id="practice-index" className="mt-1" />
          <Label htmlFor="practice-index" className="flex-1 cursor-pointer">
            <div className="font-medium">Practice Index</div>
            <div className="text-sm text-muted-foreground mt-1">
              Standard format with Employee, Hours, Rate columns. Rate types are specified in the file.
            </div>
          </Label>
        </div>
        
        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-monday-blue transition-colors cursor-pointer">
          <RadioGroupItem value="teamnet" id="teamnet" className="mt-1" />
          <Label htmlFor="teamnet" className="flex-1 cursor-pointer">
            <div className="font-medium">Teamnet</div>
            <div className="text-sm text-muted-foreground mt-1">
              Contains Name, Surname, Date from, Time from, Date to, Time to columns. 
              Rates are automatically calculated based on shift times:
            </div>
            <ul className="text-xs text-muted-foreground mt-2 ml-4 list-disc space-y-1">
              <li>Rate 3: Mon-Fri 18:30-20:00, Sat 10:00-14:00</li>
              <li>Rate 2: All other times</li>
            </ul>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
