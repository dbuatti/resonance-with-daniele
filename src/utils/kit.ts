"use client";

import { supabase } from "@/integrations/supabase/client";

/**
 * Triggers the server-side sync to Kit.com via Supabase Edge Functions
 */
export async function syncMembersToKit() {
  
  const { data, error } = await supabase.functions.invoke('sync-to-kit');

  if (error) {
    throw new Error(error.message || "Failed to trigger sync function");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}