
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
  const timeIntervals: string[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const hourString = hour.toString().padStart(2, '0');
    
    // Add each 15-minute interval
    timeIntervals.push(`${hourString}:00`);
    timeIntervals.push(`${hourString}:15`);
    timeIntervals.push(`${hourString}:30`);
    timeIntervals.push(`${hourString}:45`);
  }
  
  return timeIntervals;
};
