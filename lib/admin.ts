// lib/admin.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEYS!,
    { auth: { persistSession: false } }
);