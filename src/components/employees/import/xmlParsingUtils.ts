import { EmployeeData } from "./ImportConstants";

// Interface for HMRC XML Employee data
interface HMRCEmployee {
  forename: string;
  surname: string;
  nino: string;
  payId: string;
  gender: string;
  dateOfBirth: string;
  address: {
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
    postcode?: string;
  };
  paymentToDate: string;
  totalTaxToDate: string;
  taxablePayToDate: string;
  taxCode: string;
  nicCategory: string;
}

// Parse HMRC XML Full Payment Submission file
export const parseHMRCXML = async (file: File): Promise<{data: EmployeeData[], headers: string[]}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlContent = e.target?.result as string;
        if (!xmlContent) {
          reject("No data found in XML file");
          return;
        }

        // Parse XML using DOMParser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
          reject("Invalid XML format");
          return;
        }

        // Extract employee data from XML structure
        const employeeElements = xmlDoc.querySelectorAll("Employee");
        const parsedData: EmployeeData[] = [];

        employeeElements.forEach((employeeEl) => {
          try {
            const employee = extractEmployeeFromXMLElement(employeeEl);
            if (employee) {
              parsedData.push(employee);
            }
          } catch (error) {
            console.warn("Error parsing employee element:", error);
          }
        });

        // Define headers based on available fields
        const headers = [
          "first_name",
          "last_name", 
          "national_insurance_number",
          "payroll_id",
          "gender",
          "date_of_birth",
          "address1",
          "address2", 
          "address3",
          "address4",
          "postcode",
          "tax_code",
          "nic_code"
        ];

        console.log("Parsed XML employee data:", parsedData);
        console.log("XML headers:", headers);

        resolve({
          data: parsedData,
          headers: headers
        });
      } catch (error) {
        console.error("Error parsing XML file:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Extract employee data from XML element
const extractEmployeeFromXMLElement = (employeeEl: Element): EmployeeData | null => {
  try {
    // Extract basic info
    const forename = getXMLElementText(employeeEl, "Forename") || "";
    const surname = getXMLElementText(employeeEl, "Surname") || "";
    
    if (!forename || !surname) {
      console.warn("Employee missing name, skipping");
      return null;
    }

    // Extract other fields
    const nino = getXMLElementText(employeeEl, "NINO") || "";
    const payId = getXMLElementText(employeeEl, "PayId") || "";
    const gender = transformGender(getXMLElementText(employeeEl, "Gender") || "");
    const dateOfBirth = transformDate(getXMLElementText(employeeEl, "DateOfBirth") || "");
    
    // Extract address information
    const addressEl = employeeEl.querySelector("Address");
    const address1 = addressEl ? getXMLElementText(addressEl, "Line1") || "" : "";
    const address2 = addressEl ? getXMLElementText(addressEl, "Line2") || "" : "";
    const address3 = addressEl ? getXMLElementText(addressEl, "Line3") || "" : "";
    const address4 = addressEl ? getXMLElementText(addressEl, "Line4") || "" : "";
    const postcode = addressEl ? getXMLElementText(addressEl, "PostCode") || "" : "";

    // Extract employment details
    const taxCode = getXMLElementText(employeeEl, "TaxCode") || "";
    const nicCategory = getXMLElementText(employeeEl, "NICCategory") || "";

    return {
      first_name: forename,
      last_name: surname,
      national_insurance_number: nino,
      payroll_id: payId,
      gender: gender,
      date_of_birth: dateOfBirth,
      address1: address1,
      address2: address2,
      address3: address3,
      address4: address4,
      postcode: postcode,
      tax_code: taxCode,
      nic_code: nicCategory,
      // Note: XML doesn't contain department, email, hire_date, hours_per_week, rates
      department: "", // Will need to be set manually
      email: "", // Will need to be set manually
      hire_date: "", // Will need to be set manually
      hours_per_week: "", // Will need to be set manually
      hourly_rate: "", // Will need to be set manually
    };
  } catch (error) {
    console.error("Error extracting employee from XML element:", error);
    return null;
  }
};

// Helper function to safely get text content from XML element
const getXMLElementText = (parent: Element, tagName: string): string => {
  const element = parent.querySelector(tagName);
  return element?.textContent?.trim() || "";
};

// Transform gender from XML format to our format
const transformGender = (xmlGender: string): string => {
  const gender = xmlGender.toUpperCase();
  switch (gender) {
    case "M":
    case "MALE":
      return "Male";
    case "F": 
    case "FEMALE":
      return "Female";
    default:
      return "";
  }
};

// Transform date from XML format (YYYY-MM-DD) to DD/MM/YYYY format
const transformDate = (xmlDate: string): string => {
  if (!xmlDate) return "";
  
  try {
    // XML typically uses YYYY-MM-DD format
    const dateMatch = xmlDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return `${day}/${month}/${year}`;
    }
    
    // If it's already in DD/MM/YYYY format, return as is
    if (xmlDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return xmlDate;
    }
    
    return "";
  } catch (error) {
    console.warn("Error transforming date:", xmlDate, error);
    return "";
  }
};

// Check if a file is an XML file
export const isXMLFile = (file: File): boolean => {
  return file.name.toLowerCase().endsWith('.xml');
};