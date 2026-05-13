import { MatchCard } from "@/components/matches/match-card";
import { MatchFilter, type MatchFilterValue } from "@/components/matches/match-filter";
import { requireUserWithProfile } from "@/lib/auth";
import { dayKey, dayLabel } from "@/lib/format";
import { getMatchesWithDetails, type MatchWithDetails } from "@/lib/matches";

export const dynamic = "force-dynamic";

const KNOCKOUT_STAGES = new Set([
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
]);

function applyFilter(
  matches: MatchWithDetails[],
  filter: MatchFilterValue,
): MatchWithDetails[] {
  if (filter === "all") return matches;

  if (filter === "today" || filter === "tomorrow") {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetKey = dayKey((filter === "today" ? today : tomorrow).toISOString());
    return matches.filter((m) => dayKey(m.kickoff_at) === targetKey);
  }

  if (filter === "group") {
    return matches.filter((m) => m.stage === "group");
  }
  if (filter === "knockout") {
    return matches.filter((m) => KNOCKOUT_STAGES.has(m.stage));
  }
  return matches;
}

function groupByDay(
  matches: MatchWithDetails[],
): Array<{ key: string; label: string; matches: MatchWithDetails[] }> {
  const map = new Map<string, MatchWithDetails[]>();
  for (const m of matches) {
    const k = dayKey(m.kickoff_at);
    const list = map.get(k);
    if (list) list.push(m);
    else map.set(k, [m]);
  }
  return [...map.entries()].map(([key, ms]) => ({
    key,
    label: dayLabel(ms[0].kickoff_at),
    matches: ms,
  }));
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: MatchFilterValue }>;
}) {
  const { user } = await requireUserWithProfile();
  const { filter: filterParam } = await searchParams;
  const filter: MatchFilterValue = filterParam ?? "all";

  const matches = await getMatchesWithDetails(user.id);
  const filtered = applyFilter(matches, filter);
  const grouped = groupByDay(filtered);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Mecze
        </h1>
        <p className="text-muted-foreground text-sm">
          Typujesz 1, X albo 2 do gwizdka. Potem już nic nie zmienisz.
        </p>
      </header>

      <div className="bg-background/95 sticky top-14 z-30 -mx-4 mb-6 border-b px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <MatchFilter />
      </div>

      {grouped.length === 0 ? (
        <EmptyMatches filter={filter} />
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((group) => (
            <section key={group.key} className="flex flex-col gap-3">
              <h2 className="font-display text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {group.label}
              </h2>
              <div className="flex flex-col gap-3">
                {group.matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyMatches({ filter }: { filter: MatchFilterValue }) {
  const msg =
    filter === "today"
      ? "Dzisiaj brak meczów. Wracaj rano dnia meczowego."
      : filter === "tomorrow"
        ? "Jutro brak meczów."
        : "Harmonogram jeszcze nie jest wgrany. Admin pobierze go przed turniejem.";
  return (
    <div className="border-border/60 bg-card flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
      <span aria-hidden className="text-3xl">⚽</span>
      <h2 className="font-display text-lg font-semibold">Pusto</h2>
      <p className="text-muted-foreground max-w-sm text-sm">{msg}</p>
    </div>
  );
}
