
import { Employee } from "@/types/employeeDetails";
import { ContactInfoDisplayProps } from "./types";

export const ContactInfoDisplay = ({ employee, formattedAddress }: ContactInfoDisplayProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Email</h3>
        <p className="p-2 bg-gray-50 rounded border border-gray-100">
          {employee.email || "Not provided"}
        </p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Address Line 1</h3>
        <p className="p-2 bg-gray-50 rounded border border-gray-100">
          {employee.address1 || "Not provided"}
        </p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Address Line 2</h3>
        <p className="p-2 bg-gray-50 rounded border border-gray-100">
          {employee.address2 || "Not provided"}
        </p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Address Line 3</h3>
        <p className="p-2 bg-gray-50 rounded border border-gray-100">
          {employee.address3 || "Not provided"}
        </p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Address Line 4</h3>
        <p className="p-2 bg-gray-50 rounded border border-gray-100">
          {employee.address4 || "Not provided"}
        </p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Postcode</h3>
        <p className="p-2 bg-gray-50 rounded border border-gray-100">
          {employee.postcode || "Not provided"}
        </p>
      </div>
    </div>
  );
};
