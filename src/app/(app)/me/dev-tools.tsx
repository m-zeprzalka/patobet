"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { grantSelfAdmin } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function DevTools({ isAdmin }: { isAdmin: boolean }) {
  const [granted, setGranted] = useState(isAdmin);
  const [isPending, startTransition] = useTransition();

  function handleGrant() {
    startTransition(async () => {
      const res = await grantSelfAdmin();
      if (res.status === "ok") {
        toast.success("Masz teraz role admina. Odśwież stronę.");
        setGranted(true);
      } else if (res.status === "error") {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="border-border bg-muted/30 rounded-lg border border-dashed p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          Tryb deweloperski
        </h2>
        <span className="text-muted-foreground text-[0.65rem] font-medium tracking-wider uppercase">
          NODE_ENV=dev
        </span>
      </div>
      <p className="text-muted-foreground mb-3 text-xs">
        Skróty dostępne tylko gdy <code>NODE_ENV=development</code>. W produkcji
        nie zobaczysz tej sekcji.
      </p>

      {granted ? (
        <div className="text-foreground rounded-md bg-energy/10 border border-energy/40 p-3 text-xs">
          ✓ Masz role <strong>admin</strong>. Idź do{" "}
          <a href="/admin" className="underline underline-offset-4">
            /admin
          </a>{" "}
          → kliknij <strong>Sync z OpenFootball</strong> żeby zaciągnąć mecze.
        </div>
      ) : (
        <Button
          type="button"
          onClick={handleGrant}
          disabled={isPending}
          className="h-10"
        >
          {isPending ? "Nadaję…" : "Nadaj sobie role admina"}
        </Button>
      )}
    </div>
  );
}
