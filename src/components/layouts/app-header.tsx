import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { APP } from "@/lib/constants";

import { UserMenu } from "./user-menu";

interface AppHeaderProps {
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

const NAV_ITEMS = [
  { href: "/matches", label: "Mecze" },
  { href: "/leaderboard", label: "Tabela" },
  { href: "/me", label: "Profil" },
] as const;

export function AppHeader({ displayName, avatarUrl, isAdmin }: AppHeaderProps) {
  return (
    <header className="border-border/60 bg-background/85 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/matches"
          className="focus-visible:ring-ring flex items-center gap-2 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <span
            aria-hidden
            className="bg-energy text-energy-foreground inline-flex h-7 w-7 items-center justify-center rounded-md font-display text-[11px] font-bold tracking-tight"
          >
            PB
          </span>
          <span className="font-display hidden text-sm font-semibold tracking-tight sm:inline">
            {APP.name}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-muted focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu
            displayName={displayName}
            avatarUrl={avatarUrl}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}
