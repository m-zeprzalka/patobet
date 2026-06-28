import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { PredictionsList } from "@/components/matches/predictions-list";
import { TeamBadge } from "@/components/matches/team-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUserWithProfile } from "@/lib/auth";
import {
  formatKickoffDateLong,
  formatKickoffTime,
  timeUntilKickoff,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  correctChoice,
  getMatchById,
  getMatchPredictionsWithProfiles,
  isKnockout,
  isLocked,
  knockoutBreakdown,
  stageLabel,
} from "@/lib/matches";

import { KnockoutPredictForm } from "./knockout-predict-form";
import { PredictButtons } from "./predict-buttons";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireUserWithProfile();
  const { id } = await params;

  const match = await getMatchById(id, user.id);
  if (!match) notFound();

  const [predictions] = await Promise.all([
    getMatchPredictionsWithProfiles(id),
  ]);

  const locked = isLocked(match);
  const isFinished = match.status === "finished";
  const correct = isFinished ? correctChoice(match) : null;
  const knockout = isKnockout(match.stage);
  const myBreakdown =
    isFinished && knockout && match.myPrediction
      ? knockoutBreakdown(match, match.myPrediction)
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Link
        href="/matches"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded"
      >
        ← Wszystkie mecze
      </Link>

      <Card className="mb-6">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs font-medium">
                {stageLabel(match.stage)}
                {match.group_letter ? ` · Grupa ${match.group_letter}` : ""}
              </span>
              <span className="text-foreground text-sm font-medium">
                {formatKickoffDateLong(match.kickoff_at)} ·{" "}
                {formatKickoffTime(match.kickoff_at)}
              </span>
            </div>
            <MatchStatusBadge status={match.status} />
          </header>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            <TeamBadge
              name={match.home_team.name}
              code={match.home_team.code}
              flagUrl={match.home_team.flag_url}
              size="lg"
            />
            <div className="flex flex-col items-center gap-1">
              {isFinished &&
              match.home_score != null &&
              match.away_score != null ? (
                <span className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {match.home_score}–{match.away_score}
                </span>
              ) : (
                <span className="text-muted-foreground/60 font-display text-2xl">
                  vs
                </span>
              )}
              {!locked ? (
                <span className="text-muted-foreground text-[0.7rem] font-medium">
                  {timeUntilKickoff(match.kickoff_at)}
                </span>
              ) : null}
            </div>
            <TeamBadge
              name={match.away_team.name}
              code={match.away_team.code}
              flagUrl={match.away_team.flag_url}
              size="lg"
              className="flex-row-reverse text-right [&>div:last-child]:items-end"
            />
          </div>

          <div className="border-border/60 border-t pt-5">
            <h2 className="font-display text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              {locked
                ? "Twój typ"
                : knockout
                  ? "Kto awansuje + dokładny wynik"
                  : "Obstaw 1 / X / 2"}
            </h2>
            {knockout ? (
              <KnockoutPredictForm
                matchId={match.id}
                home={{
                  code: match.home_team.code,
                  name: match.home_team.name,
                  flagUrl: match.home_team.flag_url,
                }}
                away={{
                  code: match.away_team.code,
                  name: match.away_team.name,
                  flagUrl: match.away_team.flag_url,
                }}
                initialAdvance={match.myPrediction?.prediction ?? null}
                initialHomeScore={match.myPrediction?.home_score_pred ?? null}
                initialAwayScore={match.myPrediction?.away_score_pred ?? null}
                locked={locked}
              />
            ) : (
              <PredictButtons
                matchId={match.id}
                initialPrediction={match.myPrediction?.prediction ?? null}
                homeCode={match.home_team.code}
                awayCode={match.away_team.code}
                locked={locked}
              />
            )}

            {myBreakdown ? (
              <div className="border-border/60 mt-4 flex items-center justify-center gap-4 border-t pt-4 text-sm">
                <BreakdownItem
                  label="Awans"
                  ok={myBreakdown.advanced}
                />
                <span aria-hidden className="text-muted-foreground/40">
                  ·
                </span>
                <BreakdownItem
                  label="Dokładny wynik"
                  ok={myBreakdown.exactScore}
                />
                <span aria-hidden className="text-muted-foreground/40">
                  ·
                </span>
                <span className="font-display font-semibold tabular-nums">
                  {(myBreakdown.advanced ? 1 : 0) +
                    (myBreakdown.exactScore ? 1 : 0)}
                  /2 pkt
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Typy znajomych
          </h2>
          <span className="text-muted-foreground text-xs">
            {predictions.length}{" "}
            {predictions.length === 1
              ? "osoba"
              : predictions.length >= 2 && predictions.length <= 4
                ? "osoby"
                : "osób"}
          </span>
        </header>
        <Card>
          <CardContent className="px-4 py-2 sm:px-5">
            <PredictionsList
              predictions={predictions}
              correct={correct}
              currentUserId={user.id}
              knockout={knockout}
              homeCode={match.home_team.code}
              awayCode={match.away_team.code}
              actualHomeScore={isFinished ? match.home_score : null}
              actualAwayScore={isFinished ? match.away_score : null}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function BreakdownItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        ok ? "text-energy" : "text-muted-foreground",
      )}
    >
      <span aria-hidden>{ok ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}
