import type { OfTeam, OfWorldCup } from "./types";

const BASE =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026";

export class OpenFootballError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "OpenFootballError";
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${BASE}/${path}`, {
      signal: ctrl.signal,
      // GitHub raw CDN ma własny cache ~5 min; my pomijamy Next cache,
      // żeby admin "force sync" zawsze pobierał świeżą wersję.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new OpenFootballError(
        `GitHub raw zwróciło ${res.status} dla ${path}`,
        res.status,
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTeams(): Promise<OfTeam[]> {
  return fetchJson<OfTeam[]>("worldcup.teams_meta.json");
}

export async function fetchFixtures(): Promise<OfWorldCup> {
  return fetchJson<OfWorldCup>("worldcup.json");
}
