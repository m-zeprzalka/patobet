"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PredictionChoice } from "@/types/database";

const SCHEMA = z.object({
  matchId: z.string().uuid(),
  prediction: z.enum(["home", "draw", "away"]),
  advancePick: z.enum(["home", "away"]).nullable().optional(),
});

export interface PredictionInput {
  matchId: string;
  prediction: PredictionChoice; // 1/X/2 po 90 min
  // Tylko faza pucharowa: kto awansuje (home/away).
  advancePick?: PredictionChoice | null;
}

export type PredictionResult =
  | {
      ok: true;
      prediction: PredictionChoice;
      advancePick: PredictionChoice | null;
    }
  | { ok: false; error: string };

export async function submitPrediction(
  input: PredictionInput,
): Promise<PredictionResult> {
  const parsed = SCHEMA.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Nieprawidłowe dane typu" };
  }
  const { matchId, prediction } = parsed.data;

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sesja wygasła — zaloguj się ponownie" };
  }

  const supabase = await createClient();

  // Defense in depth: sprawdź kickoff też tutaj. RLS odrzuci na poziomie SQL
  // jeśli kickoff minął, ale chcemy zwrócić czytelny komunikat zamiast generic błędu.
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, kickoff_at, status, stage")
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

  // Faza pucharowa: zapisujemy też kto awansuje (home/away). Grupowa: zawsze null.
  const advancePick =
    match.stage !== "group" ? (parsed.data.advancePick ?? null) : null;

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      prediction,
      advance_pick: advancePick,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    // RLS może odrzucić jeśli między walidacją a zapisem minął kickoff (race)
    if (
      error.code === "42501" ||
      error.message.includes("violates row-level security")
    ) {
      return {
        ok: false,
        error: "Mecz właśnie się rozpoczął — typ zablokowany",
      };
    }
    return { ok: false, error: "Nie udało się zapisać typu. Spróbuj ponownie." };
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath("/matches");
  return { ok: true, prediction, advancePick };
}
