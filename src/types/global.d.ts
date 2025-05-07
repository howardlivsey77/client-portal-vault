
import { Document } from "@/components/dashboard/DocumentGrid";

declare global {
  interface Window {
    addDocument?: (document: Document) => void;
    moveDocument?: (docId: string, targetFolderId: string | null) => void;
    deleteDocument?: (docId: string) => void;
    renameDocument?: (docId: string, newTitle: string) => void;
  }
}
