import { EmployeeData } from "@/components/employees/import/ImportConstants";

export interface HMRCParseResult {
  employees: EmployeeData[];
  payeRef: string | null;
  taxYear: string | null;
  errors: string[];
}

/**
 * Parse HMRC FPS XML file and extract employee data
 */
export const parseHMRCXml = (xmlString: string): HMRCParseResult => {
  const errors: string[] = [];
  const employees: EmployeeData[] = [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      return {
        employees: [],
        payeRef: null,
        taxYear: null,
        errors: ["Invalid XML file format"]
      };
    }
    
    // Extract PAYE reference from EmpRefs
    const payeRef = getTextContent(xmlDoc, "PayeRef");
    const taxYear = getTextContent(xmlDoc, "RelatedTaxYear");
    
    // Find all Employee elements - need to handle namespaces
    const employeeElements = xmlDoc.getElementsByTagName("Employee");
    
    if (employeeElements.length === 0) {
      return {
        employees: [],
        payeRef,
        taxYear,
        errors: ["No employees found in the XML file"]
      };
    }
    
    for (let i = 0; i < employeeElements.length; i++) {
      const empElement = employeeElements[i];
      
      try {
        const employee = parseEmployeeElement(empElement);
        if (employee) {
          employees.push(employee);
        }
      } catch (err) {
        errors.push(`Error parsing employee ${i + 1}: ${err}`);
      }
    }
    
    return {
      employees,
      payeRef,
      taxYear,
      errors
    };
  } catch (err) {
    return {
      employees: [],
      payeRef: null,
      taxYear: null,
      errors: [`Failed to parse XML: ${err}`]
    };
  }
};

/**
 * Parse a single Employee element from the XML
 */
const parseEmployeeElement = (empElement: Element): EmployeeData | null => {
  // Get employee details
  const employeeDetails = empElement.getElementsByTagName("EmployeeDetails")[0];
  const employment = empElement.getElementsByTagName("Employment")[0];
  
  if (!employeeDetails) {
    return null;
  }
  
  // Extract name
  const firstName = getTextContent(employeeDetails, "Fore");
  const lastName = getTextContent(employeeDetails, "Sur");
  
  if (!firstName || !lastName) {
    return null;
  }
  
  // Extract address lines
  const addressElement = employeeDetails.getElementsByTagName("Address")[0];
  const addressLines = extractAddressLines(addressElement);
  
  // Extract other fields
  const nino = getTextContent(employeeDetails, "NINO");
  const postcode = getTextContent(employeeDetails, "UKPostcode");
  const birthDate = getTextContent(employeeDetails, "BirthDate");
  const gender = mapGender(getTextContent(employeeDetails, "Gender"));
  
  // Extract employment data
  const payrollId = employment ? getTextContent(employment, "PayId") : null;
  
  // Extract tax code from Payment section
  const paymentElement = employment?.getElementsByTagName("Payment")[0];
  const taxCode = paymentElement ? getTextContent(paymentElement, "TaxCode") : null;
  
  // Extract NI letter from NIlettersAndValues section
  const niElement = employment?.getElementsByTagName("NIlettersAndValues")[0];
  const nicCode = niElement ? getTextContent(niElement, "NIletter") : null;
  
  return {
    first_name: firstName,
    last_name: lastName,
    national_insurance_number: nino,
    address1: addressLines[0] || null,
    address2: addressLines[1] || null,
    address3: addressLines[2] || null,
    address4: addressLines[3] || null,
    postcode: postcode,
    date_of_birth: birthDate,
    gender: gender,
    payroll_id: payrollId,
    tax_code: taxCode,
    nic_code: nicCode,
    // Set defaults for required fields
    department: "General",
    hours_per_week: 40,
    hourly_rate: 0
  };
};

/**
 * Extract address lines from Address element
 */
const extractAddressLines = (addressElement: Element | undefined): string[] => {
  if (!addressElement) {
    return [];
  }
  
  const lines: string[] = [];
  const lineElements = addressElement.getElementsByTagName("Line");
  
  for (let i = 0; i < lineElements.length && i < 4; i++) {
    const text = lineElements[i].textContent?.trim();
    if (text) {
      lines.push(text);
    }
  }
  
  return lines;
};

/**
 * Map gender code to full text
 */
const mapGender = (genderCode: string | null): string | null => {
  if (!genderCode) return null;
  
  switch (genderCode.toUpperCase()) {
    case "M":
      return "Male";
    case "F":
      return "Female";
    default:
      return genderCode;
  }
};

/**
 * Get text content of first matching element
 */
const getTextContent = (parent: Element | Document, tagName: string): string | null => {
  const elements = parent.getElementsByTagName(tagName);
  if (elements.length > 0 && elements[0].textContent) {
    return elements[0].textContent.trim();
  }
  return null;
};

/**
 * Validate that the XML is a valid HMRC FPS format
 */
export const validateHMRCXml = (xmlString: string): { valid: boolean; message: string } => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      return { valid: false, message: "Invalid XML format" };
    }
    
    // Check for HMRC-specific elements
    const hasGovTalk = xmlDoc.getElementsByTagName("GovTalkMessage").length > 0;
    const hasFPS = xmlDoc.getElementsByTagName("FullPaymentSubmission").length > 0;
    const hasEmployees = xmlDoc.getElementsByTagName("Employee").length > 0;
    
    if (!hasGovTalk && !hasFPS) {
      return { valid: false, message: "This does not appear to be an HMRC FPS XML file" };
    }
    
    if (!hasEmployees) {
      return { valid: false, message: "No employee data found in the XML file" };
    }
    
    return { valid: true, message: "Valid HMRC FPS XML file" };
  } catch (err) {
    return { valid: false, message: `Failed to validate XML: ${err}` };
  }
};
