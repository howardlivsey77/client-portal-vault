
import { useBrandColors } from "@/brand";

export function SuccessState() {
  const brandColors = useBrandColors();
  
  return (
    <div 
      className="p-3 rounded-md text-center text-sm"
      style={{ 
        backgroundColor: `hsl(${brandColors.successLight})`,
        color: `hsl(${brandColors.success})`
      }}
    >
      File validation complete. Click "Next" to continue with absences upload.
    </div>
  );
}
