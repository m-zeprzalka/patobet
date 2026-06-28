"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  initialPrediction: PredictionChoice | null; // 1/X/2 po 90 min
  initialAdvance: PredictionChoice | null; // kto awansuje
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

const RESULT_CHOICES: Array<{
  value: PredictionChoice;
  glyph: string;
  hint: (h: string, a: string) => string;
}> = [
  { value: "home", glyph: "1", hint: (h) => `Wygrana ${h}` },
  { value: "draw", glyph: "X", hint: () => "Remis" },
  { value: "away", glyph: "2", hint: (_, a) => `Wygrana ${a}` },
];

export function KnockoutPredictForm({
  matchId,
  home,
  away,
  initialPrediction,
  initialAdvance,
  locked,
}: KnockoutPredictFormProps) {
  const [result, setResult] = useState<PredictionChoice | null>(
    initialPrediction,
  );
  const [advance, setAdvance] = useState<Side | null>(
    initialAdvance === "home" || initialAdvance === "away"
      ? initialAdvance
      : null,
  );
  const [isPending, startTransition] = useTransition();

  if (locked) {
    const hasResult = initialPrediction != null;
    const resultGlyph =
      initialPrediction === "home"
        ? "1"
        : initialPrediction === "away"
          ? "2"
          : initialPrediction === "draw"
            ? "X"
            : "—";
    const advTeam = initialAdvance === "home" ? home : away;
    const hasAdvance =
      initialAdvance === "home" || initialAdvance === "away";
    return (
      <div className="border-muted bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
        {hasResult || hasAdvance ? (
          <span className="text-foreground inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Wynik:</span>
              <span className="font-display font-bold">{resultGlyph}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Awans:</span>
              {hasAdvance ? (
                <span className="inline-flex items-center gap-1">
                  <FlagDot team={advTeam} />
                  <span className="font-medium">{advTeam.code}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </span>
        ) : (
          "Mecz się rozpoczął — nie obstawiłeś."
        )}
      </div>
    );
  }

  function handleSave() {
    if (isPending) return;
    if (!result) {
      toast.error("Wybierz wynik 1, X albo 2");
      return;
    }
    startTransition(async () => {
      const res = await submitPrediction({
        matchId,
        prediction: result,
        advancePick: advance,
      });
      if (res.ok) {
        toast.success("Typ zapisany", { duration: 1500 });
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1/X/2 po 90 min */}
      <div className="flex flex-col gap-2">
        <span className="font-display text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Wynik po 90 min · 1 pkt
        </span>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {RESULT_CHOICES.map((c) => {
            const isActive = result === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setResult(c.value)}
                disabled={isPending}
                aria-pressed={isActive}
                aria-label={c.hint(home.code, away.code)}
                className={cn(
                  "group relative flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-all",
                  "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "active:translate-y-px disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card hover:border-foreground/40 hover:bg-muted",
                )}
              >
                <span className="font-display text-2xl font-bold leading-none tracking-tight">
                  {c.glyph}
                </span>
                <span
                  className={cn(
                    "text-[0.6rem] font-medium tracking-wide uppercase",
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {c.hint(home.code, away.code)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
                  "flex h-14 items-center justify-center gap-2 rounded-xl border-2 px-2 transition-all",
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

      <Button
        type="button"
        onClick={handleSave}
        disabled={isPending || !result}
        className="h-12 w-full text-base"
      >
        {isPending ? "Zapisuję…" : "Zapisz typ"}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Łącznie 2 pkt: 1 za wynik 1/X/2 po 90 min, 1 za to, kto ostatecznie
        awansuje. Możesz zmienić do gwizdka.
      </p>
    </div>
  );
}
