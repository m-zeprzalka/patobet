"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateProfile, type ProfileState } from "./actions";

const INITIAL: ProfileState = { status: "idle" };

export function EditProfileForm({ defaultDisplayName }: { defaultDisplayName: string }) {
  const [state, action, isPending] = useActionState(updateProfile, INITIAL);

  useEffect(() => {
    if (state.status === "saved") {
      toast.success("Profil zaktualizowany");
    }
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Nick</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          defaultValue={defaultDisplayName}
          maxLength={24}
          className="h-11"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={
            state.status === "error" ? "displayName-error" : undefined
          }
        />
        {state.status === "error" ? (
          <p
            id="displayName-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="h-11 self-start px-6" disabled={isPending}>
        {isPending ? "Zapisuję…" : "Zapisz"}
      </Button>
    </form>
  );
}
