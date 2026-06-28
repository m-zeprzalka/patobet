import { PredictionChip } from "@/components/matches/prediction-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatKickoffTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserPrediction } from "@/lib/matches";
import type { PredictionChoice } from "@/types/database";

type ChipState = "default" | "correct" | "wrong";

interface PredictionsListProps {
  predictions: UserPrediction[];
  correct: PredictionChoice | null;
  currentUserId: string;
  knockout?: boolean;
  homeCode?: string;
  awayCode?: string;
  actualHomeScore?: number | null;
  actualAwayScore?: number | null;
}

function MiniChip({
  children,
  state = "default",
  className,
}: {
  children: React.ReactNode;
  state?: ChipState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-display inline-flex h-7 items-center justify-center rounded-md border px-2 text-sm font-bold tabular-nums",
        state === "default" && "border-border bg-card text-foreground",
        state === "correct" && "border-energy/40 bg-energy text-energy-foreground",
        state === "wrong" &&
          "border-destructive/40 bg-destructive/15 text-destructive",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PredictionsList({
  predictions,
  correct,
  currentUserId,
  knockout = false,
  homeCode,
  awayCode,
  actualHomeScore = null,
  actualAwayScore = null,
}: PredictionsListProps) {
  if (predictions.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nikt jeszcze nie obstawił tego meczu.
      </p>
    );
  }

  const scoreKnown = actualHomeScore != null && actualAwayScore != null;

  return (
    <ul className="flex flex-col">
      {predictions.map((p, i) => {
        const isMe = p.user_id === currentUserId;
        const settled = p.points_awarded != null;

        // Stan dla wyświetlenia awansu/typu.
        const advanceState: ChipState = !settled
          ? correct === p.prediction && correct !== null
            ? "correct"
            : "default"
          : correct != null && p.prediction === correct
            ? "correct"
            : "wrong";

        const hasScorePred =
          p.home_score_pred != null && p.away_score_pred != null;
        const scoreState: ChipState =
          !settled || !scoreKnown
            ? "default"
            : hasScorePred &&
                p.home_score_pred === actualHomeScore &&
                p.away_score_pred === actualAwayScore
              ? "correct"
              : "wrong";

        return (
          <li
            key={p.user_id}
            className={cn(
              "border-border/60 flex items-center justify-between gap-3 py-2.5",
              i > 0 && "border-t",
              isMe && "bg-energy/5 -mx-2 rounded-md px-2",
            )}
          >
            <div className="flex items-center gap-3">
              <UserAvatar
                displayName={p.display_name}
                avatarUrl={p.avatar_url}
                className="size-8"
              />
              <div className="flex flex-col leading-tight">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isMe && "text-foreground",
                  )}
                >
                  {p.display_name}
                  {isMe ? (
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                      (Ty)
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground text-[0.7rem]">
                  Obstawił {formatKickoffTime(p.submitted_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {settled ? (
                <span
                  className={cn(
                    "font-display text-xs font-semibold tabular-nums",
                    (p.points_awarded ?? 0) > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {(p.points_awarded ?? 0) > 0 ? `+${p.points_awarded}` : "0"}
                </span>
              ) : null}

              {knockout ? (
                <div className="flex items-center gap-1.5">
                  {hasScorePred ? (
                    <MiniChip state={scoreState}>
                      {p.home_score_pred}:{p.away_score_pred}
                    </MiniChip>
                  ) : null}
                  <MiniChip state={advanceState}>
                    {p.prediction === "home" ? homeCode : awayCode}
                    <span aria-hidden className="ml-0.5 opacity-70">
                      ↑
                    </span>
                  </MiniChip>
                </div>
              ) : (
                <PredictionChip value={p.prediction} state={advanceState} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
