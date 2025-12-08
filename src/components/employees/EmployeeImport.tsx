
import { Button } from "@/components/ui/button";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { FileUploader } from "./import/FileUploader";
import { ColumnMappingUI } from "./import/ColumnMapping";
import { EmployeePreview } from "./import/EmployeePreview";
import { EmployeeChangesConfirmation } from "./import/EmployeeChangesConfirmation";
import { transformData, saveMappings } from "./import/ImportUtils";
import { useEmployeeImport } from "@/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface EmployeeImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmployeeImport = ({ onSuccess, onCancel }: EmployeeImportProps) => {
  const {
    loading,
    preview,
    columnMappings,
    showMappingUI,
    showConfirmDialog,
    newEmployees,
    updatedEmployees,
    importError,
    handleFileProcessed,
    updateColumnMapping,
    applyMappings: applyMappingsBase,
    prepareImport,
    handleImport,
    setShowConfirmDialog
  } = useEmployeeImport(onSuccess);

  // Wrap the applyMappings function to pass the required utilities
  const applyMappings = () => {
    applyMappingsBase(transformData, saveMappings);
  };
  
  return (
    <div className="space-y-6">
      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error importing employees</AlertTitle>
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      <FileUploader 
        onFileProcessed={handleFileProcessed} 
        disabled={loading} 
      />
      
      {showMappingUI && (
        <ColumnMappingUI 
          columnMappings={columnMappings}
          updateColumnMapping={updateColumnMapping}
          applyMappings={applyMappings}
        />
      )}
      
      <EmployeePreview preview={preview} />
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={prepareImport} 
          disabled={loading || (preview.length === 0)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Review Changes
            </>
          )}
        </Button>
      </div>
      
      <EmployeeChangesConfirmation
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleImport}
        newEmployees={newEmployees}
        updatedEmployees={updatedEmployees}
      />
    </div>
  );
};
