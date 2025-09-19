import { supabase } from "@/integrations/supabase/client";

export async function invokeFunction(name: string, options: any) {
  if (name === "send-invite") {
    console.warn("🚨 [COMPAT] Legacy function name used → send-invite. Expected admin-invite.");
    console.warn("🚨 [COMPAT] This indicates stale cached code is still running!");
  }
  
  console.info(`📡 [INVOKE] Calling function: ${name}`, {
    timestamp: new Date().toISOString(),
    buildInfo: (window as any).__BUILD_INFO__
  });
  
  return supabase.functions.invoke(name, options);
}