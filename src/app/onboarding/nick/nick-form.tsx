"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { setNickname, type NickState } from "./actions";

const INITIAL: NickState = { status: "idle" };

export function NickForm({ defaultValue }: { defaultValue?: string }) {
  const [state, action, isPending] = useActionState(setNickname, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Nick</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="nickname"
          required
          defaultValue={defaultValue}
          placeholder="np. Zlatan z osiedla"
          maxLength={24}
          className="h-12 text-base"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? "nick-error" : undefined}
        />
        {state.status === "error" ? (
          <p id="nick-error" role="alert" className="text-destructive text-sm">
            {state.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Tak będą Cię widzieć inni w tabeli. Możesz zmienić później w
            profilu.
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={isPending}
      >
        {isPending ? "Zapisuję…" : "Zaczynamy"}
      </Button>
    </form>
  );
}
