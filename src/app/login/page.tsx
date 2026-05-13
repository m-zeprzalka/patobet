import { redirect } from "next/navigation";

import { signOut } from "@/app/(app)/actions";
import { SiteFooter } from "@/components/layouts/site-footer";
import { SiteHeader } from "@/components/layouts/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfile, getSessionUser } from "@/lib/auth";

import { AuthForms } from "./auth-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: "signup" | "signin" }>;
}) {
  const { error, mode } = await searchParams;
  const user = await getSessionUser();

  if (user && error !== "missing_profile") {
    const profile = await getProfile(user.id);
    if (profile?.display_name) redirect("/matches");
    if (profile && !profile.display_name) redirect("/onboarding/nick");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10 sm:px-6 sm:py-12">
        {user ? (
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="font-display text-destructive text-lg tracking-tight">
                Brak profilu w bazie
              </CardTitle>
              <CardDescription>
                Twoje konto auth istnieje ({user.email}), ale wiersz w tabeli{" "}
                <code>profiles</code> nie powstał. Migracja{" "}
                <code>0002_profile_insert_and_backfill.sql</code> najpewniej
                nie została uruchomiona.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="text-muted-foreground rounded-md bg-muted/40 p-3 text-xs">
                <p className="text-foreground mb-1 font-medium">Co zrobić:</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>
                    Supabase Studio → SQL Editor → wklej zawartość{" "}
                    <code>supabase/migrations/0002_profile_insert_and_backfill.sql</code>{" "}
                    → Run.
                  </li>
                  <li>Wyloguj się tutaj i zaloguj ponownie.</li>
                </ol>
              </div>
              <form action={signOut}>
                <Button type="submit" variant="outline" className="h-10 w-full">
                  Wyloguj i spróbuj ponownie
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="gap-2">
              <CardTitle className="font-display text-2xl tracking-tight text-center">
                Mundial z przyjaciółmi.
              </CardTitle>
              <CardDescription className="text-center">
                Sprawdź kto jest papierowym kozakiem przewidywania wyników meczów.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForms defaultMode={mode === "signup" ? "signup" : "signin"} />
            </CardContent>
          </Card>
        )}

      </main>
      <SiteFooter />
    </>
  );
}
