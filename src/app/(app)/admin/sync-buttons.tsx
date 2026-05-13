"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { forceSyncOpenFootball } from "./actions";

export function SyncButtons() {
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await forceSyncOpenFootball();
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        Pobiera drużyny + harmonogram + wyniki z{" "}
        <a
          href="https://github.com/openfootball/worldcup.json"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          openfootball/worldcup.json
        </a>
        . Mecze z placeholderami (`W101`, `1A`) są pomijane — dorzucają się przy
        następnym sync po wyłonieniu drużyn.
      </p>
      <Button
        type="button"
        size="lg"
        className="h-11 self-start px-6"
        disabled={isPending}
        onClick={run}
      >
        {isPending ? "Pobieram…" : "Sync z OpenFootball"}
      </Button>
    </div>
  );
}
