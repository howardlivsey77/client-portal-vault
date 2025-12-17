import { useEffect, useRef } from "react";
import { runSicknessDataFix } from "@/utils/sickness/fixSicknessData";

const STORAGE_KEY = "sickness_fix_v1";

/**
 * Component that runs the sickness data fix once, controlled by useEffect.
 * Uses localStorage to prevent re-runs across sessions.
 * Renders nothing - purely a side-effect component.
 */
const SicknessDataFixer = () => {
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const hasRun = localStorage.getItem(STORAGE_KEY);
    if (hasRun) {
      console.log("🔧 Sickness data fix already applied, skipping");
      return;
    }

    runSicknessDataFix()
      .then(() => {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        console.log("🎉 Sickness data fix completed and flagged");
      })
      .catch((error) => {
        console.error("💥 Sickness data fix failed:", error);
        // Don't set the flag on failure so it can retry
      });
  }, []);

  return null;
};

export default SicknessDataFixer;
