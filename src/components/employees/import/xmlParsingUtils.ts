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

        // Check if this is actually a PDF file
        if (xmlContent.startsWith('%PDF')) {
          reject("File appears to be a PDF. Please upload the actual XML file, not a PDF containing XML data.");
          return;
        }

        // Parse XML using DOMParser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
          reject("Invalid XML format: " + parseError.textContent);
          return;
        }

        // Debug: Log the XML structure for analysis
        console.log("XML Root element:", xmlDoc.documentElement.tagName);
        console.log("XML namespace URI:", xmlDoc.documentElement.namespaceURI);
        logXMLStructure(xmlDoc.documentElement, 0, 3); // Log first 3 levels

        // Try different XML structures with namespace support
        let employeeElements: Element[];
        let xmlFormat = "unknown";

        // Enhanced HMRC FPS structure detection with namespace support
        employeeElements = findElementsWithNamespace(xmlDoc, [
          "irenvelope", "iREnvelope", "IREnvelope",
          "gov:irenvelope", "hmrc:irenvelope", "fps:irenvelope",
          "employee", "Employee", "EMPLOYEE"
        ]);

        if (employeeElements.length > 0) {
          xmlFormat = "HMRC_FPS_ENHANCED";
          console.log(`Found ${employeeElements.length} employee elements using namespace-aware search`);
        } else {
          // Fallback to simple Employee structure
          employeeElements = Array.from(xmlDoc.querySelectorAll("Employee"));
          if (employeeElements.length > 0) {
            xmlFormat = "simple";
          }
        }

        if (employeeElements.length === 0) {
          // Final attempt: search for any element that might contain employee data
          const possibleEmployeeElements = findPossibleEmployeeElements(xmlDoc);
          if (possibleEmployeeElements.length > 0) {
            employeeElements = possibleEmployeeElements;
            xmlFormat = "auto_detected";
            console.log(`Auto-detected ${employeeElements.length} possible employee elements`);
          } else {
            const availableElements = getAvailableElements(xmlDoc);
            reject(`No employee data found in XML file. Available elements: ${availableElements.join(', ')}. Expected employee data in elements like 'irenvelope', 'Employee', or similar.`);
            return;
          }
        }

        console.log(`Detected XML format: ${xmlFormat}, found ${employeeElements.length} employee records`);

        const parsedData: EmployeeData[] = [];

        employeeElements.forEach((employeeEl, index) => {
          try {
            let employee: EmployeeData | null = null;
            
            if (xmlFormat === "HMRC_FPS_ENHANCED" || xmlFormat === "auto_detected") {
              employee = extractEmployeeFromHMRCElementEnhanced(employeeEl);
            } else if (xmlFormat === "HMRC_FPS") {
              employee = extractEmployeeFromHMRCElement(employeeEl);
            } else {
              employee = extractEmployeeFromXMLElement(employeeEl);
            }
            
            if (employee) {
              parsedData.push(employee);
              console.log(`Successfully parsed employee ${index + 1}: ${employee.first_name} ${employee.last_name}`);
            } else {
              console.warn(`Failed to extract employee data from element ${index + 1}`);
            }
          } catch (error) {
            console.warn(`Error parsing employee element ${index + 1}:`, error);
          }
        });

        if (parsedData.length === 0) {
          reject("No valid employee data could be extracted from the XML file. Check console for detailed parsing information.");
          return;
        }

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

        console.log(`Successfully parsed ${parsedData.length} employees from ${xmlFormat} XML format`);

        resolve({
          data: parsedData,
          headers: headers
        });
      } catch (error) {
        console.error("Error parsing XML file:", error);
        reject(`Failed to parse XML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    reader.onerror = (error) => reject(`Failed to read file: ${error}`);
    reader.readAsText(file);
  });
};

// Extract employee data from HMRC FPS XML irenvelope element
const extractEmployeeFromHMRCElement = (irenvelopeEl: Element): EmployeeData | null => {
  try {
    // HMRC FPS structure is more complex - data can be in various nested elements
    // Look for employee information in different possible locations
    
    // Try to find name elements (could be nested in different structures)
    const forename = getNestedXMLElementText(irenvelopeEl, ["Forename", "GivenName", "FirstName"]) || "";
    const surname = getNestedXMLElementText(irenvelopeEl, ["Surname", "FamilyName", "LastName"]) || "";
    
    if (!forename || !surname) {
      console.warn("HMRC employee missing name, skipping");
      return null;
    }

    // Extract NINO (National Insurance Number)
    const nino = getNestedXMLElementText(irenvelopeEl, ["NINO", "NationalInsuranceNumber"]) || "";
    
    // Extract payroll ID (could be in various fields)
    const payId = getNestedXMLElementText(irenvelopeEl, ["PayId", "PayrollNumber", "EmployeeNumber"]) || "";
    
    // Extract gender
    const gender = transformGender(getNestedXMLElementText(irenvelopeEl, ["Gender", "Sex"]) || "");
    
    // Extract date of birth
    const dateOfBirth = transformDate(getNestedXMLElementText(irenvelopeEl, ["DateOfBirth", "BirthDate"]) || "");
    
    // Extract address - HMRC address structure can be complex
    const address1 = getNestedXMLElementText(irenvelopeEl, ["Line1", "AddressLine1", "Address1"]) || "";
    const address2 = getNestedXMLElementText(irenvelopeEl, ["Line2", "AddressLine2", "Address2"]) || "";
    const address3 = getNestedXMLElementText(irenvelopeEl, ["Line3", "AddressLine3", "Address3"]) || "";
    const address4 = getNestedXMLElementText(irenvelopeEl, ["Line4", "AddressLine4", "Address4"]) || "";
    const postcode = getNestedXMLElementText(irenvelopeEl, ["PostCode", "PostalCode", "Postcode"]) || "";

    // Extract employment details
    const taxCode = getNestedXMLElementText(irenvelopeEl, ["TaxCode", "TaxCodeBasisNonCumulative", "TaxCodeBasisCumulative"]) || "";
    const nicCategory = getNestedXMLElementText(irenvelopeEl, ["NICCategory", "NICategory", "NationalInsuranceCategory"]) || "";

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
      // Note: HMRC XML doesn't contain department, email, hire_date, hours_per_week, rates
      department: "", // Will need to be set manually
      email: "", // Will need to be set manually
      hire_date: "", // Will need to be set manually
      hours_per_week: "", // Will need to be set manually
      hourly_rate: "", // Will need to be set manually
    };
  } catch (error) {
    console.error("Error extracting employee from HMRC XML element:", error);
    return null;
  }
};

// Extract employee data from simple XML element (original format)
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

// Enhanced helper function to search for text content with namespace support
const getNestedXMLElementText = (parent: Element, tagNames: string[]): string => {
  for (const tagName of tagNames) {
    // Try direct child first
    const directElement = parent.querySelector(tagName);
    if (directElement?.textContent?.trim()) {
      return directElement.textContent.trim();
    }
    
    // Try nested search with wildcard
    const nestedElement = parent.querySelector(`* ${tagName}`);
    if (nestedElement?.textContent?.trim()) {
      return nestedElement.textContent.trim();
    }
    
    // Try case-insensitive search
    const caseInsensitiveElement = findElementByTagNameIgnoreCase(parent, tagName);
    if (caseInsensitiveElement?.textContent?.trim()) {
      return caseInsensitiveElement.textContent.trim();
    }
  }
  return "";
};

// Enhanced extraction for any HMRC element with better namespace and structure support
const extractEmployeeFromHMRCElementEnhanced = (element: Element): EmployeeData | null => {
  try {
    console.log(`Parsing element: ${element.tagName}, namespace: ${element.namespaceURI}`);
    
    // Enhanced field extraction with more flexible searching
    const forename = getFlexibleElementText(element, [
      "Forename", "forename", "FORENAME",
      "GivenName", "givenname", "GIVENNAME", 
      "FirstName", "firstname", "FIRSTNAME",
      "Name1", "name1", "NAME1"
    ]);
    
    const surname = getFlexibleElementText(element, [
      "Surname", "surname", "SURNAME",
      "FamilyName", "familyname", "FAMILYNAME",
      "LastName", "lastname", "LASTNAME", 
      "Name2", "name2", "NAME2"
    ]);
    
    console.log(`Found name: ${forename} ${surname}`);
    
    if (!forename || !surname) {
      console.warn("Employee missing name, trying to find any name fields...");
      logElementContents(element);
      return null;
    }

    // Extract other fields with enhanced searching
    const nino = getFlexibleElementText(element, [
      "NINO", "nino", "Nino",
      "NationalInsuranceNumber", "nationalinsurancenumber",
      "NINumber", "ninumber", "NI_Number"
    ]);
    
    const payId = getFlexibleElementText(element, [
      "PayId", "payid", "PAYID",
      "PayrollNumber", "payrollnumber", "PAYROLLNUMBER",
      "EmployeeNumber", "employeenumber", "EMPLOYEENUMBER",
      "EmpRef", "empref", "EMPREF"
    ]);
    
    const gender = transformGender(getFlexibleElementText(element, [
      "Gender", "gender", "GENDER",
      "Sex", "sex", "SEX"
    ]));
    
    const dateOfBirth = transformDate(getFlexibleElementText(element, [
      "DateOfBirth", "dateofbirth", "DATEOFBIRTH",
      "BirthDate", "birthdate", "BIRTHDATE",
      "DOB", "dob"
    ]));
    
    // Address extraction with flexible searching
    const address1 = getFlexibleElementText(element, [
      "Line1", "line1", "LINE1",
      "AddressLine1", "addressline1", "ADDRESSLINE1",
      "Address1", "address1", "ADDRESS1"
    ]);
    
    const address2 = getFlexibleElementText(element, [
      "Line2", "line2", "LINE2",
      "AddressLine2", "addressline2", "ADDRESSLINE2", 
      "Address2", "address2", "ADDRESS2"
    ]);
    
    const address3 = getFlexibleElementText(element, [
      "Line3", "line3", "LINE3",
      "AddressLine3", "addressline3", "ADDRESSLINE3",
      "Address3", "address3", "ADDRESS3"
    ]);
    
    const address4 = getFlexibleElementText(element, [
      "Line4", "line4", "LINE4", 
      "AddressLine4", "addressline4", "ADDRESSLINE4",
      "Address4", "address4", "ADDRESS4"
    ]);
    
    const postcode = getFlexibleElementText(element, [
      "PostCode", "postcode", "POSTCODE",
      "PostalCode", "postalcode", "POSTALCODE",
      "Postcode", "ZIP", "zip"
    ]);

    // Employment details
    const taxCode = getFlexibleElementText(element, [
      "TaxCode", "taxcode", "TAXCODE",
      "TaxCodeBasisNonCumulative", "TaxCodeBasisCumulative"
    ]);
    
    const nicCategory = getFlexibleElementText(element, [
      "NICCategory", "niccategory", "NICCATEGORY",
      "NICategory", "nicategory", "NICATEGORY",
      "NationalInsuranceCategory", "nationalinsurancecategory"
    ]);

    const employeeData = {
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
      department: "",
      email: "",
      hire_date: "",
      hours_per_week: "",
      hourly_rate: "",
    };
    
    console.log("Extracted employee data:", employeeData);
    return employeeData;
    
  } catch (error) {
    console.error("Error extracting employee from enhanced HMRC XML element:", error);
    return null;
  }
};

// Find elements with namespace support
const findElementsWithNamespace = (xmlDoc: Document, elementNames: string[]): Element[] => {
  const elements: Element[] = [];
  
  for (const elementName of elementNames) {
    // Try direct query first
    const found = xmlDoc.querySelectorAll(elementName);
    if (found.length > 0) {
      elements.push(...Array.from(found));
      continue;
    }
    
    // Try with wildcard namespace
    const namespacedFound = xmlDoc.querySelectorAll(`*|${elementName}`);
    if (namespacedFound.length > 0) {
      elements.push(...Array.from(namespacedFound));
      continue;
    }
    
    // Try case-insensitive search
    const allElements = xmlDoc.querySelectorAll("*");
    for (const el of allElements) {
      if (el.tagName.toLowerCase() === elementName.toLowerCase() || 
          el.localName?.toLowerCase() === elementName.toLowerCase()) {
        elements.push(el);
      }
    }
  }
  
  return elements;
};

// Find possible employee elements by analyzing structure
const findPossibleEmployeeElements = (xmlDoc: Document): Element[] => {
  const elements: Element[] = [];
  const allElements = xmlDoc.querySelectorAll("*");
  
  for (const el of allElements) {
    // Look for elements that contain name-like fields
    const hasName = el.querySelector("*") && (
      findElementByTagNameIgnoreCase(el, "forename") ||
      findElementByTagNameIgnoreCase(el, "firstname") ||
      findElementByTagNameIgnoreCase(el, "givenname") ||
      findElementByTagNameIgnoreCase(el, "surname") ||
      findElementByTagNameIgnoreCase(el, "lastname") ||
      findElementByTagNameIgnoreCase(el, "familyname")
    );
    
    if (hasName) {
      elements.push(el);
    }
  }
  
  return elements;
};

// Get all available elements for error reporting
const getAvailableElements = (xmlDoc: Document): string[] => {
  const elementNames = new Set<string>();
  const allElements = xmlDoc.querySelectorAll("*");
  
  for (const el of allElements) {
    elementNames.add(el.tagName);
  }
  
  return Array.from(elementNames).slice(0, 20); // Limit to first 20 for readability
};

// Flexible element text extraction with multiple search strategies
const getFlexibleElementText = (parent: Element, tagNames: string[]): string => {
  for (const tagName of tagNames) {
    // Try exact match
    let element = parent.querySelector(tagName);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
    
    // Try case-insensitive match
    element = findElementByTagNameIgnoreCase(parent, tagName);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
    
    // Try nested search
    element = parent.querySelector(`* ${tagName}`);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
    
    // Try with any namespace prefix
    const namespacedElements = parent.querySelectorAll(`*|${tagName}`);
    for (const nsEl of namespacedElements) {
      if (nsEl.textContent?.trim()) {
        return nsEl.textContent.trim();
      }
    }
  }
  return "";
};

// Case-insensitive element finder
const findElementByTagNameIgnoreCase = (parent: Element, tagName: string): Element | null => {
  const children = parent.querySelectorAll("*");
  for (const child of children) {
    if (child.tagName.toLowerCase() === tagName.toLowerCase() || 
        child.localName?.toLowerCase() === tagName.toLowerCase()) {
      return child;
    }
  }
  return null;
};

// Debug helper to log XML structure
const logXMLStructure = (element: Element, depth: number, maxDepth: number): void => {
  if (depth > maxDepth) return;
  
  const indent = "  ".repeat(depth);
  console.log(`${indent}${element.tagName} (namespace: ${element.namespaceURI || 'none'})`);
  
  if (depth < maxDepth) {
    const children = Array.from(element.children);
    children.slice(0, 5).forEach(child => { // Limit to first 5 children per level
      logXMLStructure(child, depth + 1, maxDepth);
    });
    if (children.length > 5) {
      console.log(`${indent}  ... and ${children.length - 5} more children`);
    }
  }
};

// Debug helper to log element contents
const logElementContents = (element: Element): void => {
  console.log("Element contents:", {
    tagName: element.tagName,
    namespace: element.namespaceURI,
    textContent: element.textContent?.substring(0, 200) + (element.textContent && element.textContent.length > 200 ? "..." : ""),
    childElementCount: element.children.length,
    childElements: Array.from(element.children).slice(0, 10).map(child => child.tagName)
  });
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