import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getProfile, getSessionUser } from "@/lib/auth";
import { APP } from "@/lib/constants";

import { SiteHeaderUserMenu } from "./site-header-user-menu";

export async function SiteHeader() {
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.id) : null;

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span
            aria-hidden
            className="bg-energy text-energy-foreground inline-flex h-7 w-7 items-center justify-center rounded-md font-display text-[11px] font-bold tracking-tight"
          >
            PB
          </span>
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">
            {APP.name}
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild size="sm" className="h-9 px-3">
                <Link href={profile?.display_name ? "/matches" : "/onboarding/nick"}>
                  {profile?.display_name ? "Mecze" : "Dokończ rejestrację"}
                  <span aria-hidden className="ml-1">→</span>
                </Link>
              </Button>
              <SiteHeaderUserMenu
                email={user.email ?? ""}
                displayName={profile?.display_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </>
          ) : (
            <Button asChild size="sm" className="h-9 px-4">
              <Link href="/login">Zaloguj się</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
