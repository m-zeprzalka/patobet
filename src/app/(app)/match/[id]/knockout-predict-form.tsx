"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PredictionChoice } from "@/types/database";

import { submitPrediction } from "./actions";

type Side = "home" | "away";

interface KnockoutTeam {
  code: string;
  name: string;
  flagUrl: string | null;
}

interface KnockoutPredictFormProps {
  matchId: string;
  home: KnockoutTeam;
  away: KnockoutTeam;
  initialAdvance: PredictionChoice | null;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
  locked: boolean;
}

function FlagDot({ team }: { team: KnockoutTeam }) {
  return (
    <span
      className="bg-muted border-border/60 relative inline-block size-6 shrink-0 overflow-hidden rounded-sm border"
      aria-hidden
    >
      {team.flagUrl ? (
        <Image
          src={team.flagUrl}
          alt=""
          fill
          sizes="24px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-bold">
          {team.code}
        </span>
      )}
    </span>
  );
}

export function KnockoutPredictForm({
  matchId,
  home,
  away,
  initialAdvance,
  initialHomeScore,
  initialAwayScore,
  locked,
}: KnockoutPredictFormProps) {
  const [advance, setAdvance] = useState<Side | null>(
    initialAdvance === "home" || initialAdvance === "away"
      ? initialAdvance
      : null,
  );
  const [homeScore, setHomeScore] = useState(
    initialHomeScore != null ? String(initialHomeScore) : "",
  );
  const [awayScore, setAwayScore] = useState(
    initialAwayScore != null ? String(initialAwayScore) : "",
  );
  const [isPending, startTransition] = useTransition();

  if (locked) {
    const hasPrediction = initialAdvance === "home" || initialAdvance === "away";
    const advTeam = initialAdvance === "home" ? home : away;
    const hasScore = initialHomeScore != null && initialAwayScore != null;
    return (
      <div className="border-muted bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
        {hasPrediction ? (
          <span className="text-foreground inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <FlagDot team={advTeam} />
              <span className="font-medium">{advTeam.code} awansuje</span>
            </span>
            {hasScore ? (
              <span className="font-display font-semibold tabular-nums">
                {initialHomeScore}:{initialAwayScore}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                (bez typu wyniku)
              </span>
            )}
          </span>
        ) : (
          "Mecz się rozpoczął — nie obstawiłeś."
        )}
      </div>
    );
  }

  function handleSave() {
    if (isPending) return;
    if (!advance) {
      toast.error("Wybierz, kto awansuje");
      return;
    }

    const h = homeScore.trim();
    const a = awayScore.trim();
    if ((h === "") !== (a === "")) {
      toast.error("Podaj cały wynik (oba pola) albo zostaw oba puste");
      return;
    }

    const homeScorePred = h === "" ? null : Number(h);
    const awayScorePred = a === "" ? null : Number(a);

    startTransition(async () => {
      const result = await submitPrediction({
        matchId,
        prediction: advance,
        homeScorePred,
        awayScorePred,
      });
      if (result.ok) {
        toast.success("Typ zapisany", { duration: 1500 });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Kto awansuje */}
      <div className="flex flex-col gap-2">
        <span className="font-display text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Kto awansuje? · 1 pkt
        </span>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {([
            { side: "home" as const, team: home },
            { side: "away" as const, team: away },
          ]).map(({ side, team }) => {
            const isActive = advance === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => setAdvance(side)}
                disabled={isPending}
                aria-pressed={isActive}
                aria-label={`Awansuje ${team.name}`}
                className={cn(
                  "flex h-16 items-center justify-center gap-2 rounded-xl border-2 px-2 transition-all",
                  "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "active:translate-y-px disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card hover:border-foreground/40 hover:bg-muted",
                )}
              >
                <FlagDot team={team} />
                <span className="font-display truncate text-base font-bold tracking-tight">
                  {team.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dokładny wynik */}
      <div className="flex flex-col gap-2">
        <span className="font-display text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Dokładny wynik po 90 min · 1 pkt
        </span>
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <FlagDot team={home} />
            <Input
              name="homeScore"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              placeholder="–"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={isPending}
              aria-label={`Gole ${home.name}`}
              className="h-14 w-16 text-center text-2xl font-bold sm:w-20"
            />
          </div>
          <span className="text-muted-foreground text-xl font-semibold">:</span>
          <div className="flex items-center gap-2">
            <Input
              name="awayScore"
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              placeholder="–"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={isPending}
              aria-label={`Gole ${away.name}`}
              className="h-14 w-16 text-center text-2xl font-bold sm:w-20"
            />
            <FlagDot team={away} />
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={isPending || !advance}
        className="h-12 w-full text-base"
      >
        {isPending ? "Zapisuję…" : "Zapisz typ"}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Łącznie 2 pkt: 1 za awansującą drużynę, 1 za dokładny wynik po 90 min.
        Wynik możesz dopisać później — wszystko do gwizdka.
      </p>
    </div>
  );
}
