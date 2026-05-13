import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Fallback gdy trigger handle_new_user nie odpalił (np. user założony przed migracją).
 * Próbuje stworzyć wiersz w profiles dla aktualnego użytkownika i go zwrócić.
 */
async function ensureProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  // Próba INSERT — pasuje do nowo zalogowanego usera (auth.uid() = userId).
  // RLS może odrzucić, jeśli klient SDK przekazuje session do POSTGRESTa — ale RLS na profiles
  // nie ma policy INSERT, więc autoryzowany INSERT przejdzie tylko z service_role/triggera.
  // Spróbujmy. Jeśli się nie uda — fallback do null.
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .maybeSingle();
  if (!error && data) return data;
  // Może wyścig — ktoś założył w międzyczasie. Pobierz ponownie.
  return getProfile(userId);
}

/**
 * Wymaga zalogowanego usera + uzupełnionego nicka.
 * Brak zalogowania → /login. Brak nicka → /onboarding/nick.
 * Używaj w (app) layout/page.
 */
export async function requireUserWithProfile() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  let profile = await getProfile(user.id);
  if (!profile) {
    // Trigger nie odpalił (user istniał przed migracją) — dotwórz profil w locie.
    profile = await ensureProfile(user.id);
  }
  if (!profile) {
    redirect("/login?error=missing_profile");
  }
  if (!profile.display_name) {
    redirect("/onboarding/nick");
  }
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireUserWithProfile();
  if (!profile.is_admin) {
    redirect("/matches");
  }
  return { user, profile };
}
