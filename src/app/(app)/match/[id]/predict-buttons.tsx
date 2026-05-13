"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { PredictionChoice } from "@/types/database";

import { submitPrediction } from "./actions";

interface PredictButtonsProps {
  matchId: string;
  initialPrediction: PredictionChoice | null;
  homeCode: string;
  awayCode: string;
  locked: boolean;
}

const CHOICES: Array<{
  value: PredictionChoice;
  glyph: string;
  hint: (homeCode: string, awayCode: string) => string;
}> = [
  { value: "home", glyph: "1", hint: (h) => `Wygrana ${h}` },
  { value: "draw", glyph: "X", hint: () => "Remis" },
  { value: "away", glyph: "2", hint: (_, a) => `Wygrana ${a}` },
];

export function PredictButtons({
  matchId,
  initialPrediction,
  homeCode,
  awayCode,
  locked,
}: PredictButtonsProps) {
  const [confirmed, setConfirmed] = useState<PredictionChoice | null>(initialPrediction);
  const [optimistic, setOptimistic] = useOptimistic<
    PredictionChoice | null,
    PredictionChoice
  >(confirmed, (_state, next) => next);
  const [isPending, startTransition] = useTransition();

  if (locked) {
    return (
      <div className="border-muted bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
        Mecz się rozpoczął — typowanie zamknięte.
      </div>
    );
  }

  function handleClick(choice: PredictionChoice) {
    if (isPending) return;
    startTransition(async () => {
      setOptimistic(choice);
      const result = await submitPrediction(matchId, choice);
      if (result.ok) {
        setConfirmed(result.prediction);
        toast.success(
          choice === confirmed
            ? "Typ potwierdzony"
            : "Typ zapisany",
          { duration: 1500 },
        );
      } else {
        setConfirmed(confirmed);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {CHOICES.map((c) => {
          const isActive = optimistic === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => handleClick(c.value)}
              disabled={isPending}
              aria-pressed={isActive}
              aria-label={c.hint(homeCode, awayCode)}
              className={cn(
                "group relative flex h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all sm:h-24",
                "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "active:translate-y-px disabled:opacity-60",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card hover:border-foreground/40 hover:bg-muted",
              )}
            >
              <span className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl">
                {c.glyph}
              </span>
              <span
                className={cn(
                  "text-[0.65rem] font-medium tracking-wide uppercase",
                  isActive
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {c.hint(homeCode, awayCode)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-center text-xs">
        {confirmed
          ? "Możesz zmienić typ do gwizdka."
          : "Wybierz 1, X albo 2. Możesz zmienić do gwizdka."}
      </p>
    </div>
  );
}
