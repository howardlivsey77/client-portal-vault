
import { ColumnMapping } from "../ImportConstants";

// Common types used across mapping utilities
export type MapFunction = (headers: string[]) => ColumnMapping[];
export type ValidateFunction = (mappings: ColumnMapping[], requiredFields?: string[]) => boolean;
export type StorageFunction = (mappings: ColumnMapping[]) => void;
