
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

interface DashboardHeaderProps {
  onOpenUploadModal: () => void;
}

export function DashboardHeader({ onOpenUploadModal }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <Button onClick={onOpenUploadModal}>
            <FileText className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">
          Welcome {user?.email}! Here's an overview of your company's data.
        </div>
      </div>
    </>
  );
}
