const TZ = "Europe/Warsaw";

const dateFmt = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const dateLongFmt = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFmt = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const dayKeyFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatKickoffDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatKickoffDateLong(iso: string): string {
  return dateLongFmt.format(new Date(iso));
}

export function formatKickoffTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function dayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso));
}

export function dayLabel(iso: string): string {
  const key = dayKey(iso);
  const todayKey = dayKey(new Date().toISOString());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = dayKey(tomorrow.toISOString());

  if (key === todayKey) return "Dzisiaj";
  if (key === tomorrowKey) return "Jutro";
  return formatKickoffDateLong(iso);
}

export function timeUntilKickoff(iso: string, now = new Date()): string {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.floor(abs / 60_000);

  if (minutes < 1) return past ? "tuż po gwizdku" : "tuż przed gwizdkiem";
  if (minutes < 60) {
    return past ? `${minutes} min temu` : `za ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 24) {
    return past
      ? `${hours}h ${remMin}min temu`
      : `za ${hours}h ${remMin}min`;
  }
  const days = Math.floor(hours / 24);
  return past ? `${days} dni temu` : `za ${days} dni`;
}
