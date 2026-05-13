"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Wszystkie" },
  { value: "today", label: "Dzisiaj" },
  { value: "tomorrow", label: "Jutro" },
  { value: "group", label: "Grupowa" },
  { value: "knockout", label: "Pucharowa" },
] as const;

export type MatchFilterValue = (typeof FILTERS)[number]["value"];

export function MatchFilter() {
  const params = useSearchParams();
  const current = (params.get("filter") ?? "all") as MatchFilterValue;

  return (
    <nav
      aria-label="Filtruj mecze"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex gap-2 pb-2">
        {FILTERS.map((f) => {
          const isActive = current === f.value;
          const href = f.value === "all" ? "/matches" : `/matches?filter=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
