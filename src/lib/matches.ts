import { createClient } from "@/lib/supabase/server";
import type {
  Database,
  MatchStage,
  MatchStatus,
  PredictionChoice,
} from "@/types/database";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];

export interface MatchWithDetails {
  id: string;
  api_id: number | null;
  home_team: Team;
  away_team: Team;
  kickoff_at: string;
  stage: MatchStage;
  group_letter: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  settled_at: string | null;
  myPrediction: PredictionRow | null;
  totalPredictions: number;
  breakdown: Record<PredictionChoice, number>;
}

const STAGE_LABEL: Record<MatchStage, string> = {
  group: "Faza grupowa",
  round_of_32: "1/16 finału",
  round_of_16: "1/8 finału",
  quarter: "Ćwierćfinał",
  semi: "Półfinał",
  third_place: "Mecz o 3. miejsce",
  final: "Finał",
};

export function stageLabel(stage: MatchStage): string {
  return STAGE_LABEL[stage];
}

const SELECT_QUERY = `
  id, api_id, kickoff_at, stage, group_letter, status,
  home_score, away_score, winner_team_id, settled_at,
  home_team:home_team_id (id, api_id, name, code, flag_url, group_letter, created_at),
  away_team:away_team_id (id, api_id, name, code, flag_url, group_letter, created_at),
  predictions (id, user_id, match_id, prediction, points_awarded, submitted_at)
`;

interface RawMatchRow extends Omit<MatchRow, "home_team_id" | "away_team_id"> {
  home_team: Team;
  away_team: Team;
  predictions: PredictionRow[];
}

function aggregate(
  row: RawMatchRow,
  myUserId: string,
): MatchWithDetails {
  const breakdown: Record<PredictionChoice, number> = {
    home: 0,
    draw: 0,
    away: 0,
  };
  let mine: PredictionRow | null = null;

  for (const p of row.predictions) {
    breakdown[p.prediction] += 1;
    if (p.user_id === myUserId) mine = p;
  }

  return {
    id: row.id,
    api_id: row.api_id,
    home_team: row.home_team,
    away_team: row.away_team,
    kickoff_at: row.kickoff_at,
    stage: row.stage,
    group_letter: row.group_letter,
    status: row.status,
    home_score: row.home_score,
    away_score: row.away_score,
    winner_team_id: row.winner_team_id,
    settled_at: row.settled_at,
    myPrediction: mine,
    totalPredictions: row.predictions.length,
    breakdown,
  };
}

export async function getMatchesWithDetails(
  userId: string,
): Promise<MatchWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(SELECT_QUERY)
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as RawMatchRow[]).map((row) => aggregate(row, userId));
}

export async function getMatchById(
  id: string,
  userId: string,
): Promise<MatchWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(SELECT_QUERY)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return aggregate(data as unknown as RawMatchRow, userId);
}

export interface UserPrediction {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  prediction: PredictionChoice;
  points_awarded: number | null;
  submitted_at: string;
}

export async function getMatchPredictionsWithProfiles(
  matchId: string,
): Promise<UserPrediction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("predictions")
    .select(
      `prediction, points_awarded, submitted_at, user_id,
       profile:user_id ( display_name, avatar_url )`,
    )
    .eq("match_id", matchId)
    .order("submitted_at", { ascending: true });

  if (error) throw error;

  type RawRow = {
    prediction: PredictionChoice;
    points_awarded: number | null;
    submitted_at: string;
    user_id: string;
    profile: { display_name: string | null; avatar_url: string | null } | null;
  };

  return (data as unknown as RawRow[])
    .filter((r) => r.profile?.display_name)
    .map((r) => ({
      user_id: r.user_id,
      display_name: r.profile!.display_name!,
      avatar_url: r.profile!.avatar_url,
      prediction: r.prediction,
      points_awarded: r.points_awarded,
      submitted_at: r.submitted_at,
    }));
}

export function isLocked(match: Pick<MatchWithDetails, "kickoff_at" | "status">): boolean {
  if (match.status === "cancelled" || match.status === "postponed") return true;
  return new Date(match.kickoff_at).getTime() <= Date.now();
}

export function correctChoice(
  match: Pick<MatchWithDetails, "stage" | "home_score" | "away_score" | "winner_team_id" | "home_team" | "away_team">,
): PredictionChoice | null {
  if (match.stage === "group") {
    if (match.home_score == null || match.away_score == null) return null;
    if (match.home_score > match.away_score) return "home";
    if (match.home_score < match.away_score) return "away";
    return "draw";
  }
  if (!match.winner_team_id) return null;
  if (match.winner_team_id === match.home_team.id) return "home";
  if (match.winner_team_id === match.away_team.id) return "away";
  return null;
}
