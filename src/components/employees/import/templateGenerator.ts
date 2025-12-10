import { availableFields, fieldLabels } from "./ImportConstants";

// Sample data rows demonstrating correct formats (DD/MM/YYYY for dates, UK-focused)
const sampleData = [
  {
    first_name: "John",
    last_name: "Smith",
    department: "Administration",
    hours_per_week: "37.5",
    hourly_rate: "15.50",
    date_of_birth: "15/03/1985",
    hire_date: "01/04/2020",
    email: "john.smith@example.com",
    address1: "123 High Street",
    address2: "Flat 2",
    address3: "London",
    address4: "England",
    postcode: "SW1A 1AA",
    payroll_id: "EMP001",
    gender: "Male",
    rate_2: "18.00",
    rate_3: "22.50",
    rate_4: "",
    national_insurance_number: "AB123456C",
    nic_code: "A",
    tax_code: "1257L"
  },
  {
    first_name: "Jane",
    last_name: "Doe",
    department: "Clinical",
    hours_per_week: "40",
    hourly_rate: "18.75",
    date_of_birth: "22/07/1990",
    hire_date: "15/09/2021",
    email: "jane.doe@example.com",
    address1: "45 Oak Road",
    address2: "",
    address3: "",
    address4: "Birmingham",
    postcode: "B1 2CD",
    payroll_id: "EMP002",
    gender: "Female",
    rate_2: "",
    rate_3: "",
    rate_4: "25.00",
    national_insurance_number: "CD987654B",
    nic_code: "C",
    tax_code: "BR"
  }
];

export const generateCSVTemplate = (): string => {
  // Create header row using field labels
  const headers = availableFields.map(field => fieldLabels[field] || field);
  
  // Create data rows
  const dataRows = sampleData.map(row => 
    availableFields.map(field => {
      const value = row[field as keyof typeof row] || "";
      // Escape values containing commas or quotes
      if (value.includes(",") || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",")
  );
  
  // Combine header and data rows
  return [headers.join(","), ...dataRows].join("\n");
};

export const downloadTemplate = (): void => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = "employee_import_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
