"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatchStage } from "@/types/database";

import { setMatchResult } from "./actions";

interface MatchResultFormProps {
  matchId: string;
  stage: MatchStage;
  homeCode: string;
  awayCode: string;
  initialHome: number | null;
  initialAway: number | null;
  initialWinnerSide: "home" | "away" | null;
}

export function MatchResultForm({
  matchId,
  stage,
  homeCode,
  awayCode,
  initialHome,
  initialAway,
  initialWinnerSide,
}: MatchResultFormProps) {
  const [isPending, startTransition] = useTransition();
  const [winnerSide, setWinnerSide] = useState<"home" | "away" | "none">(
    initialWinnerSide ?? "none",
  );

  function onSubmit(formData: FormData) {
    formData.set("matchId", matchId);
    if (stage !== "group") formData.set("winnerSide", winnerSide);
    startTransition(async () => {
      const res = await setMatchResult(formData);
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <form
      action={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
    >
      <div className="flex flex-1 items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`home-${matchId}`} className="text-xs">
            {homeCode}
          </Label>
          <Input
            id={`home-${matchId}`}
            name="homeScore"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            required
            defaultValue={initialHome ?? ""}
            className="h-10 w-16 text-center"
          />
        </div>
        <span className="text-muted-foreground pb-3 text-sm">:</span>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`away-${matchId}`} className="text-xs">
            {awayCode}
          </Label>
          <Input
            id={`away-${matchId}`}
            name="awayScore"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            required
            defaultValue={initialAway ?? ""}
            className="h-10 w-16 text-center"
          />
        </div>
      </div>

      {stage !== "group" ? (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Awansuje</Label>
          <div className="flex gap-1">
            {(["home", "away"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setWinnerSide(side)}
                className={`h-10 rounded-md border px-3 text-sm font-medium transition-colors ${
                  winnerSide === side
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {side === "home" ? homeCode : awayCode}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-10"
        disabled={
          isPending || (stage !== "group" && winnerSide === "none")
        }
      >
        {isPending ? "Zapisuję…" : "Zapisz i rozlicz"}
      </Button>
    </form>
  );
}
