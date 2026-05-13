import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { TeamBadge } from "@/components/matches/team-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { formatKickoffDate, formatKickoffTime } from "@/lib/format";
import { getMatchesWithDetails, stageLabel } from "@/lib/matches";

import { MatchResultForm } from "./match-result-form";
import { SyncButtons } from "./sync-buttons";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const matches = await getMatchesWithDetails(user.id);

  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Panel admina
        </h1>
        <p className="text-muted-foreground text-sm">
          Sync danych z OpenFootball i ręczna edycja wyników (fallback gdy
          repo nie nadąży).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-tight">
            Synchronizacja
          </CardTitle>
          <CardDescription>
            Wymaga <code>SUPABASE_SERVICE_ROLE_KEY</code> w env. W trakcie
            turnieju cron robi to automatycznie co 30 min; tutaj możesz wymusić
            ręcznie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncButtons />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-tight">
            Mecze ({matches.length})
          </CardTitle>
          <CardDescription>
            Wpisz wynik po 90 min. W fazie pucharowej zaznacz kto awansuje (po dogrywce/karnych).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-4">
          <ul className="flex flex-col">
            {matches.map((m, idx) => {
              const initialWinnerSide =
                m.stage !== "group" && m.winner_team_id
                  ? m.winner_team_id === m.home_team.id
                    ? "home"
                    : "away"
                  : null;
              return (
                <li
                  key={m.id}
                  className={`border-border/60 flex flex-col gap-3 py-4 ${
                    idx > 0 ? "border-t" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col leading-tight">
                      <span className="text-muted-foreground text-xs font-medium">
                        {stageLabel(m.stage)}
                        {m.group_letter ? ` · Grupa ${m.group_letter}` : ""}
                      </span>
                      <span className="text-sm font-medium">
                        {formatKickoffDate(m.kickoff_at)} ·{" "}
                        {formatKickoffTime(m.kickoff_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MatchStatusBadge status={m.status} />
                      {m.settled_at ? (
                        <span className="border-energy/40 bg-energy/15 text-energy-foreground rounded-full border px-2 py-0.5 text-[0.65rem] font-medium">
                          rozliczony
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <TeamBadge
                      name={m.home_team.name}
                      code={m.home_team.code}
                      flagUrl={m.home_team.flag_url}
                      size="sm"
                    />
                    <span className="text-muted-foreground text-xs">vs</span>
                    <TeamBadge
                      name={m.away_team.name}
                      code={m.away_team.code}
                      flagUrl={m.away_team.flag_url}
                      size="sm"
                      className="flex-row-reverse text-right [&>div:last-child]:items-end"
                    />
                  </div>

                  <MatchResultForm
                    matchId={m.id}
                    stage={m.stage}
                    homeCode={m.home_team.code}
                    awayCode={m.away_team.code}
                    initialHome={m.home_score}
                    initialAway={m.away_score}
                    initialWinnerSide={initialWinnerSide}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg tracking-tight">
            Jak nadać sobie admina
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="text-muted-foreground">
            Supabase Studio → SQL Editor:
          </p>
          <pre className="bg-muted/60 mt-2 overflow-x-auto rounded-md p-3 text-xs">
            <code>select admin_grant(&apos;TwojNick&apos;);</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
