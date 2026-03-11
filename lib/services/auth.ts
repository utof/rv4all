import { supabase } from "@/db/provider";

/**
 * Upgrades the current anonymous session to a permanent account.
 * Two sequential updateUser calls are used so that a duplicate-email
 * error on the first call can be caught and surfaced before the
 * password is set. Same user_id is preserved; all history stays visible.
 * Throws on failure (caller handles error messages).
 */
export async function upgradeAccount(email: string, password: string): Promise<void> {
  const { error: emailError } = await supabase.auth.updateUser({ email });
  if (emailError) throw emailError;

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) throw passwordError;
}

/**
 * Signs in an existing account. Replaces the current anon session
 * with the real account — cross-device history becomes visible.
 * Throws on failure (caller handles error messages).
 */
export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Signs out and immediately creates a new anonymous session so the
 * app stays in a valid two-state model (anon or authenticated, never null).
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  await supabase.auth.signInAnonymously();
}
