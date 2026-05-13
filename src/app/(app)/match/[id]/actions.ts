"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PredictionChoice } from "@/types/database";

const SCHEMA = z.object({
  matchId: z.string().uuid(),
  prediction: z.enum(["home", "draw", "away"]),
});

export type PredictionResult =
  | { ok: true; prediction: PredictionChoice }
  | { ok: false; error: string };

export async function submitPrediction(
  matchId: string,
  prediction: PredictionChoice,
): Promise<PredictionResult> {
  const parsed = SCHEMA.safeParse({ matchId, prediction });
  if (!parsed.success) {
    return { ok: false, error: "Nieprawidłowe dane typu" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sesja wygasła — zaloguj się ponownie" };
  }

  const supabase = await createClient();

  // Defense in depth: sprawdź kickoff też tutaj. RLS odrzuci na poziomie SQL
  // jeśli kickoff minął, ale chcemy zwrócić czytelny komunikat zamiast generic błędu.
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, kickoff_at, status")
    .eq("id", matchId)
    .maybeSingle();

  if (matchErr || !match) {
    return { ok: false, error: "Nie znaleźliśmy meczu" };
  }

  if (new Date(match.kickoff_at).getTime() <= Date.now()) {
    return {
      ok: false,
      error: "Za późno — mecz już się rozpoczął. Typ zablokowany.",
    };
  }

  if (match.status !== "scheduled") {
    return { ok: false, error: "Tego meczu już nie można typować" };
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: matchId,
        prediction,
      },
      { onConflict: "user_id,match_id" },
    );

  if (error) {
    // RLS może odrzucić jeśli między walidacją a zapisem minął kickoff (race)
    if (error.code === "42501" || error.message.includes("violates row-level security")) {
      return {
        ok: false,
        error: "Mecz właśnie się rozpoczął — typ zablokowany",
      };
    }
    return { ok: false, error: "Nie udało się zapisać typu. Spróbuj ponownie." };
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath("/matches");
  return { ok: true, prediction };
}
