
import { WorkDay } from "./types";
import { defaultWorkPattern } from "@/types/employee";

export const parseWorkPattern = (workPatternString: string | null): WorkDay[] => {
  try {
    if (workPatternString) {
      return JSON.parse(workPatternString);
    }
  } catch (e) {
    console.error("Error parsing work pattern:", e);
  }
  return defaultWorkPattern;
};

export const formatTime = (time: string | null): string => {
  if (!time) return "";
  return time;
};

export const generateHoursList = (): string[] => {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });
};
