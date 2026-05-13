import { createAdminClient } from "@/lib/supabase/admin";
import type { MatchStage, MatchStatus } from "@/types/database";

import { fetchFixtures, fetchTeams, OpenFootballError } from "./client";
import { fifaToFlagUrl, fifaToPolishName } from "./fifa-to-iso";
import type { OfMatch, OfScore } from "./types";

export interface SyncSummary {
  teamsUpserted: number;
  matchesUpserted: number;
  matchesSettled: number;
  matchesSkipped: number;
  errors: string[];
}

const KNOCKOUT_ROUND_MAP: Record<string, MatchStage> = {
  "round of 32": "round_of_32",
  "round of 16": "round_of_16",
  "quarter-final": "quarter",
  "quarter final": "quarter",
  "semi-final": "semi",
  "semi final": "semi",
  "match for third place": "third_place",
  "3rd place": "third_place",
  "third place": "third_place",
  final: "final",
};

function mapStage(round: string): MatchStage {
  const r = round.trim().toLowerCase();
  if (r.startsWith("matchday")) return "group";
  return KNOCKOUT_ROUND_MAP[r] ?? "group";
}

function parseGroupLetter(group: string | undefined): string | null {
  if (!group) return null;
  const m = group.match(/Group ([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Parsuje datę + czas z OpenFootball na ISO UTC.
 * Time bywa w formacie "13:00 UTC-6" lub "19:00" (zakładamy wtedy UTC).
 */
function parseKickoff(date: string, time: string): string {
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(UTC([+-]\d{1,2}))?/);
  if (!timeMatch) {
    // Fallback: tylko data, ustaw 12:00 UTC
    return new Date(`${date}T12:00:00Z`).toISOString();
  }
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const offsetHours = timeMatch[4] ? parseInt(timeMatch[4], 10) : 0;

  // Lokalny czas turnieju w timezone offset → konwersja na UTC
  // np. "13:00 UTC-6" → 13:00 w -6 → 19:00 UTC
  const utcHours = hours - offsetHours;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCHours(utcHours, minutes, 0, 0);
  return d.toISOString();
}

/**
 * Sprawdza czy nazwa zespołu w OpenFootball wygląda na placeholder
 * (jeszcze niewyłonioną drużynę), np. "W101", "1A", "Runner-up Group B".
 */
function isPlaceholder(teamName: string): boolean {
  const t = teamName.trim();
  if (/^W\d+$/i.test(t)) return true; // W101 = winner of match 101
  if (/^L\d+$/i.test(t)) return true; // L101 = loser
  if (/^\d[A-L]$/i.test(t)) return true; // 1A = 1st of group A
  if (/group/i.test(t)) return true; // "Runner-up Group X" etc.
  if (/winner|loser|placeholder/i.test(t)) return true;
  return false;
}

function deriveScores(score: OfScore | undefined): {
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  knockoutWinner: "home" | "away" | null;
} {
  if (!score?.ft) {
    return {
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      knockoutWinner: null,
    };
  }

  let winner: "home" | "away" | null = null;
  if (score.pen) {
    winner = score.pen[0] > score.pen[1] ? "home" : "away";
  } else if (score.et) {
    if (score.et[0] > score.et[1]) winner = "home";
    else if (score.et[1] > score.et[0]) winner = "away";
  } else {
    if (score.ft[0] > score.ft[1]) winner = "home";
    else if (score.ft[1] > score.ft[0]) winner = "away";
  }

  return {
    homeScore: score.ft[0],
    awayScore: score.ft[1],
    status: "finished",
    knockoutWinner: winner,
  };
}

// Stabilny "natural key" dla meczu — pozwala upsert bez api_id z OpenFootball.
// Hashujemy tylko round+team1+team2, BEZ daty/czasu, żeby przesunięcie kickoffa
// w aktualizacjach JSON nie utworzyło duplikatu.
function syntheticApiId(m: OfMatch): number {
  const key = `${m.round}|${m.team1}|${m.team2}`;
  // FNV-1a 32-bit hash (poda się w int4).
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h & 0x7fffffff;
}

// ============================================================================

export async function syncOpenFootball(): Promise<SyncSummary> {
  const summary: SyncSummary = {
    teamsUpserted: 0,
    matchesUpserted: 0,
    matchesSettled: 0,
    matchesSkipped: 0,
    errors: [],
  };

  const admin = createAdminClient();

  // --- 1. Teams ---
  const ofTeams = await fetchTeams();

  const teamRows = ofTeams.map((t) => ({
    name: fifaToPolishName(t.fifa_code, t.name_normalised ?? t.name),
    code: t.fifa_code,
    flag_url: fifaToFlagUrl(t.fifa_code),
    group_letter: t.group,
  }));

  const { error: teamsErr } = await admin
    .from("teams")
    .upsert(teamRows, { onConflict: "code" });

  if (teamsErr) {
    // Brakuje unique constraint na code? Spróbuj API id stronie awaryjnej
    // (kod nigdy nie powinien wybuchnąć, ale lepiej zwrócić czytelny błąd).
    if (teamsErr.code === "42P10") {
      summary.errors.push(
        `Tabela teams nie ma unique constraint na (code). Uruchom migrację 0004.`,
      );
      return summary;
    }
    summary.errors.push(`Upsert teams: ${teamsErr.message}`);
    return summary;
  }
  summary.teamsUpserted = teamRows.length;

  // --- 2. Map team name → uuid (po sync) ---
  const { data: storedTeams, error: selectErr } = await admin
    .from("teams")
    .select("id, name, code");
  if (selectErr) {
    summary.errors.push(`Select teams: ${selectErr.message}`);
    return summary;
  }

  // OpenFootball używa "name" w meczach, ale teams_meta ma "name" + "name_normalised".
  // Budujemy mapę po nazwie i name_normalised.
  const nameToId = new Map<string, string>();
  for (const t of storedTeams ?? []) {
    nameToId.set(t.name, t.id);
    nameToId.set(t.code, t.id);
  }
  for (const t of ofTeams) {
    const stored = (storedTeams ?? []).find((s) => s.code === t.fifa_code);
    if (stored) {
      nameToId.set(t.name, stored.id);
      if (t.name_normalised) nameToId.set(t.name_normalised, stored.id);
    }
  }

  // --- 3. Matches ---
  const { matches } = await fetchFixtures();

  type MatchRow = {
    api_id: number;
    home_team_id: string;
    away_team_id: string;
    kickoff_at: string;
    stage: MatchStage;
    group_letter: string | null;
    status: MatchStatus;
    home_score: number | null;
    away_score: number | null;
    winner_team_id: string | null;
    last_synced_at: string;
  };

  const matchRows: MatchRow[] = [];
  const apiIdsToSettle: number[] = [];

  for (const m of matches) {
    if (isPlaceholder(m.team1) || isPlaceholder(m.team2)) {
      summary.matchesSkipped += 1;
      continue;
    }

    const homeId = nameToId.get(m.team1);
    const awayId = nameToId.get(m.team2);
    if (!homeId || !awayId) {
      summary.errors.push(
        `Nie znaleziono drużyny dla meczu: ${m.team1} vs ${m.team2}`,
      );
      summary.matchesSkipped += 1;
      continue;
    }

    const stage = mapStage(m.round);
    const groupLetter = stage === "group" ? parseGroupLetter(m.group) : null;
    const scores = deriveScores(m.score);
    const winnerTeamId =
      stage !== "group" && scores.knockoutWinner
        ? scores.knockoutWinner === "home"
          ? homeId
          : awayId
        : null;

    const apiId = syntheticApiId(m);
    matchRows.push({
      api_id: apiId,
      home_team_id: homeId,
      away_team_id: awayId,
      kickoff_at: parseKickoff(m.date, m.time),
      stage,
      group_letter: groupLetter,
      status: scores.status,
      home_score: scores.homeScore,
      away_score: scores.awayScore,
      winner_team_id: winnerTeamId,
      last_synced_at: new Date().toISOString(),
    });
    if (scores.status === "finished") {
      apiIdsToSettle.push(apiId);
    }
  }

  if (matchRows.length === 0) {
    return summary;
  }

  const { error: matchErr } = await admin
    .from("matches")
    .upsert(matchRows, { onConflict: "api_id" });
  if (matchErr) {
    summary.errors.push(`Upsert matches: ${matchErr.message}`);
    return summary;
  }
  summary.matchesUpserted = matchRows.length;

  // --- 4. Settle finished ---
  if (apiIdsToSettle.length > 0) {
    const { data: finishedMatches, error: selectFinErr } = await admin
      .from("matches")
      .select("id, api_id")
      .in("api_id", apiIdsToSettle);
    if (selectFinErr) {
      summary.errors.push(`Select for settle: ${selectFinErr.message}`);
    } else {
      for (const fm of finishedMatches ?? []) {
        const { error: rpcErr } = await admin.rpc("settle_match", {
          p_match_id: fm.id,
        });
        if (rpcErr) {
          summary.errors.push(`settle_match ${fm.api_id}: ${rpcErr.message}`);
        } else {
          summary.matchesSettled += 1;
        }
      }
    }
  }

  return summary;
}

export { OpenFootballError };
