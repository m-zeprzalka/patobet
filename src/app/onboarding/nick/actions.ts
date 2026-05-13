"use server";

import { redirect } from "next/navigation";
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

export type NickState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function setNickname(
  _prev: NickState,
  formData: FormData,
): Promise<NickState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

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
      return { status: "error", message: "Ten nick jest już zajęty." };
    }
    return {
      status: "error",
      message: "Nie udało się zapisać nicka. Spróbuj ponownie.",
    };
  }

  redirect("/matches");
}
