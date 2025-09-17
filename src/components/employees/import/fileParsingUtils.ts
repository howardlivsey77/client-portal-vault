
import * as XLSX from "xlsx";
import { EmployeeData } from "./ImportConstants";

// Detect the actual header row in CSV data
const detectHeaderRow = (rawData: string): number => {
  const lines = rawData.split('\n');
  
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Skip lines that look like titles (single phrase, no commas or few commas)
    const commaCount = (line.match(/,/g) || []).length;
    if (commaCount < 2) continue;
    
    // Check if this line looks like headers (contains common header words)
    const headerWords = ['name', 'surname', 'first', 'last', 'email', 'department', 'id', 'rate', 'hours', 'date', 'birth', 'hire', 'address', 'postcode'];
    const lowercaseLine = line.toLowerCase();
    const hasHeaderWords = headerWords.some(word => lowercaseLine.includes(word));
    
    if (hasHeaderWords && commaCount >= 2) {
      console.log(`Detected header row at line ${i + 1}: ${line}`);
      return i;
    }
  }
  
  // Fallback to first line with enough commas
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const commaCount = (lines[i].match(/,/g) || []).length;
    if (commaCount >= 2) {
      console.log(`Fallback: Using line ${i + 1} as header row`);
      return i;
    }
  }
  
  return 0; // Ultimate fallback
};

// Read and parse file data
export const readFileData = async (file: File): Promise<{data: EmployeeData[], headers: string[]}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject("No data found in file");
          return;
        }
        
        let parsedData: EmployeeData[] = [];
        let headers: string[] = [];
        
        if (file.name.endsWith('.csv')) {
          // For CSV, detect the header row first
          const headerRowIndex = detectHeaderRow(data as string);
          
          // Parse CSV and manually handle header row offset
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Get the range and adjust for header row
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
          range.s.r = headerRowIndex; // Start from detected header row
          
          // Convert to JSON with adjusted range
          parsedData = XLSX.utils.sheet_to_json(worksheet, { range: range });
          
          console.log("CSV parsed with header detection:", parsedData.slice(0, 2));
          
          // Headers will be built after parsing all rows
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel
          const binary = new Uint8Array(data as ArrayBuffer);
          const workbook = XLSX.read(binary, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          
          // Headers will be built after parsing all rows
        } else {
          reject("Unsupported file format");
          return;
        }
        // Build headers from union of keys across all rows so columns with empty first row still appear
        headers = [];
        if (parsedData.length > 0) {
          const headerSet = new Set<string>();
          for (const row of parsedData) {
            Object.keys(row || {}).forEach((k) => {
              if (k && typeof k === "string") headerSet.add(k);
            });
          }
          headers = Array.from(headerSet);
        }
        
        console.log("Parsed data from file:", parsedData);
        console.log("Headers from file:", headers);
        
        resolve({
          data: parsedData,
          headers: headers
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    
    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};
