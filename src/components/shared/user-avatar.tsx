import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  displayName: string | null;
  avatarUrl: string | null;
  className?: string;
}

function initials(displayName: string | null): string {
  if (!displayName) return "?";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ displayName, avatarUrl, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("border-border/60 border", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName ?? "Avatar"} /> : null}
      <AvatarFallback className="bg-secondary text-secondary-foreground font-display text-xs font-semibold">
        {initials(displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
