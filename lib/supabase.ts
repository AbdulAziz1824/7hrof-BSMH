import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

/** Every player gets a stable anonymous identity, so a reload or reconnect keeps their seat. */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: res, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return res.session!;
}
