"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  OpenFootballError,
  syncOpenFootball,
} from "@/lib/openfootball/sync";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const RESULT_SCHEMA = z.object({
  matchId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  winnerSide: z.enum(["home", "away", "none"]).optional(),
});

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function setMatchResult(
  formData: FormData,
): Promise<AdminActionResult> {
  await requireAdmin();

  const parsed = RESULT_SCHEMA.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
    winnerSide: formData.get("winnerSide"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane",
    };
  }

  const supabase = await createClient();
  const matchRes = await supabase
    .from("matches")
    .select("id, stage, home_team_id, away_team_id")
    .eq("id", parsed.data.matchId)
    .maybeSingle<{
      id: string;
      stage: string;
      home_team_id: string;
      away_team_id: string;
    }>();
  if (matchRes.error || !matchRes.data) {
    return { ok: false, error: "Nie znaleziono meczu" };
  }
  const match = matchRes.data;

  let winnerId: string | null = null;
  if (match.stage !== "group") {
    if (parsed.data.winnerSide === "home") winnerId = match.home_team_id;
    else if (parsed.data.winnerSide === "away") winnerId = match.away_team_id;
    else {
      return {
        ok: false,
        error: "Faza pucharowa wymaga wskazania zwycięzcy",
      };
    }
  }

  const { error } = await supabase.rpc("admin_set_match_result", {
    p_match_id: parsed.data.matchId,
    p_home_score: parsed.data.homeScore,
    p_away_score: parsed.data.awayScore,
    p_winner_team_id: winnerId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  revalidatePath(`/match/${parsed.data.matchId}`);
  return { ok: true, message: "Wynik zapisany i punkty rozliczone" };
}

export async function forceSyncOpenFootball(): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const result = await syncOpenFootball();
    revalidatePath("/admin");
    revalidatePath("/matches");
    revalidatePath("/leaderboard");

    const parts = [
      `${result.teamsUpserted} drużyn`,
      `${result.matchesUpserted} meczów`,
      `${result.matchesSettled} rozliczonych`,
    ];
    if (result.matchesSkipped > 0)
      parts.push(`${result.matchesSkipped} pominiętych (placeholdery)`);
    if (result.errors.length > 0)
      parts.push(`${result.errors.length} błędów`);

    return {
      ok: result.errors.length === 0,
      message:
        result.errors.length === 0
          ? `Sync OK — ${parts.join(", ")}`
          : `Sync z błędami — ${parts.join(", ")}: ${result.errors[0]}`,
    } as AdminActionResult;
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof OpenFootballError
          ? `OpenFootball: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Sync nie powiódł się",
    };
  }
}
