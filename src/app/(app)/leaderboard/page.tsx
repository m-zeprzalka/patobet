import { UserAvatar } from "@/components/shared/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { requireUserWithProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LeaderboardRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  predictions_made: number;
  predictions_settled: number;
  correct_predictions: number;
  accuracy_pct: number;
}

export default async function LeaderboardPage() {
  const { user } = await requireUserWithProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leaderboard")
    .select(
      "user_id, display_name, avatar_url, total_points, predictions_made, predictions_settled, correct_predictions, accuracy_pct",
    )
    .order("total_points", { ascending: false })
    .order("correct_predictions", { ascending: false })
    .order("display_name", { ascending: true });

  if (error) throw error;
  const rows = (data ?? []) as LeaderboardRow[];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Tabela
        </h1>
        <p className="text-muted-foreground text-sm">
          1 pkt za każde trafienie. Brak typu = 0 pkt, ale Cię nie wyklucza.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span aria-hidden className="text-3xl">🏆</span>
            <h2 className="font-display text-lg font-semibold">
              Jeszcze nikt nie obstawił
            </h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Po pierwszych rozliczeniach tabela się zapełni.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-3 py-2 sm:px-4">
            <ol className="flex flex-col">
              {rows.map((row, idx) => {
                const isMe = row.user_id === user.id;
                const position = idx + 1;
                return (
                  <li
                    key={row.user_id}
                    className={cn(
                      "border-border/60 grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 sm:gap-4",
                      idx > 0 && "border-t",
                      isMe && "bg-energy/5 -mx-1 rounded-md px-1",
                    )}
                  >
                    <span
                      className={cn(
                        "font-display text-center text-base font-bold tabular-nums",
                        position === 1
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {position}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        displayName={row.display_name}
                        avatarUrl={row.avatar_url}
                        className="size-9"
                      />
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-sm font-medium">
                          {row.display_name}
                          {isMe ? (
                            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                              (Ty)
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground text-[0.7rem]">
                          {row.correct_predictions}/{row.predictions_settled}{" "}
                          trafień · {row.accuracy_pct}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-foreground text-xl font-bold tabular-nums">
                        {row.total_points}
                      </div>
                      <div className="text-muted-foreground text-[0.65rem] tracking-wider uppercase">
                        pkt
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
