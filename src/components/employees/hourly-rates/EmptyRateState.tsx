
import { Button } from "@/components/ui/button";

interface EmptyRateStateProps {
  readOnly: boolean;
  onAddRate: () => void;
}

export const EmptyRateState = ({ readOnly, onAddRate }: EmptyRateStateProps) => {
  return (
    <div className="py-4 text-center text-muted-foreground border rounded-md">
      No hourly rates defined yet.
      {!readOnly && (
        <div className="mt-2">
          <Button 
            variant="link" 
            onClick={onAddRate}
          >
            Add your first hourly rate
          </Button>
        </div>
      )}
    </div>
  );
};
