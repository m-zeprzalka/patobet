"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  requestPasswordReset,
  type ForgotState,
} from "@/app/login/actions";

const INITIAL: ForgotState = { status: "idle" };

export function ForgotForm() {
  const [state, action, isPending] = useActionState(
    requestPasswordReset,
    INITIAL,
  );

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="border-energy/40 bg-energy/10 rounded-md border p-5 text-sm"
      >
        <p className="font-display text-foreground text-base font-semibold">
          Sprawdź pocztę
        </p>
        <p className="text-muted-foreground mt-1">
          Jeśli{" "}
          <strong className="text-foreground">{state.email}</strong> istnieje w
          bazie, wysłaliśmy link do resetu hasła.
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          Link wygasa za godzinę. Sprawdź też spam.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="ty@example.com"
          className="h-12 text-base"
        />
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? "Wysyłam…" : "Wyślij link resetujący"}
      </Button>
    </form>
  );
}
