import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/core/types/database";

let adminClient: SupabaseClient<Database> | null = null;

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.TOMESPHERE_READER_STORAGE_KEY;

  if (!url || !serverKey) {
    throw new Error("Server reader storage access is not configured");
  }

  adminClient = createClient<Database>(url, serverKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
