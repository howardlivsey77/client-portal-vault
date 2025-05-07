
import { Document } from "@/components/dashboard/DocumentGrid";

declare global {
  interface Window {
    addDocument?: (document: Document) => void;
  }
}
