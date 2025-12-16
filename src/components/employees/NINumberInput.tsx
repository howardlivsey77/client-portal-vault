import * as React from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { REGEXP_ONLY_CHARS } from "input-otp";

interface NINumberInputProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

// Custom pattern: positions 0-1 and 8 are letters (A-Z), positions 2-7 are digits (0-9)
const NI_PATTERN = "^[A-Za-z]{0,2}[0-9]{0,6}[A-Za-z]?$";

export const NINumberInput = ({ value, onChange, disabled, className }: NINumberInputProps) => {
  // Remove spaces from stored value for display in OTP input
  const cleanValue = (value || "").replace(/\s/g, "").toUpperCase();

  const handleChange = (newValue: string) => {
    // Store without spaces, uppercase
    onChange(newValue.toUpperCase());
  };

  return (
    <InputOTP
      maxLength={9}
      value={cleanValue}
      onChange={handleChange}
      disabled={disabled}
      pattern={NI_PATTERN}
      inputMode="text"
      className={cn(className)}
    >
      {/* First 2 letters (e.g., QQ) */}
      <InputOTPGroup>
        <InputOTPSlot index={0} className="uppercase bg-white" />
        <InputOTPSlot index={1} className="uppercase bg-white" />
      </InputOTPGroup>
      
      <InputOTPSeparator />
      
      {/* First 2 digits */}
      <InputOTPGroup>
        <InputOTPSlot index={2} className="bg-white" />
        <InputOTPSlot index={3} className="bg-white" />
      </InputOTPGroup>
      
      <InputOTPSeparator />
      
      {/* Second 2 digits */}
      <InputOTPGroup>
        <InputOTPSlot index={4} className="bg-white" />
        <InputOTPSlot index={5} className="bg-white" />
      </InputOTPGroup>
      
      <InputOTPSeparator />
      
      {/* Third 2 digits */}
      <InputOTPGroup>
        <InputOTPSlot index={6} className="bg-white" />
        <InputOTPSlot index={7} className="bg-white" />
      </InputOTPGroup>
      
      <InputOTPSeparator />
      
      {/* Final letter (e.g., C) */}
      <InputOTPGroup>
        <InputOTPSlot index={8} className="uppercase bg-white" />
      </InputOTPGroup>
    </InputOTP>
  );
};

/**
 * Format NI Number for display with spaces
 * Input: QQ123456C -> Output: QQ 12 34 56 C
 */
export const formatNINumberForDisplay = (niNumber: string | null | undefined): string => {
  if (!niNumber) return "";
  
  const cleaned = niNumber.replace(/\s/g, "").toUpperCase();
  if (cleaned.length !== 9) return niNumber; // Return as-is if not 9 chars
  
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
};
