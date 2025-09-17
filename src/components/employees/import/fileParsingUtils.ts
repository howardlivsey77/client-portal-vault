
import * as XLSX from "xlsx";
import { EmployeeData } from "./ImportConstants";

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
          // Parse CSV using XLSX
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          
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
