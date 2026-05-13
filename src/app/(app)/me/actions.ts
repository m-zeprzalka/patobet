"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const SCHEMA = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Min. 2 znaki")
    .max(24, "Max 24 znaki")
    .regex(
      /^[a-zA-Z0-9_.\- ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+$/,
      "Tylko litery, cyfry, spacja i .-_",
    ),
});

export type ProfileState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { status: "error", message: "Sesja wygasła" };

  const parsed = SCHEMA.safeParse({ displayName: formData.get("displayName") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Nieprawidłowy nick",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Ten nick jest już zajęty" };
    }
    return { status: "error", message: "Nie udało się zapisać zmian" };
  }

  revalidatePath("/me");
  revalidatePath("/leaderboard");
  return { status: "saved" };
}
