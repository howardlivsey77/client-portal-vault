import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FpsResult {
  xml: string;
  employeeCount: number;
  taxYear: string;
  taxPeriod: number;
  generatedAt: string;
}

interface GenerateFpsParams {
  companyId: string;
  taxYear: string;
  taxPeriod: number;
  finalSubmission?: boolean;
}

export function useGenerateFps() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FpsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: GenerateFpsParams) => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-fps", {
        body: params,
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to generate FPS");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as FpsResult);
      return data as FpsResult;
    } catch (err: any) {
      const message = err?.message || "An unexpected error occurred";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { generate, isLoading, result, error, reset };
}
