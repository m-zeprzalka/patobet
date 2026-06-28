import Link from "next/link";

import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { PredictionChip } from "@/components/matches/prediction-chip";
import { TeamBadge } from "@/components/matches/team-badge";
import { formatKickoffTime, timeUntilKickoff } from "@/lib/format";
import {
  correctChoice,
  isKnockout,
  isLocked,
  type MatchWithDetails,
} from "@/lib/matches";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: MatchWithDetails;
}

export function MatchCard({ match }: MatchCardProps) {
  const locked = isLocked(match);
  const correct = match.status === "finished" ? correctChoice(match) : null;
  const isFinished = match.status === "finished";
  const knockout = isKnockout(match.stage);

  const mySettled =
    match.myPrediction?.points_awarded != null
      ? match.myPrediction.points_awarded > 0
        ? "correct"
        : "wrong"
      : "default";

  const myAdvanceCode =
    match.myPrediction?.prediction === "home"
      ? match.home_team.code
      : match.away_team.code;
  const myHasScore =
    match.myPrediction?.home_score_pred != null &&
    match.myPrediction?.away_score_pred != null;

  return (
    <Link
      href={`/match/${match.id}`}
      className="group border-border bg-card focus-visible:ring-ring hover:border-foreground/20 hover:bg-card relative block rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            {formatKickoffTime(match.kickoff_at)}
          </span>
          {match.group_letter ? (
            <>
              <span aria-hidden className="text-muted-foreground/50 text-xs">
                ·
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                Grupa {match.group_letter}
              </span>
            </>
          ) : null}
        </div>
        <MatchStatusBadge status={match.status} />
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <TeamBadge
          name={match.home_team.name}
          code={match.home_team.code}
          flagUrl={match.home_team.flag_url}
          size="md"
        />
        <div className="flex flex-col items-center gap-0.5">
          {isFinished &&
          match.home_score != null &&
          match.away_score != null ? (
            <span className="font-display text-xl font-bold tracking-tight">
              {match.home_score}–{match.away_score}
            </span>
          ) : (
            <span className="text-muted-foreground/70 text-xs font-medium">
              {locked ? "—" : "vs"}
            </span>
          )}
        </div>
        <TeamBadge
          name={match.away_team.name}
          code={match.away_team.code}
          flagUrl={match.away_team.flag_url}
          size="md"
          className="flex-row-reverse text-right [&>div:last-child]:items-end"
        />
      </div>

      <footer className="border-border/60 mt-4 flex items-center justify-between gap-3 border-t pt-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {match.totalPredictions > 0 ? (
            <span>{match.totalPredictions} obstawiło</span>
          ) : (
            <span>Nikt jeszcze nie obstawił</span>
          )}
          {!locked ? (
            <>
              <span aria-hidden className="opacity-50">
                ·
              </span>
              <span>{timeUntilKickoff(match.kickoff_at)}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {match.myPrediction ? (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="font-medium">Twój typ:</span>
              {knockout ? (
                <span className="flex items-center gap-1.5">
                  {myHasScore ? (
                    <span className="font-display text-foreground text-xs font-semibold tabular-nums">
                      {match.myPrediction.home_score_pred}:
                      {match.myPrediction.away_score_pred}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "font-display rounded border px-1.5 py-0.5 text-[0.7rem] font-bold",
                      mySettled === "correct"
                        ? "border-energy/40 bg-energy text-energy-foreground"
                        : mySettled === "wrong"
                          ? "border-destructive/40 bg-destructive/15 text-destructive"
                          : "border-border bg-card text-foreground",
                    )}
                  >
                    {myAdvanceCode}↑
                  </span>
                </span>
              ) : (
                <PredictionChip
                  value={match.myPrediction.prediction}
                  state={mySettled}
                  size="sm"
                />
              )}
              {isFinished && match.myPrediction.points_awarded != null ? (
                <span
                  className={cn(
                    "font-display text-xs font-semibold tabular-nums",
                    match.myPrediction.points_awarded > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {match.myPrediction.points_awarded > 0
                    ? `+${match.myPrediction.points_awarded}`
                    : "0"}
                </span>
              ) : null}
            </span>
          ) : locked ? (
            <span className="text-muted-foreground/70 text-xs">
              Nie obstawiłeś
            </span>
          ) : (
            <span className="text-energy text-xs font-semibold">
              Obstaw →
            </span>
          )}
        </div>
      </footer>

      {isFinished && correct && match.myPrediction == null ? (
        <span className="bg-muted text-muted-foreground absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[0.65rem] font-medium">
          {knockout
            ? `awans: ${correct === "home" ? match.home_team.code : match.away_team.code}`
            : `poprawny: ${correct === "home" ? "1" : correct === "draw" ? "X" : "2"}`}
        </span>
      ) : null}
    </Link>
  );
}
