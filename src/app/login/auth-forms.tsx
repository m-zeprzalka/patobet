"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  signIn,
  signUp,
  type SignInState,
  type SignUpState,
} from "./actions";

const SIGNIN_INIT: SignInState = { status: "idle" };
const SIGNUP_INIT: SignUpState = { status: "idle" };

type Mode = "signin" | "signup";

export function AuthForms({ defaultMode = "signin" }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  return (
    <div className="flex flex-col gap-5">
      <div className="border-border bg-muted/40 flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          aria-pressed={mode === "signin"}
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium transition-colors",
            mode === "signin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Logowanie
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          aria-pressed={mode === "signup"}
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium transition-colors",
            mode === "signup"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Rejestracja
        </button>
      </div>

      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}

function SignInForm() {
  const [state, action, isPending] = useActionState(signIn, SIGNIN_INIT);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="ty@example.com"
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="signin-password">Hasło</Label>
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            Zapomniałem
          </Link>
        </div>
        <PasswordInput
          id="signin-password"
          name="password"
          autoComplete="current-password"
          required
          className="h-12 text-base"
        />
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? "Loguję…" : "Zaloguj się"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [state, action, isPending] = useActionState(signUp, SIGNUP_INIT);

  if (state.status === "needs_confirmation") {
    return (
      <div
        role="status"
        className="border-energy/40 bg-energy/10 rounded-md border p-5 text-sm"
      >
        <p className="font-display text-foreground text-base font-semibold">
          Potwierdź email
        </p>
        <p className="text-muted-foreground mt-1">
          Wysłaliśmy link aktywacyjny na{" "}
          <strong className="text-foreground">{state.email}</strong>. Klik i
          wracaj — będziesz zalogowany.
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          Aby pominąć ten krok: Supabase → Authentication → Providers → Email →
          wyłącz <em>Confirm email</em>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="ty@example.com"
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">Hasło</Label>
        <PasswordInput
          id="signup-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          placeholder="min. 8 znaków"
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-nick">
          Nick{" "}
          <span className="text-muted-foreground text-xs font-normal">
            (opcjonalnie, możesz później)
          </span>
        </Label>
        <Input
          id="signup-nick"
          name="displayName"
          autoComplete="nickname"
          maxLength={24}
          placeholder="np. Śruba23"
          className="h-12 text-base"
        />
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isPending}>
        {isPending ? "Tworzę konto…" : "Załóż konto"}
      </Button>
    </form>
  );
}
