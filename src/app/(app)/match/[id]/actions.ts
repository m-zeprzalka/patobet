"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PredictionChoice } from "@/types/database";

const SCORE = z.number().int().min(0).max(99);

const SCHEMA = z.object({
  matchId: z.string().uuid(),
  prediction: z.enum(["home", "draw", "away"]),
  homeScorePred: SCORE.nullable().optional(),
  awayScorePred: SCORE.nullable().optional(),
});

export interface PredictionInput {
  matchId: string;
  prediction: PredictionChoice;
  // Tylko faza pucharowa: typowany dokładny wynik po 90 min. Oba albo żadne.
  homeScorePred?: number | null;
  awayScorePred?: number | null;
}

export type PredictionResult =
  | {
      ok: true;
      prediction: PredictionChoice;
      homeScorePred: number | null;
      awayScorePred: number | null;
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

  let homeScorePred: number | null = null;
  let awayScorePred: number | null = null;

  if (match.stage !== "group") {
    // Faza pucharowa: `prediction` = kto awansuje (home/away), remis nie istnieje.
    if (prediction === "draw") {
      return { ok: false, error: "W fazie pucharowej wskaż, kto awansuje" };
    }
    const h = parsed.data.homeScorePred ?? null;
    const a = parsed.data.awayScorePred ?? null;
    if ((h == null) !== (a == null)) {
      return {
        ok: false,
        error: "Podaj cały wynik (oba pola) albo zostaw oba puste",
      };
    }
    homeScorePred = h;
    awayScorePred = a;
  }
  // Faza grupowa: tylko 1/X/2, typ wyniku zostaje NULL.

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      prediction,
      home_score_pred: homeScorePred,
      away_score_pred: awayScorePred,
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
  return { ok: true, prediction, homeScorePred, awayScorePred };
}
