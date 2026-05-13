import { cn } from "@/lib/utils";
import type { PredictionChoice } from "@/types/database";

const CHIP_LABEL: Record<PredictionChoice, string> = {
  home: "1",
  draw: "X",
  away: "2",
};

interface PredictionChipProps {
  value: PredictionChoice;
  state?: "default" | "correct" | "wrong";
  className?: string;
  size?: "sm" | "md";
}

export function PredictionChip({
  value,
  state = "default",
  className,
  size = "md",
}: PredictionChipProps) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-center justify-center rounded-md border font-bold",
        size === "sm" ? "h-6 min-w-7 text-xs px-1.5" : "h-7 min-w-9 text-sm px-2",
        state === "default" &&
          "border-border bg-card text-foreground",
        state === "correct" &&
          "border-energy/40 bg-energy text-energy-foreground",
        state === "wrong" &&
          "border-destructive/40 bg-destructive/15 text-destructive line-through decoration-2",
        className,
      )}
    >
      {CHIP_LABEL[value]}
    </span>
  );
}

export function predictionLabel(value: PredictionChoice): string {
  return CHIP_LABEL[value];
}
