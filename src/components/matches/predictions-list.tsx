import { PredictionChip } from "@/components/matches/prediction-chip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatKickoffTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserPrediction } from "@/lib/matches";
import type { PredictionChoice } from "@/types/database";

interface PredictionsListProps {
  predictions: UserPrediction[];
  correct: PredictionChoice | null;
  currentUserId: string;
}

export function PredictionsList({
  predictions,
  correct,
  currentUserId,
}: PredictionsListProps) {
  if (predictions.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nikt jeszcze nie obstawił tego meczu.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {predictions.map((p, i) => {
        const isMe = p.user_id === currentUserId;
        const state: "default" | "correct" | "wrong" =
          p.points_awarded == null
            ? "default"
            : p.points_awarded > 0
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
              {p.points_awarded != null ? (
                <span
                  className={cn(
                    "font-display text-xs font-semibold tabular-nums",
                    p.points_awarded > 0
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {p.points_awarded > 0 ? "+3" : "0"}
                </span>
              ) : null}
              <PredictionChip
                value={p.prediction}
                state={
                  correct && p.points_awarded != null
                    ? state
                    : correct === p.prediction && correct !== null
                      ? "correct"
                      : "default"
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
