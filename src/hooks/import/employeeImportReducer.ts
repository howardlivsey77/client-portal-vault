
import { EmployeeData, ColumnMapping } from "@/components/employees/import/ImportConstants";

// State type definition
export interface EmployeeImportState {
  loading: boolean;
  rawData: EmployeeData[];
  preview: EmployeeData[];
  columnMappings: ColumnMapping[];
  showMappingUI: boolean;
  originalHeaders: string[];
  existingEmployees: EmployeeData[];
  showConfirmDialog: boolean;
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
  importError: string | null;
}

// Initial state
export const initialState: EmployeeImportState = {
  loading: false,
  rawData: [],
  preview: [],
  columnMappings: [],
  showMappingUI: false,
  originalHeaders: [],
  existingEmployees: [],
  showConfirmDialog: false,
  newEmployees: [],
  updatedEmployees: [],
  importError: null
};

// Action types
export type EmployeeImportAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'FILE_PROCESSED'; payload: { 
      rawData: EmployeeData[]; 
      preview: EmployeeData[]; 
      columnMappings: ColumnMapping[]; 
      headers: string[];
      existingEmployees: EmployeeData[];
      showMappingUI: boolean;
    }}
  | { type: 'UPDATE_COLUMN_MAPPING'; payload: { sourceColumn: string; targetField: string | null } }
  | { type: 'SET_PREVIEW'; payload: EmployeeData[] }
  | { type: 'SET_SHOW_MAPPING_UI'; payload: boolean }
  | { type: 'PREPARE_IMPORT'; payload: { newEmployees: EmployeeData[]; updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[] } }
  | { type: 'SET_SHOW_CONFIRM_DIALOG'; payload: boolean }
  | { type: 'SET_IMPORT_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Reducer function
export const employeeImportReducer = (
  state: EmployeeImportState,
  action: EmployeeImportAction
): EmployeeImportState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'FILE_PROCESSED':
      return {
        ...state,
        rawData: action.payload.rawData,
        preview: action.payload.preview,
        columnMappings: action.payload.columnMappings,
        originalHeaders: action.payload.headers,
        existingEmployees: action.payload.existingEmployees,
        showMappingUI: action.payload.showMappingUI,
      };
    
    case 'UPDATE_COLUMN_MAPPING':
      return {
        ...state,
        columnMappings: state.columnMappings.map(mapping => 
          mapping.sourceColumn === action.payload.sourceColumn 
            ? { ...mapping, targetField: action.payload.targetField } 
            : mapping
        ),
      };
    
    case 'SET_PREVIEW':
      return { ...state, preview: action.payload };
    
    case 'SET_SHOW_MAPPING_UI':
      return { ...state, showMappingUI: action.payload };
    
    case 'PREPARE_IMPORT':
      return {
        ...state,
        newEmployees: action.payload.newEmployees,
        updatedEmployees: action.payload.updatedEmployees,
      };
    
    case 'SET_SHOW_CONFIRM_DIALOG':
      return { ...state, showConfirmDialog: action.payload };
    
    case 'SET_IMPORT_ERROR':
      return { ...state, importError: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};
