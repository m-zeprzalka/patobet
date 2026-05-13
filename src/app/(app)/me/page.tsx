import Link from "next/link";

import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { PredictionChip } from "@/components/matches/prediction-chip";
import { TeamBadge } from "@/components/matches/team-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserWithProfile } from "@/lib/auth";
import { formatKickoffDate, formatKickoffTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type {
  Database,
  MatchStatus,
  PredictionChoice,
} from "@/types/database";

import { DevTools } from "./dev-tools";
import { EditProfileForm } from "./edit-profile-form";

export const dynamic = "force-dynamic";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface MyPredictionRow {
  id: string;
  prediction: PredictionChoice;
  points_awarded: number | null;
  submitted_at: string;
  match: {
    id: string;
    kickoff_at: string;
    status: MatchStatus;
    home_score: number | null;
    away_score: number | null;
    home_team: Team;
    away_team: Team;
  };
}

export default async function MePage() {
  const { user, profile } = await requireUserWithProfile();
  const supabase = await createClient();

  const [predictionsRes, leaderboardRes] = await Promise.all([
    supabase
      .from("predictions")
      .select(
        `id, prediction, points_awarded, submitted_at,
         match:match_id (
           id, kickoff_at, status, home_score, away_score,
           home_team:home_team_id (id, api_id, name, code, flag_url, group_letter, created_at),
           away_team:away_team_id (id, api_id, name, code, flag_url, group_letter, created_at)
         )`,
      )
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("leaderboard")
      .select("user_id, total_points, correct_predictions, predictions_settled, accuracy_pct")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (predictionsRes.error) throw predictionsRes.error;
  if (leaderboardRes.error) throw leaderboardRes.error;

  const predictions = (predictionsRes.data ?? []) as unknown as MyPredictionRow[];
  const stats = leaderboardRes.data ?? {
    total_points: 0,
    correct_predictions: 0,
    predictions_settled: 0,
    accuracy_pct: 0,
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex items-center gap-4">
        <UserAvatar
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          className="size-16"
        />
        <div className="flex min-w-0 flex-col">
          <h1 className="font-display truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {profile.display_name}
          </h1>
          <p className="text-muted-foreground truncate text-sm">
            {user.email}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Punkty" value={String(stats.total_points)} />
        <Stat
          label="Trafienia"
          value={`${stats.correct_predictions}/${stats.predictions_settled}`}
        />
        <Stat label="Skuteczność" value={`${stats.accuracy_pct}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-tight">
            Edycja profilu
          </CardTitle>
          <CardDescription>
            Nick zobaczą znajomi w tabeli. Avatar pojawi się w kolejnej iteracji
            (upload zostawiamy na potem).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm defaultDisplayName={profile.display_name ?? ""} />
        </CardContent>
      </Card>

      {process.env.NODE_ENV === "development" ? (
        <DevTools isAdmin={profile.is_admin} />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Moje typy
        </h2>
        {predictions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <span aria-hidden className="text-3xl">🎯</span>
              <p className="text-muted-foreground text-sm">
                Jeszcze nic nie obstawiłeś. Idź do{" "}
                <Link href="/matches" className="text-foreground underline-offset-4 hover:underline">
                  meczów
                </Link>{" "}
                i wybierz pierwszy typ.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="px-3 py-2 sm:px-4">
              <ul className="flex flex-col">
                {predictions.map((p, i) => {
                  const isFinished = p.match.status === "finished";
                  const state =
                    p.points_awarded == null
                      ? "default"
                      : p.points_awarded > 0
                        ? "correct"
                        : "wrong";
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "border-border/60 flex items-center justify-between gap-3 py-3",
                        i > 0 && "border-t",
                      )}
                    >
                      <Link
                        href={`/match/${p.match.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded"
                      >
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <TeamBadge
                              name={p.match.home_team.name}
                              code={p.match.home_team.code}
                              flagUrl={p.match.home_team.flag_url}
                              size="sm"
                            />
                            <span className="text-muted-foreground text-xs">
                              vs
                            </span>
                            <TeamBadge
                              name={p.match.away_team.name}
                              code={p.match.away_team.code}
                              flagUrl={p.match.away_team.flag_url}
                              size="sm"
                            />
                          </div>
                          <div className="text-muted-foreground flex items-center gap-2 text-[0.7rem]">
                            <span>
                              {formatKickoffDate(p.match.kickoff_at)} ·{" "}
                              {formatKickoffTime(p.match.kickoff_at)}
                            </span>
                            <MatchStatusBadge status={p.match.status} />
                            {isFinished &&
                            p.match.home_score != null &&
                            p.match.away_score != null ? (
                              <span className="font-display font-semibold">
                                {p.match.home_score}–{p.match.away_score}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        {p.points_awarded != null ? (
                          <span
                            className={cn(
                              "font-display text-xs font-semibold tabular-nums",
                              p.points_awarded > 0
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {p.points_awarded > 0 ? "+3" : "0"}
                          </span>
                        ) : null}
                        <PredictionChip value={p.prediction} state={state} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-lg border p-3 sm:p-4">
      <div className="text-muted-foreground text-[0.65rem] font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className="font-display mt-1 text-xl font-bold tabular-nums sm:text-2xl">
        {value}
      </div>
    </div>
  );
}
