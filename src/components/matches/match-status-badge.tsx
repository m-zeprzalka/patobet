import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchStatus } from "@/types/database";

const STATUS: Record<
  MatchStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  scheduled: {
    label: "Zaplanowany",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  live: {
    label: "Na żywo",
    className:
      "bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20",
    pulse: true,
  },
  finished: {
    label: "Zakończony",
    className: "bg-secondary text-secondary-foreground border-transparent",
  },
  postponed: {
    label: "Przełożony",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  cancelled: {
    label: "Odwołany",
    className: "bg-muted text-muted-foreground border-transparent line-through",
  },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const s = STATUS[status];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", s.className)}>
      {s.pulse ? (
        <span
          aria-hidden
          className="bg-destructive size-1.5 animate-pulse rounded-full"
        />
      ) : null}
      {s.label}
    </Badge>
  );
}
