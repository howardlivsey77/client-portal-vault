import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HMRCXmlImport } from "./import/HMRCXmlImport";

interface HMRCImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const HMRCImportDialog = ({ open, onOpenChange, onSuccess }: HMRCImportDialogProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from HMRC XML</DialogTitle>
          <DialogDescription>
            Upload an HMRC Full Payment Submission (FPS) XML file to import employee data.
            This is designed for initial employee setup when you have no existing employees.
          </DialogDescription>
        </DialogHeader>
        <HMRCXmlImport onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
};
