import Image from "next/image";

import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  name: string;
  code: string;
  flagUrl: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  sm: { box: "size-7", text: "text-xs", width: 28 },
  md: { box: "size-10", text: "text-sm", width: 40 },
  lg: { box: "size-14 sm:size-16", text: "text-base", width: 64 },
} as const;

export function TeamBadge({
  name,
  code,
  flagUrl,
  size = "md",
  className,
}: TeamBadgeProps) {
  const s = SIZE[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "bg-muted border-border/60 relative overflow-hidden rounded-md border",
          s.box,
        )}
        aria-hidden
      >
        {flagUrl ? (
          <Image
            src={flagUrl}
            alt=""
            fill
            sizes={`${s.width}px`}
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="font-display absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold">
            {code}
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn("font-medium", s.text)}>{name}</span>
        <span className="text-muted-foreground text-[0.65rem] font-medium tracking-wider uppercase">
          {code}
        </span>
      </div>
    </div>
  );
}
