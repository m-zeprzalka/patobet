"use client";

import { useActionState } from "react";

import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { updatePassword, type ResetState } from "@/app/login/actions";

const INITIAL: ResetState = { status: "idle" };

export function ResetForm() {
  const [state, action, isPending] = useActionState(updatePassword, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nowe hasło</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          placeholder="min. 8 znaków"
          className="h-12 text-base"
        />
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? "Zapisuję…" : "Ustaw nowe hasło"}
      </Button>
    </form>
  );
}
