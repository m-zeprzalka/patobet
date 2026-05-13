"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// SIGN IN — email + password
// ============================================================================

const SIGNIN_SCHEMA = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z.string().min(1, "Hasło wymagane"),
});

export type SignInState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = SIGNIN_SCHEMA.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("[signIn] Supabase error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return {
        status: "error",
        message: "Nieprawidłowy email lub hasło",
      };
    }
    if (msg.includes("email not confirmed")) {
      return {
        status: "error",
        message:
          "Email nieaktywowany. Sprawdź pocztę (i spam) — wyłącz 'Confirm email' w Supabase Auth, żeby zalogować się od razu.",
      };
    }
    return { status: "error", message: error.message };
  }

  redirect("/matches");
}

// ============================================================================
// SIGN UP — email + password (+ optional display name)
// ============================================================================

const SIGNUP_SCHEMA = z.object({
  email: z.string().email("Nieprawidłowy email"),
  password: z
    .string()
    .min(8, "Hasło min. 8 znaków")
    .max(72, "Hasło max 72 znaki"),
  displayName: z
    .string()
    .trim()
    .min(2, "Nick min. 2 znaki")
    .max(24, "Nick max 24 znaki")
    .regex(
      /^[a-zA-Z0-9_.\- ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/,
      "Tylko litery, cyfry, spacja i .-_",
    )
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type SignUpState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "needs_confirmation"; email: string };

export async function signUp(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = SIGNUP_SCHEMA.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("[signUp] Supabase error:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("already registered") || msg.includes("user already")) {
      return {
        status: "error",
        message: "Konto z tym emailem już istnieje. Zaloguj się.",
      };
    }
    if (msg.includes("password")) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: error.message };
  }

  // Jeśli user podał nick przy rejestracji — zapisz go OD RAZU przez admin client.
  // Dzięki temu nick nie wymaga ponownego ustawienia po kliknięciu w mail
  // potwierdzający (Confirm email = ON), bo trigger handle_new_user już założył
  // wiersz w profiles, a admin client bypassuje RLS (UPDATE bez sesji).
  if (parsed.data.displayName && data.user?.id) {
    try {
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({ display_name: parsed.data.displayName })
        .eq("id", data.user.id);
    } catch (e) {
      // Jeśli SUPABASE_SERVICE_ROLE_KEY nieuzupełnione — niech rejestracja
      // przejdzie, user uzupełni nick na onboardingu po loginie.
      console.error("[signUp] failed to persist display_name:", e);
    }
  }

  // Confirm email = ON → user musi potwierdzić email
  if (!data.session) {
    return {
      status: "needs_confirmation",
      email: parsed.data.email,
    };
  }

  // Confirm email = OFF → od razu zalogowany. Skok na /matches jeśli nick jest,
  // inaczej onboarding.
  redirect(parsed.data.displayName ? "/matches" : "/onboarding/nick");
}

// ============================================================================
// FORGOT PASSWORD — wysyła link resetujący
// ============================================================================

const FORGOT_SCHEMA = z.object({
  email: z.string().email("Nieprawidłowy email"),
});

export type ForgotState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; email: string };

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const parsed = FORGOT_SCHEMA.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Nieprawidłowy email",
    };
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (await headers()).get("origin") ||
    "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/reset-password`,
    },
  );

  if (error) {
    console.error("[requestPasswordReset] error:", error);
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("rate limit") || msg.includes("too many")) {
      return {
        status: "error",
        message: "Za dużo prób. Poczekaj 30-60 min albo podepnij własny SMTP.",
      };
    }
    return { status: "error", message: error.message };
  }

  // Supabase nie zdradza czy email istnieje (privacy) — zawsze zwracamy success
  return { status: "sent", email: parsed.data.email };
}

// ============================================================================
// RESET PASSWORD — ustawia nowe hasło dla zalogowanego (po kliknięciu w link)
// ============================================================================

const RESET_SCHEMA = z.object({
  password: z
    .string()
    .min(8, "Hasło min. 8 znaków")
    .max(72, "Hasło max 72 znaki"),
});

export type ResetState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function updatePassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const parsed = RESET_SCHEMA.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Nieprawidłowe hasło",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("session")
        ? "Sesja wygasła — kliknij link resetujący jeszcze raz."
        : error.message,
    };
  }

  redirect("/matches");
}

// ============================================================================
// DEV-ONLY: Nadaj sobie role admina (z poziomu /me, tylko NODE_ENV=development)
// W produkcji niedostępne — zwraca error.
// ============================================================================

export type SelfGrantState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string };

export async function grantSelfAdmin(): Promise<SelfGrantState> {
  if (process.env.NODE_ENV !== "development") {
    return {
      status: "error",
      message: "Dostępne tylko w trybie development",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Nie jesteś zalogowany" };

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", user.id);
    if (error) return { status: "error", message: error.message };
    return { status: "ok" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Nieznany błąd",
    };
  }
}
